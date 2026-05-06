"use client";

import {
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquareWarning,
  Search,
  ShieldAlert,
  TimerReset,
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
import type { Locale } from "@/lib/locale";
import type {
  AdminWorkspaceFeedbackItem,
  WorkspaceFeedbackStatus,
} from "@/lib/workspace-feedback";
import { cn } from "@/lib/utils";

import {
  formatFeedbackDate,
  getFeedbackRoleLabel,
  getFeedbackSubmitterContact,
  getFeedbackSubmitterName,
} from "./admin-feedback-display";
import type { useAdminFeedbackViewModel } from "./use-admin-feedback-view-model";

type AdminFeedbackViewModel = ReturnType<typeof useAdminFeedbackViewModel>;

export function AdminFeedbackHeaderSection({
  summary,
}: {
  summary: AdminFeedbackViewModel["summary"];
}) {
  const t = useTranslations("WorkspaceFeedback");

  return (
    <DashboardSectionHeader
      badge={t("header.badge")}
      badgeIcon={<MessageSquareWarning className="size-4" />}
      description={t("header.description")}
      metrics={[
        {
          accent: "blue",
          icon: <MessageSquareWarning className="size-5" />,
          label: t("summary.total"),
          value: summary.total,
        },
        {
          accent: "gold",
          icon: <Clock3 className="size-5" />,
          label: t("summary.new"),
          value: summary.new,
        },
        {
          accent: "blue",
          icon: <TimerReset className="size-5" />,
          label: t("summary.inProgress"),
          value: summary.inProgress,
        },
        {
          accent: "green",
          icon: <CheckCircle2 className="size-5" />,
          label: t("summary.resolved"),
          value: summary.resolved,
        },
      ]}
      metricsClassName="grid-cols-2 md:grid-cols-4"
      metricsPlacement="below"
      title={t("header.title")}
    />
  );
}

export function AdminFeedbackNoPermissionSection() {
  const t = useTranslations("WorkspaceFeedback");

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

export function AdminFeedbackFilterSection({
  onSearchTextChange,
  onStatusFilterChange,
  onTypeFilterChange,
  searchText,
  statusFilter,
  statusLabels,
  statusOptions,
  typeFilter,
  typeLabels,
  typeOptions,
}: {
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  searchText: string;
  statusFilter: string;
  statusLabels: AdminFeedbackViewModel["statusLabels"];
  statusOptions: AdminFeedbackViewModel["statusOptions"];
  typeFilter: string;
  typeLabels: AdminFeedbackViewModel["typeLabels"];
  typeOptions: AdminFeedbackViewModel["typeOptions"];
}) {
  const t = useTranslations("WorkspaceFeedback");

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

      <DashboardFilterField label={t("filters.type")}>
        <select
          className={dashboardFilterInputClassName}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          value={typeFilter}
        >
          <option value="all">{t("filters.allTypes")}</option>
          {typeOptions.map((feedbackType) => (
            <option key={feedbackType} value={feedbackType}>
              {typeLabels[feedbackType]}
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
  );
}

export function AdminFeedbackListSection({
  feedbackItems,
  locale,
  onStatusChange,
  pendingStatusId,
  roleLabels,
  statusLabels,
  statusOptions,
  typeLabels,
}: {
  feedbackItems: AdminWorkspaceFeedbackItem[];
  locale: Locale;
  onStatusChange: (feedbackId: string, status: WorkspaceFeedbackStatus) => void;
  pendingStatusId: string | null;
  roleLabels: AdminFeedbackViewModel["roleLabels"];
  statusLabels: AdminFeedbackViewModel["statusLabels"];
  statusOptions: AdminFeedbackViewModel["statusOptions"];
  typeLabels: AdminFeedbackViewModel["typeLabels"];
}) {
  const t = useTranslations("WorkspaceFeedback");

  return (
    <DashboardListSection
      description={t("list.description")}
      eyebrow={t("list.eyebrow")}
      title={t("list.title")}
    >
      {feedbackItems.length === 0 ? (
        <EmptyState
          description={t("list.emptyDescription")}
          icon={<Filter className="size-5" />}
          title={t("list.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-[1060px] w-full text-left text-sm">
            <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
              <tr>
                <th className="px-4 py-3">{t("list.feedback")}</th>
                <th className="px-4 py-3">{t("list.submitter")}</th>
                <th className="px-4 py-3">{t("list.type")}</th>
                <th className="px-4 py-3">{t("list.source")}</th>
                <th className="px-4 py-3">{t("list.createdAt")}</th>
                <th className="px-4 py-3">{t("list.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece5]">
              {feedbackItems.map((feedback) => (
                <FeedbackTableRow
                  feedback={feedback}
                  key={feedback.id}
                  locale={locale}
                  onStatusChange={onStatusChange}
                  pending={pendingStatusId !== null}
                  roleLabels={roleLabels}
                  statusLabels={statusLabels}
                  statusOptions={statusOptions}
                  typeLabels={typeLabels}
                />
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      )}
    </DashboardListSection>
  );
}

function FeedbackTableRow({
  feedback,
  locale,
  onStatusChange,
  pending,
  roleLabels,
  statusLabels,
  statusOptions,
  typeLabels,
}: {
  feedback: AdminWorkspaceFeedbackItem;
  locale: Locale;
  onStatusChange: (feedbackId: string, status: WorkspaceFeedbackStatus) => void;
  pending: boolean;
  roleLabels: AdminFeedbackViewModel["roleLabels"];
  statusLabels: AdminFeedbackViewModel["statusLabels"];
  statusOptions: AdminFeedbackViewModel["statusOptions"];
  typeLabels: AdminFeedbackViewModel["typeLabels"];
}) {
  const t = useTranslations("WorkspaceFeedback");
  const fallback = t("fallback.notProvided");

  return (
    <tr className="align-top text-[#334550]">
      <td className="max-w-[360px] px-4 py-4">
        <p className="font-semibold text-[#23313a]">{feedback.title}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#66727d]">
          {feedback.content}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-[#23313a]">
          {getFeedbackSubmitterName(feedback, fallback)}
        </p>
        <p className="mt-1 text-xs text-[#6f7b85]">
          {getFeedbackSubmitterContact(feedback, fallback)}
        </p>
        <p className="mt-2 text-xs font-medium text-[#7d8890]">
          {getFeedbackRoleLabel(feedback.submitted_role, roleLabels, fallback)}
        </p>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex rounded-full bg-[#edf3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
          {typeLabels[feedback.feedback_type]}
        </span>
      </td>
      <td className="max-w-[190px] break-all px-4 py-4 text-xs leading-6 text-[#66727d]">
        {feedback.source_path}
      </td>
      <td className="px-4 py-4 text-xs leading-6 text-[#66727d]">
        {formatFeedbackDate(feedback.created_at, locale, fallback)}
      </td>
      <td className="px-4 py-4">
        <div className="grid gap-2">
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
              getStatusPillClassName(feedback.status),
            )}
          >
            {statusLabels[feedback.status]}
          </span>
          <select
            aria-label={t("list.statusAction")}
            className="h-10 min-w-[132px] rounded-[14px] border border-[#dfe5ea] bg-white px-3 text-xs font-semibold text-[#486782] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-65"
            disabled={pending}
            onChange={(event) =>
              onStatusChange(
                feedback.id,
                event.target.value as WorkspaceFeedbackStatus,
              )
            }
            value={feedback.status}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  );
}

function getStatusPillClassName(status: WorkspaceFeedbackStatus) {
  switch (status) {
    case "declined":
      return "bg-[#f9e8e8] text-[#a84242]";
    case "in_progress":
      return "bg-[#e5eef6] text-[#486782]";
    case "new":
      return "bg-[#f6edda] text-[#9a6a1f]";
    case "resolved":
      return "bg-[#e4f2eb] text-[#2f6b4f]";
  }
}
