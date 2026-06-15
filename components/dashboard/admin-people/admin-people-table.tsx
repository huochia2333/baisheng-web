"use client";

import { StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardTableFrame } from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { AdminPersonRow } from "@/lib/admin-people";
import type { AdminVipRequestAction } from "@/lib/admin-people-vip-mutations";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  getCustomerTypeLabel,
  getPersonContact,
  getPersonDisplayName,
  getRoleLabel,
} from "./admin-people-display";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";
import { AdminPeopleVipCell } from "./admin-people-vip-cell";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function PeopleTable({
  currentViewerId,
  customerTypeLabels,
  locale,
  onAdjustPerson,
  onEditPersonNote,
  onVipRequestAction,
  people,
  pendingVipRequestId,
  roleLabels,
  statusLabels,
}: {
  currentViewerId: string | null;
  customerTypeLabels: AdminPeopleViewModel["customerTypeLabels"];
  locale: Locale;
  onAdjustPerson: (person: AdminPersonRow) => void;
  onEditPersonNote: (person: AdminPersonRow) => void;
  onVipRequestAction: (
    requestId: string,
    action: AdminVipRequestAction,
  ) => void;
  people: AdminPersonRow[];
  pendingVipRequestId: string | null;
  roleLabels: AdminPeopleViewModel["roleLabels"];
  statusLabels: AdminPeopleViewModel["statusLabels"];
}) {
  const t = useTranslations("AdminPeople");
  const fallback = t("fallback.notProvided");

  return (
    <DashboardTableFrame>
      <table className="w-full min-w-[920px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[22%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
          <tr>
            <th className="px-3 py-3">{t("directory.columns.account")}</th>
            <th className="px-3 py-3">{t("directory.columns.accountState")}</th>
            <th className="px-3 py-3">{t("directory.columns.customerType")}</th>
            <th className="px-3 py-3">{t("directory.columns.vip")}</th>
            <th className="px-3 py-3">{t("directory.columns.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eee9e1]">
          {people.map((person) => {
            const isCurrentViewer = person.user_id === currentViewerId;
            const displayName = getPersonDisplayName(
              person,
              t("fallback.unnamedUser"),
            );

            return (
              <tr key={person.user_id} className="align-top">
                <td className="px-3 py-4">
                  <button
                    aria-label={t("actions.openDetailsFor", {
                      name: displayName,
                    })}
                    className="block min-w-0 text-left"
                    onClick={() => onAdjustPerson(person)}
                    type="button"
                  >
                    <span className="block break-words font-semibold text-[#23313a] underline-offset-4 [overflow-wrap:anywhere] hover:text-[#486782] hover:underline">
                      {displayName}
                    </span>
                    <span className="mt-1 block break-all text-xs text-[#7b858d]">
                      {getPersonContact(person, fallback)}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-4">
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                      {getRoleLabel(person.role, roleLabels, fallback)}
                    </span>
                    <StatusChip
                      label={statusLabels[person.status]}
                      status={person.status}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  <p className="font-semibold text-[#23313a]">
                    {getCustomerTypeLabel(
                      person.customer_type,
                      customerTypeLabels,
                      fallback,
                    )}
                  </p>
                  {person.customer_type_marked_by_name ? (
                    <p className="mt-1 text-xs text-[#7b858d]">
                      {t("directory.customerTypeMarkedBy", {
                        value: person.customer_type_marked_by_name,
                      })}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  <AdminPeopleVipCell
                    locale={locale}
                    onVipRequestAction={onVipRequestAction}
                    pendingRequestId={pendingVipRequestId}
                    person={person}
                  />
                </td>
                <td className="px-3 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <Button
                      className="h-9 rounded-full border border-[#d9e0e5] bg-white px-3 text-[#486782] hover:bg-[#f3f6f8]"
                      onClick={() => onEditPersonNote(person)}
                    >
                      <StickyNote className="size-4" />
                      {t("actions.note")}
                    </Button>
                    <Button
                      className="h-9 rounded-full bg-[#486782] px-3 text-white hover:bg-[#3e5f79] disabled:bg-[#d9dee2] disabled:text-[#7c8790]"
                      disabled={isCurrentViewer}
                      onClick={() => onAdjustPerson(person)}
                    >
                      {isCurrentViewer
                        ? t("actions.currentAccount")
                        : t("actions.adjust")}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardTableFrame>
  );
}

function StatusChip({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        status === "active" && "bg-[#e8f4ec] text-[#4c7259]",
        status === "inactive" && "bg-[#fff5db] text-[#9a6a07]",
        status === "suspended" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {label}
    </span>
  );
}
