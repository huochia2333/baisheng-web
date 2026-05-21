"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { useTranslations } from "next-intl";

import type { AdminPersonRow } from "@/lib/admin-people";
import type { AdminVipRequestAction } from "@/lib/admin-people-vip-mutations";

import {
  normalizeAdminPeopleErrorCode,
  readAdminPeopleUpdateResponse,
  type AdminPeopleFeedback,
} from "./admin-people-view-model-utils";

export function useAdminPeopleVipActions({
  setFeedback,
  setPeople,
}: {
  setFeedback: Dispatch<SetStateAction<AdminPeopleFeedback | null>>;
  setPeople: Dispatch<SetStateAction<AdminPersonRow[]>>;
}) {
  const t = useTranslations("AdminPeople");
  const [vipActionPendingId, setVipActionPendingId] = useState<string | null>(null);

  const handleVipRequestAction = async (
    requestId: string,
    action: AdminVipRequestAction,
  ) => {
    if (vipActionPendingId) {
      return;
    }

    setVipActionPendingId(requestId);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/people/vip-request", {
        body: JSON.stringify({
          requestId,
          action,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await readAdminPeopleUpdateResponse(response);

      if (!response.ok || !result.person) {
        setFeedback({
          tone: "error",
          message: t(`errors.${normalizeAdminPeopleErrorCode(result.error)}`),
        });
        return;
      }

      setPeople((currentPeople) =>
        currentPeople.map((person) =>
          person.user_id === result.person?.user_id ? result.person : person,
        ),
      );
      setFeedback({
        tone: "success",
        message:
          action === "approve"
            ? t("feedback.vipApproved")
            : t("feedback.vipRejected"),
      });
    } catch {
      setFeedback({
        tone: "error",
        message: t("errors.serviceUnavailable"),
      });
    } finally {
      setVipActionPendingId(null);
    }
  };

  return {
    handleVipRequestAction,
    vipActionPendingId,
  };
}
