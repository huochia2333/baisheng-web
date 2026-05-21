"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminPersonRow } from "@/lib/admin-people";
import type { AdminVipRequestAction } from "@/lib/admin-people-vip-mutations";
import type { Locale } from "@/lib/locale";
import type {
  VipMembershipScope,
  VipMembershipSummary,
  VipRechargeRequestSummary,
} from "@/lib/vip-memberships";

import { formatPeopleDate } from "./admin-people-display";

export function AdminPeopleVipCell({
  locale,
  onVipRequestAction,
  person,
  pendingRequestId,
}: {
  locale: Locale;
  onVipRequestAction: (
    requestId: string,
    action: AdminVipRequestAction,
  ) => void;
  person: AdminPersonRow;
  pendingRequestId: string | null;
}) {
  const t = useTranslations("AdminPeople");

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <VipStatusLine
        label={t("vip.retail")}
        locale={locale}
        membership={person.retail_vip}
      />
      <VipStatusLine
        label={t("vip.wholesale")}
        locale={locale}
        membership={person.wholesale_vip}
      />
      {person.pending_vip_requests.length > 0 ? (
        <div className="mt-1 flex flex-col gap-2">
          {person.pending_vip_requests.map((request) => (
            <PendingVipRequest
              key={request.id}
              locale={locale}
              onVipRequestAction={onVipRequestAction}
              pendingRequestId={pendingRequestId}
              request={request}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VipStatusLine({
  label,
  locale,
  membership,
}: {
  label: string;
  locale: Locale;
  membership: VipMembershipSummary;
}) {
  const t = useTranslations("AdminPeople");
  const active = membership.status === "active";
  const date = active ? membership.expires_at : membership.started_at;

  return (
    <div className="rounded-md border border-[#ebe7e1] bg-white px-2.5 py-2">
      <p className="text-xs font-semibold text-[#23313a]">{label}</p>
      <p className={active ? "mt-1 text-xs text-[#4c7259]" : "mt-1 text-xs text-[#8a949c]"}>
        {active
          ? t("vip.activeUntil", {
              value: formatPeopleDate(date, locale, t("fallback.notProvided")),
            })
          : t("vip.inactive")}
      </p>
    </div>
  );
}

function PendingVipRequest({
  locale,
  onVipRequestAction,
  pendingRequestId,
  request,
}: {
  locale: Locale;
  onVipRequestAction: (
    requestId: string,
    action: AdminVipRequestAction,
  ) => void;
  pendingRequestId: string | null;
  request: VipRechargeRequestSummary;
}) {
  const t = useTranslations("AdminPeople");
  const isPending = pendingRequestId === request.id;

  return (
    <div className="rounded-md border border-[#f0dfbf] bg-[#fffaf0] px-2.5 py-2 text-xs text-[#6f5c33]">
      <p className="font-semibold">
        {t("vip.pendingRequest", {
          value: getVipScopeLabel(request.vip_scope, t),
        })}
      </p>
      <p className="mt-1">
        {t("vip.requestedAt", {
          value: formatPeopleDate(
            request.created_at,
            locale,
            t("fallback.notProvided"),
          ),
        })}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <VipRequestButton
          action="approve"
          disabled={isPending || pendingRequestId !== null}
          loading={isPending}
          onVipRequestAction={onVipRequestAction}
          requestId={request.id}
        />
        <VipRequestButton
          action="reject"
          disabled={isPending || pendingRequestId !== null}
          loading={false}
          onVipRequestAction={onVipRequestAction}
          requestId={request.id}
        />
      </div>
    </div>
  );
}

function VipRequestButton({
  action,
  disabled,
  loading,
  onVipRequestAction,
  requestId,
}: {
  action: AdminVipRequestAction;
  disabled: boolean;
  loading: boolean;
  onVipRequestAction: (
    requestId: string,
    action: AdminVipRequestAction,
  ) => void;
  requestId: string;
}) {
  const t = useTranslations("AdminPeople");

  return (
    <Button
      className={
        action === "approve"
          ? "h-8 rounded-full bg-[#4c7259] px-2.5 text-xs text-white hover:bg-[#42654d]"
          : "h-8 rounded-full border-[#efd6d6] bg-white px-2.5 text-xs text-[#b13d3d] hover:bg-[#fff4f4]"
      }
      disabled={disabled}
      onClick={() => onVipRequestAction(requestId, action)}
      type="button"
      variant={action === "approve" ? "default" : "outline"}
    >
      {loading ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : action === "approve" ? (
        <Check className="size-3.5" />
      ) : (
        <X className="size-3.5" />
      )}
      {t(`vip.${action}`)}
    </Button>
  );
}

function getVipScopeLabel(
  scope: VipMembershipScope,
  t: ReturnType<typeof useTranslations>,
) {
  return scope === "wholesale" ? t("vip.wholesale") : t("vip.retail");
}
