"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  CheckCheck,
  ClipboardList,
  Clock3,
  Globe2,
  LoaderCircle,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Shuffle,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  createAdminTask,
  deleteAdminTask,
  getAdminTasks,
  getCurrentTaskViewerContext,
  updateAdminTaskAssignment,
  uploadAdminTaskAttachments,
  type AdminTaskRow,
  type TaskScope,
  type TaskStatus,
} from "@/lib/admin-tasks";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { getVisibleTeamOverviews, type TeamOverview } from "@/lib/team-management";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import { DashboardDialog } from "./dashboard-dialog";
import {
  EmptyState,
  PageBanner,
  formatDateTime,
  formatFileSize,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";
import { Button } from "../ui/button";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type TaskStatusFilter = "all" | TaskStatus;
type TaskScopeFilter = "all" | TaskScope;

type CreateTaskFormState = {
  taskName: string;
  taskIntro: string;
  scope: TaskScope;
  teamId: string;
  files: File[];
};

type AssignmentFormState = {
  scope: TaskScope;
  teamId: string;
};

const inputClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
const selectClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
const textareaClassName =
  "min-h-[150px] w-full rounded-[22px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export function AdminTasksClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [tasks, setTasks] = useState<AdminTaskRow[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOverview[]>([]);
  const [filters, setFilters] = useState<{
    searchText: string;
    scope: TaskScopeFilter;
    status: TaskStatusFilter;
    teamId: string;
  }>({
    searchText: "",
    scope: "all",
    status: "all",
    teamId: "all",
  });

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
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const deferredSearchText = useDeferredValue(filters.searchText);

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const refreshQuietly = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const [nextTasks, nextTeamOptions] = await Promise.all([
      getAdminTasks(supabase),
      getVisibleTeamOverviews(supabase),
    ]);

    setTasks(nextTasks);
    setTeamOptions(nextTeamOptions);
  }, [supabase]);

  const loadTaskBoard = useCallback(
    async ({
      isMounted,
      showLoading,
    }: {
      isMounted: () => boolean;
      showLoading: boolean;
    }) => {
      if (!supabase) {
        return;
      }

      if (showLoading && isMounted()) {
        setLoading(true);
      }

      try {
        if (shouldRecoverBrowserCloudSyncState()) {
          recoverCloudSync();
          return;
        }

        const viewer = await getCurrentTaskViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        setViewerId(viewer.user.id);
        setViewerRole(viewer.role);
        setViewerStatus(viewer.status);

        if (!canViewAdminTaskBoard(viewer.role, viewer.status)) {
          setTasks([]);
          setTeamOptions([]);
          setPageFeedback(null);
          return;
        }

        const [nextTasks, nextTeamOptions] = await Promise.all([
          getAdminTasks(supabase),
          getVisibleTeamOverviews(supabase),
        ]);

        if (!isMounted()) {
          return;
        }

        setTasks(nextTasks);
        setTeamOptions(nextTeamOptions);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toTaskErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadTaskBoard({
        isMounted,
        showLoading: loadingStateRef.current,
      }),
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await loadTaskBoard({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const canView = canViewAdminTaskBoard(viewerRole, viewerStatus);

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
        resolveTaskActorLabel(task.creator, task.created_by_user_id),
        task.creator?.email,
        resolveTaskActorLabel(task.accepted_by, task.accepted_by_user_id),
        task.accepted_by?.email,
        task.team?.team_name,
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedSearchText);
    });
  }, [deferredSearchText, filters.scope, filters.status, filters.teamId, tasks]);

  const openCreateDialog = useCallback(() => {
    setCreateDialogFeedback(null);
    setCreateFormState(createEmptyTaskForm());
    setCreateDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!supabase || !canView) {
      return;
    }

    setPageFeedback(null);

    try {
      await refreshQuietly();
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTaskErrorMessage(error),
      });
    }
  }, [canView, refreshQuietly, supabase]);

  const handleCreateTask = useCallback(async () => {
    if (!supabase || !viewerId || !canView || createPending) {
      return;
    }

    const validationMessage = validateTaskDraft(createFormState);

    if (validationMessage) {
      setCreateDialogFeedback({
        tone: "error",
        message: validationMessage,
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

      await refreshQuietly();
      setCreateDialogOpen(false);
      setCreateFormState(createEmptyTaskForm());
      setPageFeedback({
        tone: "success",
        message:
          createFormState.files.length > 0 ? "任务和附件已创建。" : "任务已创建。",
      });
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toTaskErrorMessage(error),
      });
    } finally {
      setCreatePending(false);
    }
  }, [canView, createFormState, createPending, refreshQuietly, supabase, viewerId]);

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

    const validationMessage = validateAssignmentDraft(assignmentFormState);

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

      await refreshQuietly();
      setAssignmentDialogOpen(false);
      setSelectedTask(null);
      setPageFeedback({
        tone: "success",
        message:
          assignmentFormState.scope === "team"
            ? "任务归属已更新。"
            : "任务已更新为面向全员。",
      });
    } catch (error) {
      setAssignmentDialogFeedback({
        tone: "error",
        message: toTaskErrorMessage(error),
      });
    } finally {
      setAssignmentPending(false);
    }
  }, [assignmentFormState, assignmentPending, refreshQuietly, selectedTask, supabase]);

  const handleDeleteTask = useCallback(
    async (task: AdminTaskRow) => {
      if (!supabase || deletePendingTaskId) {
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          `确认删除任务“${task.task_name}”吗？任务附件也会一起清理。`,
        );

        if (!confirmed) {
          return;
        }
      }

      setDeletePendingTaskId(task.id);

      try {
        await deleteAdminTask(supabase, task);
        await refreshQuietly();
        setPageFeedback({
          tone: "success",
          message: "任务已删除。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toTaskErrorMessage(error),
        });
      } finally {
        setDeletePendingTaskId(null);
      }
    },
    [deletePendingTaskId, refreshQuietly, supabase],
  );

  if (loading) {
    return <AdminTasksLoadingState />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e6edf2] px-3 py-1 text-xs font-semibold text-[#486782]">
              平台任务调度
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              管理员任务板
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              在这里可以集中查看任务进展、发布新任务，并按需要设置任务的协作范围与归属。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
              onClick={() => void handleRefresh()}
              type="button"
            >
              <RefreshCw className="size-4" />
              刷新数据
            </Button>
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={!canView}
              onClick={openCreateDialog}
              type="button"
            >
              <Plus className="size-4" />
              新建任务
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            accent="blue"
            count={stats.total}
            icon={<ClipboardList className="size-5" />}
            label="任务总数"
          />
          <SummaryCard
            accent="gold"
            count={stats.pending}
            icon={<Clock3 className="size-5" />}
            label="待领取"
          />
          <SummaryCard
            accent="blue"
            count={stats.accepted}
            icon={<UserRound className="size-5" />}
            label="进行中"
          />
          <SummaryCard
            accent="green"
            count={stats.completed}
            icon={<CheckCheck className="size-5" />}
            label="已完成"
          />
          <SummaryCard
            accent="blue"
            count={stats.teamScoped}
            icon={<UsersRound className="size-5" />}
            label="团队任务"
          />
        </div>
      </section>

      {!canView ? (
        <EmptyState
          description="当前账号不是管理员，暂时不能进入任务调度面板。"
          icon={<ShieldAlert className="size-6" />}
          title="没有访问权限"
        />
      ) : (
        <>
          <section className="rounded-[26px] border border-white/85 bg-white/80 p-5 shadow-[0_14px_32px_rgba(96,113,128,0.06)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
              <SearchField
                label="搜索任务"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    searchText: value,
                  }))
                }
                placeholder="搜索任务名、创建人、团队或领取人"
                value={filters.searchText}
              />

              <FilterField
                label="状态"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status: value as TaskStatusFilter,
                  }))
                }
                value={filters.status}
              >
                <option value="all">全部状态</option>
                <option value="to_be_accepted">待领取</option>
                <option value="accepted">进行中</option>
                <option value="completed">已完成</option>
              </FilterField>

              <FilterField
                label="范围"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    scope: value as TaskScopeFilter,
                  }))
                }
                value={filters.scope}
              >
                <option value="all">全部范围</option>
                <option value="public">面向全员</option>
                <option value="team">指定团队</option>
              </FilterField>

              <FilterField
                label="团队"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    teamId: value,
                  }))
                }
                value={filters.teamId}
              >
                <option value="all">全部团队</option>
                {teamOptions.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name ?? "未命名团队"}
                  </option>
                ))}
              </FilterField>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">任务清单</h3>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  当前共匹配到 {filteredTasks.length} 个任务。你可以通过搜索和筛选快速找到需要查看的内容。
                </p>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState
                description="当前筛选条件下还没有任务。你可以调整筛选条件，或先创建一条新任务。"
                icon={<ClipboardList className="size-6" />}
                title="暂时没有匹配任务"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredTasks.map((task) => (
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
          </section>
        </>
      )}

      <DashboardDialog
        actions={
          <>
            <Button
              className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
              onClick={() => setCreateDialogOpen(false)}
              type="button"
            >
              取消
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
              创建任务
            </Button>
          </>
        }
        description="可以选择面向全员开放任务，或设置为指定团队可见。附件会和任务一起保存。"
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
        title="新建任务"
      >
        <div className="space-y-6">
          {createDialogFeedback ? (
            <PageBanner tone={createDialogFeedback.tone}>
              {createDialogFeedback.message}
            </PageBanner>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <FormField label="任务名称">
              <input
                className={inputClassName}
                onChange={(event) =>
                  setCreateFormState((current) => ({
                    ...current,
                    taskName: event.target.value,
                  }))
                }
                placeholder="例如：跟进本周客户回访资料"
                type="text"
                value={createFormState.taskName}
              />
            </FormField>

            <FormField label="分配范围">
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
                <option value="public">面向全员</option>
                <option value="team">指定团队</option>
              </select>
            </FormField>
          </div>

          {createFormState.scope === "team" ? (
            <FormField label="目标团队">
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
                <option value="">请选择团队</option>
                {teamOptions.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name ?? "未命名团队"}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label="任务说明">
            <textarea
              className={textareaClassName}
              onChange={(event) =>
                setCreateFormState((current) => ({
                  ...current,
                  taskIntro: event.target.value,
                }))
              }
              placeholder="补充任务背景、目标、执行要求和注意事项。"
              value={createFormState.taskIntro}
            />
          </FormField>

          <FormField label="附件">
            <div className="rounded-[24px] border border-dashed border-[#cfd8df] bg-[#fbfaf8] p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-8 text-center transition hover:bg-[#f8fbfd]">
                <Paperclip className="size-5 text-[#486782]" />
                <span className="mt-3 text-sm font-semibold text-[#23313a]">
                  点击选择附件，可一次上传多个文件
                </span>
                <span className="mt-2 text-xs leading-6 text-[#7b858d]">
                  文件会进入 `task-attachments` 存储桶，并记录到 `task_sub` 表。
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
                <p className="mt-4 text-sm leading-7 text-[#7b858d]">
                  暂未选择附件。当前版本支持先把任务与附件一起创建。
                </p>
              )}
            </div>
          </FormField>
        </div>
      </DashboardDialog>

      <DashboardDialog
        actions={
          <>
            <Button
              className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
              onClick={() => setAssignmentDialogOpen(false)}
              type="button"
            >
              取消
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
              保存设置
            </Button>
          </>
        }
        description="任务开始处理后会以查看为主，如需调整范围或归属，请在开始前完成设置。"
        onOpenChange={setAssignmentDialogOpen}
        open={assignmentDialogOpen}
        title={selectedTask ? `调整任务设置：${selectedTask.task_name}` : "调整任务设置"}
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
                  当前分配：
                  {selectedTask.scope === "team"
                    ? selectedTask.team?.team_name ?? "未命名团队"
                    : "面向全员"}
                </p>
              </div>

              {!canManageTask(selectedTask) ? (
                <PageBanner tone="info">
                  该任务正在处理中或已完成，当前仅支持查看。
                </PageBanner>
              ) : (
                <>
                  <FormField label="新的分配范围">
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
                      <option value="public">面向全员</option>
                      <option value="team">指定团队</option>
                    </select>
                  </FormField>

                  {assignmentFormState.scope === "team" ? (
                    <FormField label="目标团队">
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
                        <option value="">请选择团队</option>
                        {teamOptions.map((team) => (
                          <option key={team.team_id} value={team.team_id}>
                            {team.team_name ?? "未命名团队"}
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
    </section>
  );
}

function AdminTasksLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载任务面板...
      </div>
    </div>
  );
}

function TaskCard({
  task,
  reassignBusy,
  deleteBusy,
  onReassign,
  onDelete,
}: {
  task: AdminTaskRow;
  reassignBusy: boolean;
  deleteBusy: boolean;
  onReassign: () => void;
  onDelete: () => void;
}) {
  const manageable = canManageTask(task);

  return (
    <article className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusPill status={task.status} />
              <TaskScopePill scope={task.scope} />
              {task.attachments.length > 0 ? (
                <DataPill accent="blue">
                  <Paperclip className="size-3.5" />
                  {task.attachments.length} 个附件
                </DataPill>
              ) : null}
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#23313a]">
              {task.task_name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
              {task.task_intro ?? "暂无任务说明。"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!manageable || reassignBusy}
              onClick={onReassign}
              type="button"
            >
              {reassignBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Shuffle className="size-4" />
              )}
              调整归属
            </Button>
            <Button
              className="h-10 rounded-full border border-[#f1d1d1] bg-[#fff2f2] px-4 text-[#b13d3d] hover:bg-[#fce5e5] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!manageable || deleteBusy}
              onClick={onDelete}
              type="button"
            >
              {deleteBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              删除
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile
            label="当前分配"
            value={
              task.scope === "team" ? task.team?.team_name ?? "未命名团队" : "面向全员"
            }
          />
          <InfoTile
            label="创建人"
            value={resolveTaskActorLabel(task.creator, task.created_by_user_id)}
          />
          <InfoTile
            label="领取人"
            value={resolveTaskActorLabel(task.accepted_by, task.accepted_by_user_id)}
          />
          <InfoTile label="创建时间" value={formatDateTime(task.created_at)} />
          <InfoTile label="领取时间" value={formatDateTime(task.accepted_at)} />
          <InfoTile label="完成时间" value={formatDateTime(task.completed_at)} />
        </div>

        {task.attachments.length > 0 ? (
          <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">附件概览</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.attachments.slice(0, 4).map((attachment) => (
                <DataPill accent="blue" key={attachment.id}>
                  <Paperclip className="size-3.5" />
                  {attachment.original_name}
                  <span className="text-[#6f7b85]">
                    {formatFileSize(attachment.file_size_bytes)}
                  </span>
                </DataPill>
              ))}
              {task.attachments.length > 4 ? (
                <DataPill accent="gold">
                  还有 {task.attachments.length - 4} 个附件
                </DataPill>
              ) : null}
            </div>
          </div>
        ) : null}

        {!manageable ? (
          <p className="text-xs leading-6 text-[#8a949c]">
            该任务当前仅支持查看。
          </p>
        ) : null}
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" ? "border-[#d9e3eb] bg-[#f4f8fb]" : "",
        accent === "green" ? "border-[#dce8df] bg-[#f2f7f3]" : "",
        accent === "gold" ? "border-[#eadfbf] bg-[#fbf5e8]" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" ? "bg-[#486782]" : "",
            accent === "green" ? "bg-[#4c7259]" : "",
            accent === "gold" ? "bg-[#b7892f]" : "",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7e8a92] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
    </div>
  );
}

function SearchField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]">
        <Search className="size-4 text-[#7a8790]" />
        <input
          className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

function FilterField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <select
        className={selectClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#23313a]">{label}</span>
      {children}
    </label>
  );
}

function TaskStatusPill({ status }: { status: TaskStatus }) {
  const mapping = mapTaskStatus(status);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        mapping.accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
        mapping.accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        mapping.accent === "green" ? "bg-[#e7f3ea] text-[#4c7259]" : "",
      ].join(" ")}
    >
      {mapping.label}
    </span>
  );
}

function TaskScopePill({ scope }: { scope: TaskScope }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        scope === "public" ? "bg-[#edf2f7] text-[#486782]" : "bg-[#eef6ef] text-[#4c7259]",
      ].join(" ")}
    >
      {scope === "public" ? <Globe2 className="size-3.5" /> : <UsersRound className="size-3.5" />}
      {scope === "public" ? "面向全员" : "团队任务"}
    </span>
  );
}

function DataPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: "blue" | "gold";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-7 text-[#23313a]">{value}</p>
    </div>
  );
}

function createEmptyTaskForm(): CreateTaskFormState {
  return {
    taskName: "",
    taskIntro: "",
    scope: "public",
    teamId: "",
    files: [],
  };
}

function createEmptyAssignmentForm(): AssignmentFormState {
  return {
    scope: "public",
    teamId: "",
  };
}

function canViewAdminTaskBoard(role: AppRole | null, status: UserStatus | null) {
  return role === "administrator" && (status === null || status === "active");
}

function canManageTask(task: AdminTaskRow) {
  return task.status === "to_be_accepted";
}

function resolveTaskActorLabel(
  actor:
    | {
        name: string | null;
        email: string | null;
      }
    | null
    | undefined,
  fallbackUserId: string | null | undefined,
) {
  return actor?.name ?? actor?.email ?? fallbackUserId ?? "暂无记录";
}

function validateTaskDraft(formState: CreateTaskFormState) {
  if (!formState.taskName.trim()) {
    return "请先填写任务名称。";
  }

  if (formState.scope === "team" && !formState.teamId) {
    return "请选择目标团队。";
  }

  return null;
}

function validateAssignmentDraft(formState: AssignmentFormState) {
  if (formState.scope === "team" && !formState.teamId) {
    return "请先选择团队。";
  }

  return null;
}

function mapTaskStatus(status: TaskStatus) {
  if (status === "to_be_accepted") {
    return { label: "待领取", accent: "gold" as const };
  }

  if (status === "accepted") {
    return { label: "进行中", accent: "blue" as const };
  }

  return { label: "已完成", accent: "green" as const };
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toTaskErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("task_main_task_name_not_blank")) {
    return "任务名称不能为空。";
  }

  if (baseMessage.includes("task_main_scope_team_check")) {
    return "团队任务必须绑定一个具体团队。";
  }

  if (baseMessage.includes("authenticated user is required")) {
    return "登录状态已失效，请重新登录后再试。";
  }

  if (baseMessage.includes("task not found")) {
    return "任务不存在，建议先刷新任务列表。";
  }

  if (baseMessage.includes("duplicate key value violates unique constraint")) {
    return "附件路径出现冲突，请重新上传一次。";
  }

  if (baseMessage.includes("storage")) {
    return "任务附件处理失败，请稍后重试。";
  }

  return baseMessage;
}
