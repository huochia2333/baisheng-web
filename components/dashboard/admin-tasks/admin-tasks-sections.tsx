"use client";

import { useTranslations } from "next-intl";
import {
  ClipboardList,
  History,
  Plus,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Upload,
  UserRound,
} from "lucide-react";

import {
  type AdminTaskRow,
  type AdminTaskTargetRoleFilter,
  type AdminTasksFilters,
  type AdminTasksPageData,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import {
  DashboardFilterPanel,
  DashboardListSection,
} from "@/components/dashboard/dashboard-section-panel";
import { EmptyState, PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import { getTaskTargetRoleLabel } from "@/components/dashboard/tasks/tasks-display";

import {
  FilterField,
  SearchField,
  TaskCard,
} from "./admin-tasks-ui";
import {
  AdminTaskSubmissionMediaPreviewDialog,
} from "./admin-task-submission-media";
import {
  type AdminTasksPagination,
  type AdminTasksStats,
} from "./admin-tasks-view-model-shared";
import { useAdminTaskSubmissionMedia } from "./use-admin-task-submission-media";

type TargetRoleOptions = AdminTasksPageData["targetRoleOptions"];

export function AdminTasksHeroSection({
  canView,
  isRefreshing,
  onCreate,
  onManageTaskTypes,
  onRefresh,
  onToggleCompletedHistory,
  showCompletedHistory,
  stats,
}: {
  canView: boolean;
  isRefreshing: boolean;
  onCreate: () => void;
  onManageTaskTypes: () => void;
  onRefresh: () => void;
  onToggleCompletedHistory: () => void;
  showCompletedHistory: boolean;
  stats: AdminTasksStats;
}) {
  const t = useTranslations("Tasks.admin");

  return (
    <DashboardSectionHeader
      actions={
        <>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            disabled={isRefreshing}
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className={["size-4", isRefreshing ? "animate-spin" : ""].join(" ")} />
            {t("header.refresh")}
          </Button>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            disabled={!canView}
            onClick={onManageTaskTypes}
            type="button"
          >
            <Settings2 className="size-4" />
            {t("header.manageTypes")}
          </Button>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            disabled={!canView}
            onClick={onToggleCompletedHistory}
            type="button"
          >
            <History className="size-4" />
            {showCompletedHistory ? t("header.allTasks") : t("header.history")}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!canView}
            onClick={onCreate}
            type="button"
          >
            <Plus className="size-4" />
            {t("header.create")}
          </Button>
        </>
      }
      badge={t("header.badge")}
      badgeClassName="bg-[#e6edf2]"
      description={t("header.description")}
      metrics={[
        {
          accent: "blue",
          icon: <UserRound className="size-5" />,
          key: "accepted",
          label: t("summary.accepted"),
          value: stats.accepted,
        },
        {
          accent: "gold",
          icon: <Upload className="size-5" />,
          key: "reviewing",
          label: t("summary.reviewing"),
          value: stats.reviewing,
        },
      ]}
      metricsClassName="sm:grid-cols-2"
      metricsPlacement="below"
      title={t("header.title")}
    />
  );
}

export function AdminTasksNoPermissionState() {
  const t = useTranslations("Tasks.admin");

  return (
    <EmptyState
      description={t("states.noPermissionDescription")}
      icon={<ShieldAlert className="size-6" />}
      title={t("states.noPermissionTitle")}
    />
  );
}

export function AdminTasksFiltersSection({
  filters,
  onSearchTextChange,
  onTargetRoleChange,
  targetRoleOptions,
}: {
  filters: AdminTasksFilters;
  onSearchTextChange: (value: string) => void;
  onTargetRoleChange: (value: AdminTaskTargetRoleFilter) => void;
  targetRoleOptions: TargetRoleOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");

  return (
    <DashboardFilterPanel
      gridClassName="grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.55fr)]"
      variant="standalone"
    >
        <SearchField
          label={t("filters.searchLabel")}
          onChange={onSearchTextChange}
          placeholder={t("filters.searchPlaceholder")}
          value={filters.searchText}
        />

        <FilterField
          label={t("filters.targetRoleLabel")}
          onChange={(value) => onTargetRoleChange(value as AdminTaskTargetRoleFilter)}
          value={filters.targetRole}
        >
          <option value="all">{t("filters.targetRoleAll")}</option>
          {targetRoleOptions.map((option) => (
            <option key={option.role} value={option.role}>
              {getTaskTargetRoleLabel(option.role, sharedT)}
            </option>
          ))}
        </FilterField>
    </DashboardFilterPanel>
  );
}

export function AdminTasksListSection({
  assignmentPendingTaskId,
  deletePendingTaskId,
  filteredCount,
  onDeleteTask,
  onEditTask,
  onNextPage,
  onPreviousPage,
  onReassignTask,
  tasksPagination,
}: {
  assignmentPendingTaskId: string | null;
  deletePendingTaskId: string | null;
  filteredCount: number;
  onDeleteTask: (task: AdminTaskRow) => void;
  onEditTask: (task: AdminTaskRow) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onReassignTask: (task: AdminTaskRow) => void;
  tasksPagination: AdminTasksPagination;
}) {
  const t = useTranslations("Tasks.admin");
  const visibleCompletedTaskIds = tasksPagination.items
    .filter((task) => task.status === "completed")
    .map((task) => task.id);
  const submissionMediaState = useAdminTaskSubmissionMedia(visibleCompletedTaskIds);

  return (
    <DashboardListSection
      bodyClassName="space-y-4"
      description={t("list.description", { count: filteredCount })}
      title={t("list.title")}
    >
      {filteredCount === 0 ? (
        <EmptyState
          description={t("states.emptyDescription")}
          icon={<ClipboardList className="size-6" />}
          title={t("states.emptyTitle")}
        />
      ) : (
        <>
          {submissionMediaState.errorMessage ? (
            <PageBanner tone="error">{submissionMediaState.errorMessage}</PageBanner>
          ) : null}

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
            {tasksPagination.items.map((task) => (
              <TaskCard
                deleteBusy={deletePendingTaskId === task.id}
                key={task.id}
                onDelete={() => onDeleteTask(task)}
                onDownloadSubmissionMedia={(media) =>
                  void submissionMediaState.downloadMedia(media)
                }
                onEdit={() => onEditTask(task)}
                onPreviewSubmissionMedia={(media) =>
                  void submissionMediaState.openPreview(media)
                }
                onReassign={() => onReassignTask(task)}
                reassignBusy={assignmentPendingTaskId === task.id}
                submissionMedia={submissionMediaState.mediaByTaskId.get(task.id) ?? []}
                submissionMediaBusyId={submissionMediaState.busyMediaId}
                submissionMediaLoading={submissionMediaState.loadingTaskIds.has(task.id)}
                task={task}
              />
            ))}
          </div>
        </>
      )}

      <DashboardPaginationControls
        endIndex={tasksPagination.endIndex}
        hasNextPage={tasksPagination.hasNextPage}
        hasPreviousPage={tasksPagination.hasPreviousPage}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        page={tasksPagination.page}
        pageCount={tasksPagination.pageCount}
        startIndex={tasksPagination.startIndex}
        totalItems={tasksPagination.totalItems}
      />

      <AdminTaskSubmissionMediaPreviewDialog
        media={submissionMediaState.previewMedia}
        onDownload={(media) => void submissionMediaState.downloadMedia(media)}
        onOpenChange={submissionMediaState.closePreview}
      />
    </DashboardListSection>
  );
}
