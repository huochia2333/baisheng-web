"use client";

import { useTranslations } from "next-intl";

import { DashboardTableFrame } from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";
import type { SalesmanBusinessBoardLabels } from "@/lib/salesman-business-access";
import { cn } from "@/lib/utils";

import {
  formatPeopleDate,
  getCustomerTypeLabel,
  getPersonContact,
  getPersonDisplayName,
  getPersonRelationSummary,
  getRoleLabel,
  getSalesmanBusinessAccessItems,
} from "./admin-people-display";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function PeopleTable({
  currentViewerId,
  customerTypeLabels,
  locale,
  onAdjustPerson,
  people,
  roleLabels,
  statusLabels,
}: {
  currentViewerId: string | null;
  customerTypeLabels: AdminPeopleViewModel["customerTypeLabels"];
  locale: Locale;
  onAdjustPerson: (person: AdminPersonRow) => void;
  people: AdminPersonRow[];
  roleLabels: AdminPeopleViewModel["roleLabels"];
  statusLabels: AdminPeopleViewModel["statusLabels"];
}) {
  const t = useTranslations("AdminPeople");
  const fallback = t("fallback.notProvided");
  const businessBoardFullLabels = {
    dropshipping: t("businessBoards.dropshipping"),
    tourism: t("businessBoards.tourism"),
  } satisfies SalesmanBusinessBoardLabels;
  const businessBoardCompactLabels = {
    dropshipping: t("businessBoardShortLabels.dropshipping"),
    tourism: t("businessBoardShortLabels.tourism"),
  } satisfies SalesmanBusinessBoardLabels;

  return (
    <DashboardTableFrame>
      <table className="min-w-[920px] table-fixed w-full text-left text-sm">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[8%]" />
          <col className="w-[9%]" />
          <col className="w-[8%]" />
          <col className="w-[13%]" />
          <col className="w-[7%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
          <tr>
            <th className="px-3 py-3">{t("directory.columns.account")}</th>
            <th className="px-3 py-3">{t("directory.columns.role")}</th>
            <th className="px-3 py-3">{t("directory.columns.status")}</th>
            <th className="px-3 py-3">{t("directory.columns.businessAccess")}</th>
            <th className="px-3 py-3">{t("directory.columns.customerType")}</th>
            <th className="px-3 py-3">{t("directory.columns.city")}</th>
            <th className="px-3 py-3">{t("directory.columns.relation")}</th>
            <th className="px-3 py-3">{t("directory.columns.createdAt")}</th>
            <th className="px-3 py-3">{t("directory.columns.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eee9e1]">
          {people.map((person) => {
            const relation = getPersonRelationSummary(person, {
              noReferrer: t("fallback.noReferrer"),
              noTeam: t("fallback.noTeam"),
            });
            const isCurrentViewer = person.user_id === currentViewerId;

            return (
              <tr key={person.user_id} className="align-top">
                <td className="px-3 py-4">
                  <p className="font-semibold text-[#23313a]">
                    {getPersonDisplayName(person, t("fallback.unnamedUser"))}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#7b858d]">
                    {getPersonContact(person, fallback)}
                  </p>
                </td>
                <td className="px-3 py-4">
                  <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                    {getRoleLabel(person.role, roleLabels, fallback)}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <StatusChip
                    label={statusLabels[person.status]}
                    status={person.status}
                  />
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  {person.role === "salesman" ? (
                    <BusinessAccessChips
                      compactLabels={businessBoardCompactLabels}
                      fallback={fallback}
                      fullLabels={businessBoardFullLabels}
                      boards={person.salesman_business_boards}
                    />
                  ) : (
                    <p>{fallback}</p>
                  )}
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
                <td className="px-3 py-4 text-[#53616d]">{person.city ?? fallback}</td>
                <td className="px-3 py-4 text-[#53616d]">
                  <p>{t("directory.referrer", { value: relation.referrer })}</p>
                  <p className="mt-1">{t("directory.team", { value: relation.team })}</p>
                  <p className="mt-1 text-xs text-[#7b858d]">
                    {t("directory.directReferrals", {
                      count: person.direct_referral_count,
                    })}
                  </p>
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  {formatPeopleDate(person.created_at, locale, fallback)}
                </td>
                <td className="px-3 py-4">
                  <Button
                    className="h-9 rounded-full bg-[#486782] px-3 text-white hover:bg-[#3e5f79] disabled:bg-[#d9dee2] disabled:text-[#7c8790]"
                    disabled={isCurrentViewer}
                    onClick={() => onAdjustPerson(person)}
                  >
                    {isCurrentViewer ? t("actions.currentAccount") : t("actions.adjust")}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardTableFrame>
  );
}

function BusinessAccessChips({
  boards,
  compactLabels,
  fallback,
  fullLabels,
}: {
  boards: AdminPersonRow["salesman_business_boards"];
  compactLabels: SalesmanBusinessBoardLabels;
  fallback: string;
  fullLabels: SalesmanBusinessBoardLabels;
}) {
  const items = getSalesmanBusinessAccessItems(boards, fullLabels);

  if (items.length === 0) {
    return <p>{fallback}</p>;
  }

  return (
    <div className="flex max-w-[8rem] flex-col items-start gap-1">
      {items.map((item) => (
        <span
          className="inline-flex w-fit whitespace-nowrap rounded-full bg-[#eef3f6] px-2.5 py-1 text-xs font-semibold text-[#486782]"
          key={item.board}
          title={item.label}
        >
          {compactLabels[item.board]}
        </span>
      ))}
    </div>
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
