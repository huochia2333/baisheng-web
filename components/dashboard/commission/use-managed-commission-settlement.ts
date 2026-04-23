"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import type { AdminCommissionRow } from "@/lib/admin-commission";
import {
  markCommissionRecordAsPaid,
  markTaskCommissionRecordAsPaid,
} from "@/lib/commission-settlement";
import type { getBrowserSupabaseClient } from "@/lib/supabase";
import type { TaskCommissionRow } from "@/lib/task-commissions";

import type { NoticeTone } from "@/components/dashboard/dashboard-shared-ui";

import { toCommissionErrorMessage } from "./commission-display";

type PageFeedbackValue = {
  message: string;
  tone: NoticeTone;
};

export function useManagedCommissionSettlement({
  onPageFeedback,
  refreshCommissionBoard,
  supabase,
}: {
  onPageFeedback: (feedback: PageFeedbackValue | null) => void;
  refreshCommissionBoard: () => Promise<void>;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
}) {
  const t = useTranslations("Commission");
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const handleMarkCommissionAsPaid = useCallback(
    async (commission: AdminCommissionRow) => {
      if (!supabase || settlingKey) {
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          t("actions.confirmMarkOrderPaid", {
            orderNumber: commission.orderNumber,
          }),
        );

        if (!confirmed) {
          return;
        }
      }

      setSettlingKey(`order:${commission.id}`);

      try {
        await markCommissionRecordAsPaid(supabase, {
          commissionRecordId: commission.id,
        });
        await refreshCommissionBoard();
        onPageFeedback({
          tone: "success",
          message: t("feedback.orderMarkedPaid", {
            orderNumber: commission.orderNumber,
          }),
        });
      } catch (error) {
        onPageFeedback({
          tone: "error",
          message: toCommissionErrorMessage(error, t, "admin"),
        });
      } finally {
        setSettlingKey(null);
      }
    },
    [onPageFeedback, refreshCommissionBoard, settlingKey, supabase, t],
  );

  const handleMarkTaskCommissionAsPaid = useCallback(
    async (taskCommission: TaskCommissionRow) => {
      if (!supabase || settlingKey) {
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          t("actions.confirmMarkTaskPaid", {
            taskName: taskCommission.taskName,
          }),
        );

        if (!confirmed) {
          return;
        }
      }

      setSettlingKey(`task:${taskCommission.id}`);

      try {
        await markTaskCommissionRecordAsPaid(supabase, {
          taskCommissionRecordId: taskCommission.id,
        });
        await refreshCommissionBoard();
        onPageFeedback({
          tone: "success",
          message: t("feedback.taskMarkedPaid", {
            taskName: taskCommission.taskName,
          }),
        });
      } catch (error) {
        onPageFeedback({
          tone: "error",
          message: toCommissionErrorMessage(error, t, "admin"),
        });
      } finally {
        setSettlingKey(null);
      }
    },
    [onPageFeedback, refreshCommissionBoard, settlingKey, supabase, t],
  );

  return {
    handleMarkCommissionAsPaid,
    handleMarkTaskCommissionAsPaid,
    settlingCommissionId: settlingKey?.startsWith("order:")
      ? settlingKey.slice("order:".length)
      : null,
    settlingTaskCommissionId: settlingKey?.startsWith("task:")
      ? settlingKey.slice("task:".length)
      : null,
  };
}
