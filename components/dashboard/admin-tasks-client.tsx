"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCheck,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Paperclip,
  Plus,
  RefreshCw,
  ShieldAlert,
  Shuffle,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  ADMIN_TASK_ATTACHMENT_MAX_FILES,
  ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  type AdminTaskScopeFilter,
  type AdminTaskStatusFilter,
  type AdminTasksFilters,
  createAdminTask,
  deleteAdminTask,
  type AdminTasksSearchParams,
  type AdminTasksPageData,
  updateAdminTaskAssignment,
  uploadAdminTaskAttachments,
  validateAdminTaskAttachments,
  type AdminTaskRow,
  type TaskScope,
} from "@/lib/admin-tasks";
import { paginateDashboardItems } from "@/lib/dashboard-pagination";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { Button } from "../ui/button";
import {
  type AssignmentFormState,
  canManageTask,
  type CreateTaskFormState,
  createEmptyAssignmentForm,
  createEmptyTaskForm,
} from "./admin-tasks/admin-tasks-utils";
import {
  FilterField,
  FormField,
  SearchField,
  TaskCard,
  TaskScopePill,
  TaskStatusPill,
} from "./admin-tasks/admin-tasks-ui";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardPaginationControls } from "./dashboard-pagination-controls";
import {
  EmptyState,
  PageBanner,
  formatFileSize,
  normalizeSearchText,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  getTaskAssignmentLabel,
  getTaskTeamName,
  resolveTaskActorLabel,
  toAdminTaskErrorMessage,
  validateTaskAssignmentDraft,
  validateTaskDraft,
} from "./tasks-copy";
import { useWorkspaceSyncEffect } from "./workspace-session-provider";

type PageFeedback = { tone: NoticeTone; message: string } | null;

const inputClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
const selectClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
const textareaClassName =
  "min-h-[150px] w-full rounded-[22px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

const DashboardDialog = dynamic(
  () => import("./dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

function areAdminTaskFiltersEqual(
  left: AdminTasksFilters,
  right: AdminTasksFilters,
) {
  return (
    left.searchText === right.searchText &&
    left.scope === right.scope &&
    left.status === right.status &&
    left.teamId === right.teamId
  );
}

export function AdminTasksClient({
  initialData,
  initialView,
}: {
  initialData: AdminTasksPageData;
  initialView: AdminTasksSearchParams;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const [isRefreshing, startRefreshTransition] = useTransition();

  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [filters, setFilters] = useState<AdminTasksFilters>(initialView.filters);
  const [page, setPage] = useState(initialView.page);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] = useState<PageFeedback>(null);
  const [createPending, setCreatePending] = useState(false);
  const [createFormState, setCreateFormState] = useState<CreateTaskFormState>(
    createEmptyTaskForm,
  );

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentDialogFeedback, setAssignmentDialogFeedback] = useState<PageFeedback>(null);
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AdminTaskRow | null>(null);
  const [assignmentFormState, setAssignmentFormState] = useState<AssignmentFormState>(
    createEmptyAssignmentForm,
  );
  const [deletePendingTaskId, setDeletePendingTaskId] = useState<string | null>(null);

  const deferredSearchText = useDeferredValue(filters.searchText);
  const viewerId = initialData.viewerId;
  const tasks = initialData.tasks;
  const teamOptions = initialData.teamOptions;
  const canView = initialData.canView;

  useEffect(() => {
    setFilters(initialView.filters);
  }, [initialView.filters]);

  useEffect(() => {
    setPage(initialView.page);
  }, [initialView.page]);

  const refreshTaskBoard = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

  const replaceTasksRoute = useCallback(
    (next: {
      filters?: AdminTasksFilters;
      page?: number;
    }) => {
      const nextFilters = next.filters ?? filters;
      const nextPage = next.page ?? page;
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextFilters.searchText) {
        nextParams.set("searchText", nextFilters.searchText);
      } else {
        nextParams.delete("searchText");
      }

      if (nextFilters.status !== "all") {
        nextParams.set("status", nextFilters.status);
      } else {
        nextParams.delete("status");
      }

      if (nextFilters.scope !== "all") {
        nextParams.set("scope", nextFilters.scope);
      } else {
        nextParams.delete("scope");
      }

      if (nextFilters.teamId !== "all") {
        nextParams.set("teamId", nextFilters.teamId);
      } else {
        nextParams.delete("teamId");
      }

      if (nextPage > 1) {
        nextParams.set("page", String(nextPage));
      } else {
        nextParams.delete("page");
      }

      const nextQuery = nextParams.toString();

      startRefreshTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      });
    },
    [filters, page, pathname, router, searchParams, startRefreshTransition],
  );

  useWorkspaceSyncEffect(refreshTaskBoard);

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    const nextSelectedTask = initialData.tasks.find((task) => task.id === selectedTask.id) ?? null;

    if (nextSelectedTask?.id !== selectedTask.id) {
      setSelectedTask(null);
      return;
    }

    if (nextSelectedTask && nextSelectedTask !== selectedTask) {
      setSelectedTask(nextSelectedTask);
    }
  }, [initialData.tasks, selectedTask]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "to_be_accepted").length,
      accepted: tasks.filter((task) => task.status === "accepted").length,
      completed: tasks.filter((task) => task.status === "completed").length,
      teamScoped: tasks.filter((task) => task.scope === "team").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearchText = normalizeSearchText(deferredSearchText);

    return tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      if (filters.scope !== "all" && task.scope !== filters.scope) {
        return false;
      }

      if (filters.teamId !== "all" && task.team_id !== filters.teamId) {
        return false;
      }

      if (!normalizedSearchText) {
        return true;
      }

      const searchableText = [
        task.task_name,
        task.task_intro,
        resolveTaskActorLabel(task.creator, task.created_by_user_id, sharedT),
        task.creator?.email,
        resolveTaskActorLabel(task.accepted_by, task.accepted_by_user_id, sharedT),
        task.accepted_by?.email,
        task.team?.team_name,
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedSearchText);
    });
  }, [deferredSearchText, filters.scope, filters.status, filters.teamId, sharedT, tasks]);
  const tasksPagination = useMemo(
    () => paginateDashboardItems(filteredTasks, page),
    [filteredTasks, page],
  );

  useEffect(() => {
    if (tasksPagination.page === page) {
      return;
    }

    setPage(tasksPagination.page);

    if (
      areAdminTaskFiltersEqual(filters, initialView.filters) &&
      initialView.page !== tasksPagination.page
    ) {
      replaceTasksRoute({
        filters,
        page: tasksPagination.page,
      });
    }
  }, [
    filters,
    initialView.filters,
    initialView.page,
    page,
    replaceTasksRoute,
    tasksPagination.page,
  ]);

  useEffect(() => {
    if (areAdminTaskFiltersEqual(filters, initialView.filters)) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      replaceTasksRoute({
        filters,
        page: 1,
      });
    }, 250);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [filters, initialView.filters, replaceTasksRoute]);

  const updateFilter = useCallback(
    <Key extends keyof AdminTasksFilters>(
      key: Key,
      value: AdminTasksFilters[Key],
    ) => {
      setPage(1);
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      replaceTasksRoute({
        filters,
        page: nextPage,
      });
    },
    [filters, replaceTasksRoute],
  );

  const goToNextPage = useCallback(() => {
    if (!tasksPagination.hasNextPage) {
      return;
    }

    goToPage(tasksPagination.page + 1);
  }, [goToPage, tasksPagination.hasNextPage, tasksPagination.page]);

  const goToPreviousPage = useCallback(() => {
    if (!tasksPagination.hasPreviousPage) {
      return;
    }

    goToPage(tasksPagination.page - 1);
  }, [goToPage, tasksPagination.hasPreviousPage, tasksPagination.page]);

  const openCreateDialog = useCallback(() => {
    setCreateDialogFeedback(null);
    setCreateFormState(createEmptyTaskForm());
    setCreateDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (!supabase || !canView) {
      return;
    }

    setPageFeedback(null);
    refreshTaskBoard();
  }, [canView, refreshTaskBoard, supabase]);

  const handleCreateTask = useCallback(async () => {
    if (!supabase || !viewerId || !canView || createPending) {
      return;
    }

    const validationMessage = validateTaskDraft(createFormState, t);

    if (validationMessage) {
      setCreateDialogFeedback({
        tone: "error",
        message: validationMessage,
      });
      return;
    }

    try {
      validateAdminTaskAttachments(createFormState.files);
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);

    try {
      const createdTask = await createAdminTask(supabase, {
        taskName: createFormState.taskName,
        taskIntro: createFormState.taskIntro,
        createdByUserId: viewerId,
        scope: createFormState.scope,
        teamId: createFormState.scope === "team" ? createFormState.teamId : null,
      });

      if (createFormState.files.length > 0) {
        try {
          await uploadAdminTaskAttachments(supabase, {
            taskId: createdTask.id,
            uploadedByUserId: viewerId,
            files: createFormState.files,
          });
        } catch (error) {
          try {
            await deleteAdminTask(supabase, {
              id: createdTask.id,
              attachments: [],
            });
          } catch {
            // Ignore rollback cleanup failure here; surface the original upload error first.
          }

          throw error;
        }
      }

      setCreateDialogOpen(false);
      setCreateFormState(createEmptyTaskForm());
      setPageFeedback({
        tone: "success",
        message:
          createFormState.files.length > 0
            ? t("feedback.createdWithAttachments")
            : t("feedback.created"),
      });
      refreshTaskBoard();
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
    } finally {
      setCreatePending(false);
    }
  }, [canView, createFormState, createPending, refreshTaskBoard, sharedT, supabase, t, viewerId]);

  const openAssignmentDialog = useCallback((task: AdminTaskRow) => {
    setSelectedTask(task);
    setAssignmentDialogFeedback(null);
    setAssignmentFormState({
      scope: task.scope,
      teamId: task.team_id ?? "",
    });
    setAssignmentDialogOpen(true);
  }, []);

  const handleSaveAssignment = useCallback(async () => {
    if (!supabase || !selectedTask || assignmentPending) {
      return;
    }

    const validationMessage = validateTaskAssignmentDraft(assignmentFormState, t);

    if (validationMessage) {
      setAssignmentDialogFeedback({
        tone: "error",
        message: validationMessage,
      });
      return;
    }

    setAssignmentPending(true);
    setAssignmentDialogFeedback(null);

    try {
      await updateAdminTaskAssignment(supabase, {
        taskId: selectedTask.id,
        scope: assignmentFormState.scope,
        teamId: assignmentFormState.scope === "team" ? assignmentFormState.teamId : null,
      });

      setAssignmentDialogOpen(false);
      setSelectedTask(null);
      setPageFeedback({
        tone: "success",
        message:
          assignmentFormState.scope === "team"
            ? t("feedback.assignmentUpdated")
            : t("feedback.assignmentPublic"),
      });
      refreshTaskBoard();
    } catch (error) {
      setAssignmentDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
    } finally {
      setAssignmentPending(false);
    }
  }, [assignmentFormState, assignmentPending, refreshTaskBoard, selectedTask, sharedT, supabase, t]);

  const handleDeleteTask = useCallback(
    async (task: AdminTaskRow) => {
      if (!supabase || deletePendingTaskId) {
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(t("confirmDelete", { taskName: task.task_name }));

        if (!confirmed) {
          return;
        }
      }

      setDeletePendingTaskId(task.id);

      try {
        const result = await deleteAdminTask(supabase, task);
        setPageFeedback({
          tone: result.attachmentCleanupFailed ? "info" : "success",
          message: result.attachmentCleanupFailed
            ? t("feedback.deletedWithAttachmentCleanupWarning")
            : t("feedback.deleted"),
        });
        refreshTaskBoard();
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toAdminTaskErrorMessage(error, sharedT),
        });
      } finally {
        setDeletePendingTaskId(null);
      }
    },
    [deletePendingTaskId, refreshTaskBoard, sharedT, supabase, t],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e6edf2] px-3 py-1 text-xs font-semibold text-[#486782]">
              {t("header.badge")}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              {t("header.title")}
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{t("header.description")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
              type="button"
            >
              <RefreshCw className={["size-4", isRefreshing ? "animate-spin" : ""].join(" ")} />
              {t("header.refresh")}
            </Button>
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={!canView}
              onClick={openCreateDialog}
              type="button"
            >
              <Plus className="size-4" />
              {t("header.create")}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard accent="blue" icon={<ClipboardList className="size-5" />} label={t("summary.total")} value={stats.total} />
          <DashboardMetricCard accent="gold" icon={<Clock3 className="size-5" />} label={t("summary.pending")} value={stats.pending} />
          <DashboardMetricCard accent="blue" icon={<UserRound className="size-5" />} label={t("summary.accepted")} value={stats.accepted} />
          <DashboardMetricCard accent="green" icon={<CheckCheck className="size-5" />} label={t("summary.completed")} value={stats.completed} />
          <DashboardMetricCard accent="blue" icon={<UsersRound className="size-5" />} label={t("summary.teamScoped")} value={stats.teamScoped} />
        </div>
      </section>

      {!canView ? (
        <EmptyState
          description={t("states.noPermissionDescription")}
          icon={<ShieldAlert className="size-6" />}
          title={t("states.noPermissionTitle")}
        />
      ) : (
        <>
          <section className="rounded-[26px] border border-white/85 bg-white/80 p-5 shadow-[0_14px_32px_rgba(96,113,128,0.06)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
              <SearchField
                label={t("filters.searchLabel")}
                onChange={(value) => updateFilter("searchText", value)}
                placeholder={t("filters.searchPlaceholder")}
                value={filters.searchText}
              />

              <FilterField label={t("filters.statusLabel")} onChange={(value) => updateFilter("status", value as AdminTaskStatusFilter)} value={filters.status}>
                <option value="all">{t("filters.statusAll")}</option>
                <option value="to_be_accepted">{sharedT("status.toBeAccepted")}</option>
                <option value="accepted">{sharedT("status.accepted")}</option>
                <option value="completed">{sharedT("status.completed")}</option>
              </FilterField>

              <FilterField label={t("filters.scopeLabel")} onChange={(value) => updateFilter("scope", value as AdminTaskScopeFilter)} value={filters.scope}>
                <option value="all">{t("filters.scopeAll")}</option>
                <option value="public">{sharedT("scope.public")}</option>
                <option value="team">{sharedT("scope.team")}</option>
              </FilterField>

              <FilterField label={t("filters.teamLabel")} onChange={(value) => updateFilter("teamId", value)} value={filters.teamId}>
                <option value="all">{t("filters.teamAll")}</option>
                {teamOptions.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {getTaskTeamName(team.team_name, sharedT)}
                  </option>
                ))}
              </FilterField>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{t("list.title")}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  {t("list.description", { count: filteredTasks.length })}
                </p>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
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
                    onDelete={() => void handleDeleteTask(task)}
                    onReassign={() => openAssignmentDialog(task)}
                    reassignBusy={assignmentPending && selectedTask?.id === task.id}
                    task={task}
                  />
                ))}
              </div>
            )}
            <DashboardPaginationControls
              endIndex={tasksPagination.endIndex}
              hasNextPage={tasksPagination.hasNextPage}
              hasPreviousPage={tasksPagination.hasPreviousPage}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
              page={tasksPagination.page}
              pageCount={tasksPagination.pageCount}
              startIndex={tasksPagination.startIndex}
              totalItems={tasksPagination.totalItems}
            />
          </section>
        </>
      )}

      {createDialogOpen ? (
        <DashboardDialog
          actions={
            <>
              <Button
                className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
                onClick={() => setCreateDialogOpen(false)}
                type="button"
              >
                {t("createDialog.cancel")}
              </Button>
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                disabled={createPending}
                onClick={() => void handleCreateTask()}
                type="button"
              >
                {createPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {t("createDialog.submit")}
              </Button>
            </>
          }
          description={t("createDialog.description")}
          onOpenChange={setCreateDialogOpen}
          open
          title={t("createDialog.title")}
        >
          <div className="space-y-6">
          {createDialogFeedback ? (
            <PageBanner tone={createDialogFeedback.tone}>{createDialogFeedback.message}</PageBanner>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <FormField label={t("createDialog.taskNameLabel")}>
              <input
                className={inputClassName}
                onChange={(event) =>
                  setCreateFormState((current) => ({
                    ...current,
                    taskName: event.target.value,
                  }))
                }
                placeholder={t("createDialog.taskNamePlaceholder")}
                type="text"
                value={createFormState.taskName}
              />
            </FormField>

            <FormField label={t("createDialog.scopeLabel")}>
              <select
                className={selectClassName}
                onChange={(event) =>
                  setCreateFormState((current) => ({
                    ...current,
                    scope: event.target.value as TaskScope,
                    teamId: event.target.value === "team" ? current.teamId : "",
                  }))
                }
                value={createFormState.scope}
              >
                <option value="public">{sharedT("scope.public")}</option>
                <option value="team">{sharedT("scope.team")}</option>
              </select>
            </FormField>
          </div>

          {createFormState.scope === "team" ? (
            <FormField label={t("createDialog.teamLabel")}>
              <select
                className={selectClassName}
                onChange={(event) =>
                  setCreateFormState((current) => ({
                    ...current,
                    teamId: event.target.value,
                  }))
                }
                value={createFormState.teamId}
              >
                <option value="">{t("createDialog.teamPlaceholder")}</option>
                {teamOptions.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {getTaskTeamName(team.team_name, sharedT)}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label={t("createDialog.taskIntroLabel")}>
            <textarea
              className={textareaClassName}
              onChange={(event) =>
                setCreateFormState((current) => ({
                  ...current,
                  taskIntro: event.target.value,
                }))
              }
              placeholder={t("createDialog.taskIntroPlaceholder")}
              value={createFormState.taskIntro}
            />
          </FormField>

          <FormField label={t("createDialog.attachmentsLabel")}>
            <div className="rounded-[24px] border border-dashed border-[#cfd8df] bg-[#fbfaf8] p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-8 text-center transition hover:bg-[#f8fbfd]">
                <Paperclip className="size-5 text-[#486782]" />
                <span className="mt-3 text-sm font-semibold text-[#23313a]">
                  {t("createDialog.attachmentsCta")}
                </span>
                <span className="mt-2 text-xs leading-6 text-[#7b858d]">
                  {t("createDialog.attachmentsHint", {
                    maxFiles: ADMIN_TASK_ATTACHMENT_MAX_FILES,
                    maxPerFile: formatFileSize(ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES),
                    maxTotal: formatFileSize(ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES),
                  })}
                </span>
                <input
                  className="sr-only"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);

                    setCreateFormState((current) => ({
                      ...current,
                      files,
                    }));

                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>

              {createFormState.files.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {createFormState.files.map((file, index) => (
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782] transition hover:bg-[#e1ebf0]"
                      key={`${file.name}-${file.size}-${index}`}
                      onClick={() =>
                        setCreateFormState((current) => ({
                          ...current,
                          files: current.files.filter((_, fileIndex) => fileIndex !== index),
                        }))
                      }
                      type="button"
                    >
                      <Paperclip className="size-3.5" />
                      {file.name}
                      <span className="text-[#6f7b85]">{formatFileSize(file.size)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[#7b858d]">{t("createDialog.noAttachments")}</p>
              )}
            </div>
          </FormField>
          </div>
        </DashboardDialog>
      ) : null}

      {assignmentDialogOpen ? (
        <DashboardDialog
          actions={
            <>
              <Button
                className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
                onClick={() => setAssignmentDialogOpen(false)}
                type="button"
              >
                {t("assignmentDialog.cancel")}
              </Button>
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                disabled={assignmentPending || !selectedTask || !canManageTask(selectedTask)}
                onClick={() => void handleSaveAssignment()}
                type="button"
              >
                {assignmentPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Shuffle className="size-4" />
                )}
                {t("assignmentDialog.submit")}
              </Button>
            </>
          }
          description={t("assignmentDialog.description")}
          onOpenChange={setAssignmentDialogOpen}
          open
          title={
            selectedTask
              ? t("assignmentDialog.titleWithName", {
                  taskName: selectedTask.task_name,
                })
              : t("assignmentDialog.title")
          }
        >
          <div className="space-y-6">
          {assignmentDialogFeedback ? (
            <PageBanner tone={assignmentDialogFeedback.tone}>
              {assignmentDialogFeedback.message}
            </PageBanner>
          ) : null}

          {selectedTask ? (
            <>
              <div className="rounded-[24px] border border-[#e6ebef] bg-[#f8fbfc] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusPill status={selectedTask.status} />
                  <TaskScopePill scope={selectedTask.scope} />
                </div>
                <p className="mt-4 text-lg font-semibold tracking-tight text-[#23313a]">
                  {selectedTask.task_name}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  {t("assignmentDialog.currentAssignment", {
                    assignmentLabel: getTaskAssignmentLabel(
                      selectedTask.scope,
                      selectedTask.team?.team_name,
                      sharedT,
                    ),
                  })}
                </p>
              </div>

              {!canManageTask(selectedTask) ? (
                <PageBanner tone="info">{t("assignmentDialog.viewOnlyNotice")}</PageBanner>
              ) : (
                <>
                  <FormField label={t("assignmentDialog.scopeLabel")}>
                    <select
                      className={selectClassName}
                      onChange={(event) =>
                        setAssignmentFormState((current) => ({
                          ...current,
                          scope: event.target.value as TaskScope,
                          teamId: event.target.value === "team" ? current.teamId : "",
                        }))
                      }
                      value={assignmentFormState.scope}
                    >
                      <option value="public">{sharedT("scope.public")}</option>
                      <option value="team">{sharedT("scope.team")}</option>
                    </select>
                  </FormField>

                  {assignmentFormState.scope === "team" ? (
                    <FormField label={t("assignmentDialog.teamLabel")}>
                      <select
                        className={selectClassName}
                        onChange={(event) =>
                          setAssignmentFormState((current) => ({
                            ...current,
                            teamId: event.target.value,
                          }))
                        }
                        value={assignmentFormState.teamId}
                      >
                        <option value="">{t("assignmentDialog.teamPlaceholder")}</option>
                        {teamOptions.map((team) => (
                          <option key={team.team_id} value={team.team_id}>
                            {getTaskTeamName(team.team_name, sharedT)}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  ) : null}
                </>
              )}
            </>
          ) : null}
          </div>
        </DashboardDialog>
      ) : null}
    </section>
  );
}
