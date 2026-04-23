"use client";

import { useTranslations } from "next-intl";
import {
  CheckCheck,
  ClipboardList,
  Clock3,
  Plus,
  RefreshCw,
  ShieldAlert,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  type AdminTaskRow,
  type AdminTaskScopeFilter,
  type AdminTaskStatusFilter,
  type AdminTasksFilters,
  type AdminTasksPageData,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";

import {
  getTaskTeamName,
} from "@/components/dashboard/tasks/tasks-display";

import {
  FilterField,
  SearchField,
  TaskCard,
} from "./admin-tasks-ui";
import {
  type AdminTasksPagination,
  type AdminTasksStats,
} from "./admin-tasks-view-model-shared";

type TeamOptions = AdminTasksPageData["teamOptions"];

export function AdminTasksHeroSection({
  canView,
  isRefreshing,
  onCreate,
  onRefresh,
  stats,
}: {
  canView: boolean;
  isRefreshing: boolean;
  onCreate: () => void;
  onRefresh: () => void;
  stats: AdminTasksStats;
}) {
  const t = useTranslations("Tasks.admin");

  return (
    <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-[#e6edf2] px-3 py-1 text-xs font-semibold text-[#486782]">
            {t("header.badge")}
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
            {t("header.title")}
          </h2>
          <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
            {t("header.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!canView}
            onClick={onCreate}
            type="button"
          >
            <Plus className="size-4" />
            {t("header.create")}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <DashboardMetricCard
          accent="blue"
          icon={<ClipboardList className="size-5" />}
          label={t("summary.total")}
          value={stats.total}
        />
        <DashboardMetricCard
          accent="gold"
          icon={<Clock3 className="size-5" />}
          label={t("summary.pending")}
          value={stats.pending}
        />
        <DashboardMetricCard
          accent="blue"
          icon={<UserRound className="size-5" />}
          label={t("summary.accepted")}
          value={stats.accepted}
        />
        <DashboardMetricCard
          accent="gold"
          icon={<Upload className="size-5" />}
          label={t("summary.reviewing")}
          value={stats.reviewing}
        />
        <DashboardMetricCard
          accent="blue"
          icon={<XCircle className="size-5" />}
          label={t("summary.rejected")}
          value={stats.rejected}
        />
        <DashboardMetricCard
          accent="green"
          icon={<CheckCheck className="size-5" />}
          label={t("summary.completed")}
          value={stats.completed}
        />
      </div>
    </section>
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
  onScopeChange,
  onSearchTextChange,
  onStatusChange,
  onTeamChange,
  teamOptions,
}: {
  filters: AdminTasksFilters;
  onScopeChange: (value: AdminTaskScopeFilter) => void;
  onSearchTextChange: (value: string) => void;
  onStatusChange: (value: AdminTaskStatusFilter) => void;
  onTeamChange: (value: string) => void;
  teamOptions: TeamOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");

  return (
    <section className="rounded-[26px] border border-white/85 bg-white/80 p-5 shadow-[0_14px_32px_rgba(96,113,128,0.06)] sm:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
        <SearchField
          label={t("filters.searchLabel")}
          onChange={onSearchTextChange}
          placeholder={t("filters.searchPlaceholder")}
          value={filters.searchText}
        />

        <FilterField
          label={t("filters.statusLabel")}
          onChange={(value) => onStatusChange(value as AdminTaskStatusFilter)}
          value={filters.status}
        >
          <option value="all">{t("filters.statusAll")}</option>
          <option value="to_be_accepted">{sharedT("status.toBeAccepted")}</option>
          <option value="accepted">{sharedT("status.accepted")}</option>
          <option value="reviewing">{sharedT("status.reviewing")}</option>
          <option value="rejected">{sharedT("status.rejected")}</option>
          <option value="completed">{sharedT("status.completed")}</option>
        </FilterField>

        <FilterField
          label={t("filters.scopeLabel")}
          onChange={(value) => onScopeChange(value as AdminTaskScopeFilter)}
          value={filters.scope}
        >
          <option value="all">{t("filters.scopeAll")}</option>
          <option value="public">{sharedT("scope.public")}</option>
          <option value="team">{sharedT("scope.team")}</option>
        </FilterField>

        <FilterField
          label={t("filters.teamLabel")}
          onChange={onTeamChange}
          value={filters.teamId}
        >
          <option value="all">{t("filters.teamAll")}</option>
          {teamOptions.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {getTaskTeamName(team.team_name, sharedT)}
            </option>
          ))}
        </FilterField>
      </div>
    </section>
  );
}

export function AdminTasksListSection({
  assignmentPendingTaskId,
  deletePendingTaskId,
  filteredCount,
  onDeleteTask,
  onNextPage,
  onPreviousPage,
  onReassignTask,
  tasksPagination,
}: {
  assignmentPendingTaskId: string | null;
  deletePendingTaskId: string | null;
  filteredCount: number;
  onDeleteTask: (task: AdminTaskRow) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onReassignTask: (task: AdminTaskRow) => void;
  tasksPagination: AdminTasksPagination;
}) {
  const t = useTranslations("Tasks.admin");

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{t("list.title")}</h3>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
            {t("list.description", { count: filteredCount })}
          </p>
        </div>
      </div>

      {filteredCount === 0 ? (
        <EmptyState
          description={t("states.emptyDescription")}
          icon={<ClipboardList className="size-6" />}
          title={t("states.emptyTitle")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {tasksPagination.items.map((task) => (
            <TaskCard
              deleteBusy={deletePendingTaskId === task.id}
              key={task.id}
              onDelete={() => onDeleteTask(task)}
              onReassign={() => onReassignTask(task)}
              reassignBusy={assignmentPendingTaskId === task.id}
              task={task}
            />
          ))}
        </div>
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
    </section>
  );
}
