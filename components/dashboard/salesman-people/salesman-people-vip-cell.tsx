"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import type { SalesmanCustomerRow } from "@/lib/salesman-people";
import {
  VIP_SCOPE_VALUES,
  type VipMembershipScope,
  type VipMembershipSummary,
} from "@/lib/vip-memberships";

import { formatSalesmanPeopleDate } from "./salesman-people-display";
import { getVipRequestPendingKey } from "./use-salesman-people-view-model";

export function SalesmanPeopleVipCell({
  customer,
  locale,
  onRequestVip,
  pendingKey,
}: {
  customer: SalesmanCustomerRow;
  locale: Locale;
  onRequestVip: (
    customer: SalesmanCustomerRow,
    vipScope: VipMembershipScope,
  ) => void;
  pendingKey: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {VIP_SCOPE_VALUES.map((scope) => (
        <VipScopeCard
          customer={customer}
          key={scope}
          locale={locale}
          membership={scope === "retail" ? customer.retail_vip : customer.wholesale_vip}
          onRequestVip={onRequestVip}
          pendingKey={pendingKey}
          scope={scope}
        />
      ))}
    </div>
  );
}

function VipScopeCard({
  customer,
  locale,
  membership,
  onRequestVip,
  pendingKey,
  scope,
}: {
  customer: SalesmanCustomerRow;
  locale: Locale;
  membership: VipMembershipSummary;
  onRequestVip: (
    customer: SalesmanCustomerRow,
    vipScope: VipMembershipScope,
  ) => void;
  pendingKey: string | null;
  scope: VipMembershipScope;
}) {
  const t = useTranslations("SalesmanPeople");
  const active = membership.status === "active";
  const hasPendingRequest = customer.pending_vip_requests.some(
    (request) => request.vip_scope === scope,
  );
  const currentPendingKey = getVipRequestPendingKey(customer.user_id, scope);
  const loading = pendingKey === currentPendingKey;

  return (
    <div className="rounded-md border border-[#ebe7e1] bg-white px-2.5 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#23313a]">
            {scope === "wholesale" ? t("vip.wholesale") : t("vip.retail")}
          </p>
          <p className={active ? "mt-1 text-xs text-[#4c7259]" : "mt-1 text-xs text-[#8a949c]"}>
            {active
              ? t("vip.activeUntil", {
                  value: formatSalesmanPeopleDate(
                    membership.expires_at,
                    locale,
                    t("fallback.notProvided"),
                  ),
                })
              : t("vip.inactive")}
          </p>
        </div>
        <Button
          className="h-8 rounded-full bg-[#486782] px-2.5 text-xs text-white hover:bg-[#3e5f79] disabled:bg-[#d9dee2] disabled:text-[#7c8790]"
          disabled={hasPendingRequest || pendingKey !== null}
          onClick={() => onRequestVip(customer, scope)}
          type="button"
        >
          {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {hasPendingRequest
            ? t("vip.pending")
            : active
              ? t("vip.renew")
              : t("vip.open")}
        </Button>
      </div>
    </div>
  );
}
