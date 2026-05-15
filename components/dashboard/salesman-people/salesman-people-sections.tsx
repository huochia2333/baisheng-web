"use client";

import { Filter, Search, Tags, UserCheck, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardListSection,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import type { SalesmanCustomerRow } from "@/lib/salesman-people";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  formatSalesmanPeopleDate,
  getSalesmanCustomerContact,
  getSalesmanCustomerName,
  getSalesmanCustomerTypeLabel,
} from "./salesman-people-display";
import type { useSalesmanPeopleViewModel } from "./use-salesman-people-view-model";

type SalesmanPeopleViewModel = ReturnType<typeof useSalesmanPeopleViewModel>;

export function SalesmanPeopleHeaderSection({
  summary,
}: {
  summary: SalesmanPeopleViewModel["summary"];
}) {
  const t = useTranslations("SalesmanPeople");

  return (
    <DashboardSectionHeader
      badge={t("header.badge")}
      badgeIcon={<UsersRound className="size-4" />}
      description={t("header.description")}
      metrics={[
        {
          accent: "blue",
          icon: <UsersRound className="size-5" />,
          label: t("summary.total"),
          value: summary.totalCount,
        },
        {
          accent: "green",
          icon: <UserCheck className="size-5" />,
          label: t("summary.retail"),
          value: summary.retailCount,
        },
        {
          accent: "gold",
          icon: <Tags className="size-5" />,
          label: t("summary.wholesale"),
          value: summary.wholesaleCount,
        },
        {
          accent: "blue",
          icon: <Filter className="size-5" />,
          label: t("summary.unmarked"),
          value: summary.unmarkedCount,
        },
      ]}
      metricsClassName="grid-cols-2 md:grid-cols-4"
      metricsPlacement="below"
      title={t("header.title")}
    />
  );
}

export function SalesmanPeopleNoPermissionSection() {
  const t = useTranslations("SalesmanPeople");

  return (
    <DashboardListSection
      description={t("states.noPermissionDescription")}
      eyebrow={t("header.badge")}
      title={t("states.noPermissionTitle")}
    >
      <EmptyState
        description={t("states.noPermissionDescription")}
        icon={<UsersRound className="size-5" />}
        title={t("states.noPermissionTitle")}
      />
    </DashboardListSection>
  );
}

export function SalesmanPeopleDirectorySection({
  customerTypeLabels,
  filteredCustomers,
  locale,
  onAdjustCustomerType,
  onSearchTextChange,
  searchText,
}: {
  customerTypeLabels: SalesmanPeopleViewModel["customerTypeLabels"];
  filteredCustomers: SalesmanCustomerRow[];
  locale: Locale;
  onAdjustCustomerType: (customer: SalesmanCustomerRow) => void;
  onSearchTextChange: (value: string) => void;
  searchText: string;
}) {
  const t = useTranslations("SalesmanPeople");

  return (
    <DashboardListSection
      description={t("directory.description")}
      eyebrow={t("directory.eyebrow")}
      title={t("directory.title")}
    >
      <DashboardFilterPanel gridClassName="sm:grid-cols-[minmax(0,1fr)]">
        <DashboardFilterField label={t("filters.search")}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a949c]" />
            <input
              className={cn(dashboardFilterInputClassName, "pl-10")}
              onChange={(event) => onSearchTextChange(event.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              value={searchText}
            />
          </div>
        </DashboardFilterField>
      </DashboardFilterPanel>

      <div className="mt-5">
        {filteredCustomers.length === 0 ? (
          <EmptyState
            description={t("directory.emptyDescription")}
            icon={<Filter className="size-5" />}
            title={t("directory.emptyTitle")}
          />
        ) : (
          <DashboardTableFrame>
            <table className="min-w-[760px] table-fixed w-full text-left text-sm">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
                <tr>
                  <th className="px-3 py-3">{t("directory.columns.customer")}</th>
                  <th className="px-3 py-3">{t("directory.columns.city")}</th>
                  <th className="px-3 py-3">{t("directory.columns.currentType")}</th>
                  <th className="px-3 py-3">{t("directory.columns.markedAt")}</th>
                  <th className="px-3 py-3">{t("directory.columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9e1]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.user_id} className="align-top">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-[#23313a]">
                        {getSalesmanCustomerName(
                          customer,
                          t("fallback.unnamedCustomer"),
                        )}
                      </p>
                      <p className="mt-1 break-all text-xs text-[#7b858d]">
                        {getSalesmanCustomerContact(
                          customer,
                          t("fallback.notProvided"),
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-[#53616d]">
                      {customer.city ?? t("fallback.notProvided")}
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-[#23313a]">
                        {getSalesmanCustomerTypeLabel(
                          customer.customer_type,
                          customerTypeLabels,
                          t("fallback.unmarked"),
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-[#53616d]">
                      {formatSalesmanPeopleDate(
                        customer.marked_at,
                        locale,
                        t("fallback.notProvided"),
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <Button
                        className="h-9 rounded-full bg-[#486782] px-3 text-white hover:bg-[#3e5f79]"
                        onClick={() => onAdjustCustomerType(customer)}
                      >
                        {t("actions.adjust")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashboardTableFrame>
        )}
      </div>
    </DashboardListSection>
  );
}
