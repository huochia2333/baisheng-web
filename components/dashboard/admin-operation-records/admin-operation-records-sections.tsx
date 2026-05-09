"use client";

import {
  ClipboardClock,
  Filter,
  MessageSquareText,
  Search,
  ShieldAlert,
  UserCheck,
  UserCog,
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
import type { AdminOperationRecord } from "@/lib/admin-operation-records";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  formatOperationDate,
  getOperationUserContact,
  getOperationUserLabel,
  getRoleChangeLabel,
  getStatusChangeLabel,
} from "./admin-operation-records-display";
import type { useAdminOperationRecordsViewModel } from "./use-admin-operation-records-view-model";

type OperationRecordsViewModel = ReturnType<
  typeof useAdminOperationRecordsViewModel
>;

export function OperationRecordsHeaderSection({
  summary,
}: {
  summary: OperationRecordsViewModel["summary"];
}) {
  const t = useTranslations("OperationRecords");

  return (
    <DashboardSectionHeader
      badge={t("header.badge")}
      badgeIcon={<ClipboardClock className="size-4" />}
      description={t("header.description")}
      metrics={[
        {
          accent: "blue",
          icon: <ClipboardClock className="size-5" />,
          label: t("summary.total"),
          value: summary.total,
        },
        {
          accent: "green",
          icon: <UserCog className="size-5" />,
          label: t("summary.account"),
          value: summary.account,
        },
        {
          accent: "gold",
          icon: <UserCheck className="size-5" />,
          label: t("summary.profile"),
          value: summary.profile,
        },
        {
          accent: "blue",
          icon: <MessageSquareText className="size-5" />,
          label: t("summary.feedback"),
          value: summary.feedback,
        },
      ]}
      metricsClassName="grid-cols-2 md:grid-cols-4"
      metricsPlacement="below"
      title={t("header.title")}
    />
  );
}

export function OperationRecordsNoPermissionSection() {
  const t = useTranslations("OperationRecords");

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

export function OperationRecordsFilterSection({
  actionFilter,
  actionLabels,
  actionOptions,
  categoryFilter,
  categoryLabels,
  categoryOptions,
  onActionFilterChange,
  onCategoryFilterChange,
  onSearchTextChange,
  searchText,
}: {
  actionFilter: string;
  actionLabels: OperationRecordsViewModel["actionLabels"];
  actionOptions: OperationRecordsViewModel["actionOptions"];
  categoryFilter: string;
  categoryLabels: OperationRecordsViewModel["categoryLabels"];
  categoryOptions: OperationRecordsViewModel["categoryOptions"];
  onActionFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onSearchTextChange: (value: string) => void;
  searchText: string;
}) {
  const t = useTranslations("OperationRecords");

  return (
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

      <DashboardFilterField label={t("filters.category")}>
        <select
          className={dashboardFilterInputClassName}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          value={categoryFilter}
        >
          <option value="all">{t("filters.allCategories")}</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
      </DashboardFilterField>

      <DashboardFilterField label={t("filters.action")}>
        <select
          className={dashboardFilterInputClassName}
          onChange={(event) => onActionFilterChange(event.target.value)}
          value={actionFilter}
        >
          <option value="all">{t("filters.allActions")}</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {actionLabels[action]}
            </option>
          ))}
        </select>
      </DashboardFilterField>
    </DashboardFilterPanel>
  );
}

export function OperationRecordsListSection({
  actionLabels,
  categoryLabels,
  feedbackStatusLabels,
  locale,
  records,
  roleLabels,
  statusLabels,
}: {
  actionLabels: OperationRecordsViewModel["actionLabels"];
  categoryLabels: OperationRecordsViewModel["categoryLabels"];
  feedbackStatusLabels: OperationRecordsViewModel["feedbackStatusLabels"];
  locale: Locale;
  records: AdminOperationRecord[];
  roleLabels: OperationRecordsViewModel["roleLabels"];
  statusLabels: OperationRecordsViewModel["statusLabels"];
}) {
  const t = useTranslations("OperationRecords");

  return (
    <DashboardListSection
      description={t("list.description")}
      eyebrow={t("list.eyebrow")}
      title={t("list.title")}
    >
      {records.length === 0 ? (
        <EmptyState
          description={t("list.emptyDescription")}
          icon={<Filter className="size-5" />}
          title={t("list.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
              <tr>
                <th className="px-4 py-3">{t("list.columns.time")}</th>
                <th className="px-4 py-3">{t("list.columns.category")}</th>
                <th className="px-4 py-3">{t("list.columns.action")}</th>
                <th className="px-4 py-3">{t("list.columns.subject")}</th>
                <th className="px-4 py-3">{t("list.columns.actor")}</th>
                <th className="px-4 py-3">{t("list.columns.detail")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9e1]">
              {records.map((record) => (
                <OperationRecordRow
                  actionLabels={actionLabels}
                  categoryLabels={categoryLabels}
                  feedbackStatusLabels={feedbackStatusLabels}
                  key={record.id}
                  locale={locale}
                  record={record}
                  roleLabels={roleLabels}
                  statusLabels={statusLabels}
                />
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      )}
    </DashboardListSection>
  );
}

function OperationRecordRow({
  actionLabels,
  categoryLabels,
  feedbackStatusLabels,
  locale,
  record,
  roleLabels,
  statusLabels,
}: {
  actionLabels: OperationRecordsViewModel["actionLabels"];
  categoryLabels: OperationRecordsViewModel["categoryLabels"];
  feedbackStatusLabels: OperationRecordsViewModel["feedbackStatusLabels"];
  locale: Locale;
  record: AdminOperationRecord;
  roleLabels: OperationRecordsViewModel["roleLabels"];
  statusLabels: OperationRecordsViewModel["statusLabels"];
}) {
  const t = useTranslations("OperationRecords");
  const fallback = t("fallback.notProvided");

  return (
    <tr className="align-top text-[#334550]">
      <td className="px-4 py-4 text-xs leading-6 text-[#66727d]">
        {formatOperationDate(record.occurredAt, locale, fallback)}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex rounded-full bg-[#edf3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
          {categoryLabels[record.category]}
        </span>
      </td>
      <td className="px-4 py-4 font-semibold text-[#23313a]">
        {actionLabels[record.action]}
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-[#23313a]">
          {getOperationUserLabel(record.subject, fallback)}
        </p>
        <p className="mt-1 text-xs text-[#7b858d]">
          {getOperationUserContact(record.subject, fallback)}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-[#23313a]">
          {getOperationUserLabel(record.actor, fallback)}
        </p>
        <p className="mt-1 text-xs text-[#7b858d]">
          {getOperationUserContact(record.actor, fallback)}
        </p>
      </td>
      <td className="max-w-[340px] px-4 py-4 text-[#53616d]">
        <OperationRecordDetail
          feedbackStatusLabels={feedbackStatusLabels}
          record={record}
          roleLabels={roleLabels}
          statusLabels={statusLabels}
        />
      </td>
    </tr>
  );
}

function OperationRecordDetail({
  feedbackStatusLabels,
  record,
  roleLabels,
  statusLabels,
}: {
  feedbackStatusLabels: OperationRecordsViewModel["feedbackStatusLabels"];
  record: AdminOperationRecord;
  roleLabels: OperationRecordsViewModel["roleLabels"];
  statusLabels: OperationRecordsViewModel["statusLabels"];
}) {
  const t = useTranslations("OperationRecords");
  const fallback = t("fallback.notProvided");

  return (
    <div className="space-y-1.5 text-sm leading-6">
      {record.roleChange ? (
        <p>
          {t("detail.roleChange", {
            from: getRoleChangeLabel(record.roleChange.from, roleLabels, fallback),
            to: getRoleChangeLabel(record.roleChange.to, roleLabels, fallback),
          })}
        </p>
      ) : null}
      {record.statusChange && record.category !== "feedback" ? (
        <p>
          {t("detail.statusChange", {
            from: getStatusChangeLabel(
              record.statusChange.from,
              statusLabels,
              feedbackStatusLabels,
              fallback,
            ),
            to: getStatusChangeLabel(
              record.statusChange.to,
              statusLabels,
              feedbackStatusLabels,
              fallback,
            ),
          })}
        </p>
      ) : null}
      {record.nameChange ? (
        <p>
          {t("detail.nameChange", {
            from: record.nameChange.from ?? fallback,
            to: record.nameChange.to ?? fallback,
          })}
        </p>
      ) : null}
      {record.cityChange ? (
        <p>
          {t("detail.cityChange", {
            from: record.cityChange.from ?? fallback,
            to: record.cityChange.to ?? fallback,
          })}
        </p>
      ) : null}
      {record.feedback ? (
        <>
          <p>{t("detail.feedbackTitle", { title: record.feedback.title })}</p>
          {record.statusChange ? (
            <p>
              {t("detail.feedbackStatus", {
                status: getStatusChangeLabel(
                  record.statusChange.to,
                  statusLabels,
                  feedbackStatusLabels,
                  fallback,
                ),
              })}
            </p>
          ) : null}
          <p className="break-all">
            {t("detail.feedbackSource", { path: record.feedback.sourcePath })}
          </p>
        </>
      ) : null}
      {record.note ? (
        <p>{t("detail.note", { note: record.note })}</p>
      ) : record.category === "account" ? (
        <p>{t("detail.noNote")}</p>
      ) : null}
    </div>
  );
}
