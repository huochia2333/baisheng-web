"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  CheckCheck,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  Globe2,
  LoaderCircle,
  Paperclip,
  Search,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import {
  acceptSalesmanTask,
  completeSalesmanTask,
  getCurrentSalesmanTaskViewerContext,
  getTaskAttachmentSignedUrl,
  getVisibleSalesmanTasks,
  type SalesmanTaskRow,
} from "@/lib/salesman-tasks";
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
type FocusFilter = "all" | "available" | "in_progress" | "completed";
type ScopeFilter = "all" | "public" | "team";

export function SalesmanTasksClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [tasks, setTasks] = useState<SalesmanTaskRow[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOverview[]>([]);
  const [filters, setFilters] = useState<{
    searchText: string;
    focus: FocusFilter;
    scope: ScopeFilter;
  }>({
    searchText: "",
    focus: "all",
    scope: "all",
  });
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [attachmentBusyKey, setAttachmentBusyKey] = useState<string | null>(null);
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
      getVisibleSalesmanTasks(supabase),
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

        const viewer = await getCurrentSalesmanTaskViewerContext(supabase);

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

        if (!canViewSalesmanTaskBoard(viewer.role, viewer.status)) {
          setTasks([]);
          setTeamOptions([]);
          setPageFeedback(null);
          return;
        }

        const [nextTasks, nextTeamOptions] = await Promise.all([
          getVisibleSalesmanTasks(supabase),
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
          message: toSalesmanTaskErrorMessage(error),
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

  const canView = canViewSalesmanTaskBoard(viewerRole, viewerStatus);

  const summary = useMemo(
    () => ({
      all: tasks.length,
      available: tasks.filter((task) => task.status === "to_be_accepted").length,
      mine: tasks.filter(
        (task) => task.status === "accepted" && task.accepted_by_user_id === viewerId,
      ).length,
      completed: tasks.filter(
        (task) => task.status === "completed" && task.accepted_by_user_id === viewerId,
      ).length,
    }),
    [tasks, viewerId],
  );

  const teamNameById = useMemo(
    () => new Map(teamOptions.map((team) => [team.team_id, team.team_name ?? "未命名团队"])),
    [teamOptions],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearchText = normalizeSearchText(deferredSearchText);

    return tasks.filter((task) => {
      if (filters.scope !== "all" && task.scope !== filters.scope) {
        return false;
      }

      if (filters.focus === "available" && task.status !== "to_be_accepted") {
        return false;
      }

      if (
        filters.focus === "in_progress" &&
        !(task.status === "accepted" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (
        filters.focus === "completed" &&
        !(task.status === "completed" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (!normalizedSearchText) {
        return true;
      }

      const searchableText = [
        task.task_name,
        task.task_intro,
        resolveTaskTargetLabel(task, teamNameById),
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedSearchText);
    });
  }, [deferredSearchText, filters.focus, filters.scope, tasks, teamNameById, viewerId]);

  const handleAcceptTask = useCallback(
    async (taskId: string) => {
      if (!supabase || busyTaskId) {
        return;
      }

      setBusyTaskId(taskId);
      setPageFeedback(null);

      try {
        await acceptSalesmanTask(supabase, taskId);
        await refreshQuietly();
        setPageFeedback({
          tone: "success",
          message: "任务已接取，开始处理吧。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error),
        });
      } finally {
        setBusyTaskId(null);
      }
    },
    [busyTaskId, refreshQuietly, supabase],
  );

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      if (!supabase || busyTaskId) {
        return;
      }

      setBusyTaskId(taskId);
      setPageFeedback(null);

      try {
        await completeSalesmanTask(supabase, taskId);
        await refreshQuietly();
        setPageFeedback({
          tone: "success",
          message: "任务已完成。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error),
        });
      } finally {
        setBusyTaskId(null);
      }
    },
    [busyTaskId, refreshQuietly, supabase],
  );

  const handleOpenAttachment = useCallback(
    async (taskId: string, attachment: SalesmanTaskRow["attachments"][number]) => {
      if (!supabase) {
        return;
      }

      const busyKey = `${taskId}:${attachment.id}`;
      setAttachmentBusyKey(busyKey);

      try {
        const signedUrl = await getTaskAttachmentSignedUrl(supabase, attachment);
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error),
        });
      } finally {
        setAttachmentBusyKey(null);
      }
    },
    [supabase],
  );

  if (loading) {
    return <SalesmanTasksLoadingState />;
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
              我的任务
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">任务中心</h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              查看当前可参与的任务，跟进自己正在处理的事项，并在完成后及时更新进度。
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            accent="blue"
            count={summary.all}
            icon={<ClipboardList className="size-5" />}
            label="可见任务"
          />
          <SummaryCard
            accent="gold"
            count={summary.available}
            icon={<Clock3 className="size-5" />}
            label="待接取"
          />
          <SummaryCard
            accent="blue"
            count={summary.mine}
            icon={<CircleCheckBig className="size-5" />}
            label="进行中"
          />
          <SummaryCard
            accent="green"
            count={summary.completed}
            icon={<CheckCheck className="size-5" />}
            label="已完成"
          />
        </div>
      </section>

      {!canView ? (
        <EmptyState
          description="当前账号暂时不能进入任务中心，请确认账号角色和状态。"
          icon={<ShieldAlert className="size-6" />}
          title="暂时无法查看任务"
        />
      ) : (
        <>
          <section className="rounded-[26px] border border-white/85 bg-white/80 p-5 shadow-[0_14px_32px_rgba(96,113,128,0.06)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.6fr))]">
              <SearchField
                label="搜索任务"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    searchText: value,
                  }))
                }
                placeholder="搜索任务名称、说明或任务范围"
                value={filters.searchText}
              />

              <FilterField
                label="查看范围"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    focus: value as FocusFilter,
                  }))
                }
                value={filters.focus}
              >
                <option value="all">全部任务</option>
                <option value="available">待接取</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </FilterField>

              <FilterField
                label="任务类型"
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    scope: value as ScopeFilter,
                  }))
                }
                value={filters.scope}
              >
                <option value="all">全部类型</option>
                <option value="public">面向全员</option>
                <option value="team">团队任务</option>
              </FilterField>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">任务列表</h3>
              <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                当前共匹配到 {filteredTasks.length} 个任务。
              </p>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState
                description="暂时没有符合当前条件的任务，稍后再来看看。"
                icon={<ClipboardList className="size-6" />}
                title="还没有任务"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredTasks.map((task) => (
                  <TaskCard
                    attachmentBusyKey={attachmentBusyKey}
                    busy={busyTaskId === task.id}
                    key={task.id}
                    onAccept={() => void handleAcceptTask(task.id)}
                    onComplete={() => void handleCompleteTask(task.id)}
                    onOpenAttachment={(attachment) =>
                      void handleOpenAttachment(task.id, attachment)
                    }
                    task={task}
                    teamNameById={teamNameById}
                    viewerId={viewerId}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function SalesmanTasksLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载任务...
      </div>
    </div>
  );
}

function TaskCard({
  task,
  viewerId,
  busy,
  attachmentBusyKey,
  teamNameById,
  onAccept,
  onComplete,
  onOpenAttachment,
}: {
  task: SalesmanTaskRow;
  viewerId: string | null;
  busy: boolean;
  attachmentBusyKey: string | null;
  teamNameById: Map<string, string>;
  onAccept: () => void;
  onComplete: () => void;
  onOpenAttachment: (attachment: SalesmanTaskRow["attachments"][number]) => void;
}) {
  const isMine = task.accepted_by_user_id === viewerId;
  const targetLabel = resolveTaskTargetLabel(task, teamNameById);

  return (
    <article className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-5">
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

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{task.task_name}</h3>
          <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
            {task.task_intro ?? "暂无任务说明。"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile label="任务范围" value={targetLabel} />
          <InfoTile label="发布时间" value={formatDateTime(task.created_at)} />
          <InfoTile label="开始时间" value={formatDateTime(task.accepted_at)} />
          <InfoTile label="完成时间" value={formatDateTime(task.completed_at)} />
        </div>

        {task.attachments.length > 0 ? (
          <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">任务附件</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.attachments.map((attachment) => {
                const attachmentKey = `${task.id}:${attachment.id}`;
                const attachmentBusy = attachmentBusyKey === attachmentKey;

                return (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782] transition hover:bg-[#e1ebf0] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={attachmentBusy}
                    key={attachment.id}
                    onClick={() => onOpenAttachment(attachment)}
                    type="button"
                  >
                    {attachmentBusy ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="size-3.5" />
                    )}
                    {attachment.original_name}
                    <span className="text-[#6f7b85]">
                      {formatFileSize(attachment.file_size_bytes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {task.status === "to_be_accepted" ? (
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] disabled:opacity-70"
              disabled={busy}
              onClick={onAccept}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CircleCheckBig className="size-4" />
              )}
              接取任务
            </Button>
          ) : null}

          {task.status === "accepted" && isMine ? (
            <Button
              className="h-11 rounded-full bg-[#4c7259] px-5 text-white hover:bg-[#43664f] disabled:opacity-70"
              disabled={busy}
              onClick={onComplete}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              标记完成
            </Button>
          ) : null}

          {task.status === "accepted" && !isMine ? (
            <p className="text-sm leading-7 text-[#7b858d]">这项任务当前已有同事接手。</p>
          ) : null}

          {task.status === "completed" ? (
            <p className="text-sm leading-7 text-[#7b858d]">
              {isMine ? "你已完成这项任务。" : "这项任务已完成。"}
            </p>
          ) : null}
        </div>
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
        className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function TaskStatusPill({
  status,
}: {
  status: SalesmanTaskRow["status"];
}) {
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

function TaskScopePill({
  scope,
}: {
  scope: SalesmanTaskRow["scope"];
}) {
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
  accent: "blue";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
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

function canViewSalesmanTaskBoard(role: AppRole | null, status: UserStatus | null) {
  return role === "salesman" && status === "active";
}

function resolveTaskTargetLabel(task: SalesmanTaskRow, teamNameById: Map<string, string>) {
  if (task.scope === "public") {
    return "面向全员";
  }

  if (task.team_id) {
    return teamNameById.get(task.team_id) ?? "团队任务";
  }

  return "团队任务";
}

function mapTaskStatus(status: SalesmanTaskRow["status"]) {
  if (status === "to_be_accepted") {
    return { label: "待接取", accent: "gold" as const };
  }

  if (status === "accepted") {
    return { label: "进行中", accent: "blue" as const };
  }

  return { label: "已完成", accent: "green" as const };
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toSalesmanTaskErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("current user cannot accept this task")) {
    return "当前还不能接取这项任务。";
  }

  if (baseMessage.includes("task is not available for acceptance")) {
    return "这项任务刚刚已经被接取了，请刷新后查看最新状态。";
  }

  if (baseMessage.includes("current user cannot complete this task")) {
    return "当前还不能完成这项任务。";
  }

  if (baseMessage.includes("task is not in accepted status")) {
    return "这项任务当前还不能标记为完成。";
  }

  if (baseMessage.includes("current user is not active")) {
    return "当前账号未激活，暂时不能处理任务。";
  }

  return baseMessage;
}
