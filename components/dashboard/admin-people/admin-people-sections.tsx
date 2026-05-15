"use client";

import {
  Clock3,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
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
import type { AdminPeopleChangeLogRow, AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  formatPeopleDate,
  getRoleLabel,
  getStatusLabel,
} from "./admin-people-display";
import { PeopleTable } from "./admin-people-table";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function AdminPeopleHeaderSection({
  summary,
}: {
  summary: AdminPeopleViewModel["summary"];
}) {
  const t = useTranslations("AdminPeople");

  return (
    <DashboardSectionHeader
      badge={t("header.badge")}
      badgeIcon={<UserCog className="size-4" />}
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
          label: t("summary.active"),
          value: summary.activeCount,
        },
        {
          accent: "blue",
          icon: <ShieldCheck className="size-5" />,
          label: t("summary.administrators"),
          value: summary.administratorCount,
        },
        {
          accent: "gold",
          icon: <ShieldAlert className="size-5" />,
          label: t("summary.suspended"),
          value: summary.suspendedCount,
        },
      ]}
      metricsClassName="grid-cols-2 md:grid-cols-4"
      metricsPlacement="below"
      title={t("header.title")}
    />
  );
}

export function AdminPeopleNoPermissionSection() {
  const t = useTranslations("AdminPeople");

  return (
    <DashboardListSection
      description={t("states.noPermissionDescription")}
      eyebrow={t("header.badge")}
      title={t("states.noPermissionTitle")}
    >
      <EmptyState
        description={t("states.noPermissionDescription")}
        icon={<ShieldAlert className="size-5" />}
        title={t("states.noPermissionTitle")}
      />
    </DashboardListSection>
  );
}

export function AdminPeopleDirectorySection({
  currentViewerId,
  customerTypeLabels,
  filteredPeople,
  locale,
  onAdjustPerson,
  onRoleFilterChange,
  onSearchTextChange,
  onStatusFilterChange,
  roleFilter,
  roleLabels,
  roleOptions,
  searchText,
  statusFilter,
  statusLabels,
  statusOptions,
}: {
  currentViewerId: string | null;
  customerTypeLabels: AdminPeopleViewModel["customerTypeLabels"];
  filteredPeople: AdminPersonRow[];
  locale: Locale;
  onAdjustPerson: (person: AdminPersonRow) => void;
  onRoleFilterChange: (value: string) => void;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  roleFilter: string;
  roleLabels: AdminPeopleViewModel["roleLabels"];
  roleOptions: AdminPeopleViewModel["roleOptions"];
  searchText: string;
  statusFilter: string;
  statusLabels: AdminPeopleViewModel["statusLabels"];
  statusOptions: AdminPeopleViewModel["statusOptions"];
}) {
  const t = useTranslations("AdminPeople");

  return (
    <DashboardListSection
      description={t("directory.description")}
      eyebrow={t("directory.eyebrow")}
      title={t("directory.title")}
    >
      <DashboardFilterPanel
        gridClassName="sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"
      >
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

        <DashboardFilterField label={t("filters.role")}>
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) => onRoleFilterChange(event.target.value)}
            value={roleFilter}
          >
            <option value="all">{t("filters.allRoles")}</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </DashboardFilterField>

        <DashboardFilterField label={t("filters.status")}>
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            value={statusFilter}
          >
            <option value="all">{t("filters.allStatuses")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </DashboardFilterField>
      </DashboardFilterPanel>

      <div className="mt-5">
        {filteredPeople.length === 0 ? (
          <EmptyState
            description={t("directory.emptyDescription")}
            icon={<Filter className="size-5" />}
            title={t("directory.emptyTitle")}
          />
        ) : (
          <PeopleTable
            currentViewerId={currentViewerId}
            customerTypeLabels={customerTypeLabels}
            locale={locale}
            onAdjustPerson={onAdjustPerson}
            people={filteredPeople}
            roleLabels={roleLabels}
            statusLabels={statusLabels}
          />
        )}
      </div>
    </DashboardListSection>
  );
}

export function AdminPeopleRecentChangesSection({
  changes,
  locale,
  roleLabels,
  statusLabels,
}: {
  changes: AdminPeopleChangeLogRow[];
  locale: Locale;
  roleLabels: AdminPeopleViewModel["roleLabels"];
  statusLabels: AdminPeopleViewModel["statusLabels"];
}) {
  const t = useTranslations("AdminPeople");
  const fallback = t("fallback.notProvided");

  return (
    <DashboardListSection
      description={t("logs.description")}
      eyebrow={t("logs.eyebrow")}
      title={t("logs.title")}
    >
      {changes.length === 0 ? (
        <EmptyState
          description={t("logs.emptyDescription")}
          icon={<Clock3 className="size-5" />}
          title={t("logs.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
              <tr>
                <th className="px-4 py-3">{t("logs.columns.target")}</th>
                <th className="px-4 py-3">{t("logs.columns.change")}</th>
                <th className="px-4 py-3">{t("logs.columns.actor")}</th>
                <th className="px-4 py-3">{t("logs.columns.note")}</th>
                <th className="px-4 py-3">{t("logs.columns.time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9e1]">
              {changes.map((change) => (
                <tr key={change.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#23313a]">
                      {change.target_name ?? change.target_email ?? fallback}
                    </p>
                    <p className="mt-1 text-xs text-[#7b858d]">
                      {change.target_email ?? fallback}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[#53616d]">
                    <p>
                      {getRoleLabel(change.previous_role, roleLabels, fallback)}
                      {" -> "}
                      {getRoleLabel(change.next_role, roleLabels, fallback)}
                    </p>
                    <p className="mt-1">
                      {getStatusLabel(change.previous_status, statusLabels, fallback)}
                      {" -> "}
                      {getStatusLabel(change.next_status, statusLabels, fallback)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[#53616d]">
                    {change.actor_name ?? change.actor_email ?? fallback}
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-[#53616d]">
                    {change.note ?? t("logs.noNote")}
                  </td>
                  <td className="px-4 py-4 text-[#53616d]">
                    {formatPeopleDate(change.created_at, locale, fallback)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      )}
    </DashboardListSection>
  );
}
