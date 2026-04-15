"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
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
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { getVisibleTeamOverviews, type TeamOverview } from "@/lib/team-management";
import { useBrowserCloudSyncRecovery } from "@/lib/use-browser-cloud-sync-recovery";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import { Button } from "../ui/button";
import { DashboardCenteredLoadingState } from "./dashboard-centered-loading-state";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardPaginationControls } from "./dashboard-pagination-controls";
import {
  EmptyState,
  PageBanner,
  formatDateTime,
  formatFileSize,
  normalizeSearchText,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskScopeLabel,
  getTaskStatusMeta,
  getTaskTeamName,
  resolveSalesmanTaskTargetLabel,
  toSalesmanTaskErrorMessage,
} from "./tasks-copy";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type FocusFilter = "all" | "available" | "in_progress" | "completed";
type ScopeFilter = "all" | "public" | "team";

export function SalesmanTasksClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Tasks.salesman");
  const sharedT = useTranslations("Tasks.shared");

  const [loading, setLoading] = useState(true);
  const { recoverCloudSync, syncGeneration } = useBrowserCloudSyncRecovery();
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
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, sharedT, supabase],
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
    () => new Map(teamOptions.map((team) => [team.team_id, getTaskTeamName(team.team_name, sharedT)])),
    [sharedT, teamOptions],
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
        resolveSalesmanTaskTargetLabel(task, teamNameById, sharedT),
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedSearchText);
    });
  }, [deferredSearchText, filters.focus, filters.scope, sharedT, tasks, teamNameById, viewerId]);
  const tasksPagination = useDashboardPagination(filteredTasks);

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
          message: t("feedback.accepted"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        setBusyTaskId(null);
      }
    },
    [busyTaskId, refreshQuietly, sharedT, supabase, t],
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
          message: t("feedback.completed"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        setBusyTaskId(null);
      }
    },
    [busyTaskId, refreshQuietly, sharedT, supabase, t],
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
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        setAttachmentBusyKey(null);
      }
    },
    [sharedT, supabase],
  );

  if (loading) {
    return <DashboardCenteredLoadingState message={t("loading")} />;
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
              {t("header.badge")}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">{t("header.title")}</h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{t("header.description")}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard accent="blue" icon={<ClipboardList className="size-5" />} label={t("summary.all")} value={summary.all} />
          <DashboardMetricCard accent="gold" icon={<Clock3 className="size-5" />} label={t("summary.available")} value={summary.available} />
          <DashboardMetricCard accent="blue" icon={<CircleCheckBig className="size-5" />} label={t("summary.inProgress")} value={summary.mine} />
          <DashboardMetricCard accent="green" icon={<CheckCheck className="size-5" />} label={t("summary.completed")} value={summary.completed} />
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
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.6fr))]">
              <SearchField
                label={t("filters.searchLabel")}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    searchText: value,
                  }))
                }
                placeholder={t("filters.searchPlaceholder")}
                value={filters.searchText}
              />

              <FilterField label={t("filters.focusLabel")} onChange={(value) => setFilters((current) => ({ ...current, focus: value as FocusFilter }))} value={filters.focus}>
                <option value="all">{t("filters.focusAll")}</option>
                <option value="available">{t("filters.focusAvailable")}</option>
                <option value="in_progress">{t("filters.focusInProgress")}</option>
                <option value="completed">{t("filters.focusCompleted")}</option>
              </FilterField>

              <FilterField label={t("filters.scopeLabel")} onChange={(value) => setFilters((current) => ({ ...current, scope: value as ScopeFilter }))} value={filters.scope}>
                <option value="all">{t("filters.scopeAll")}</option>
                <option value="public">{sharedT("scope.public")}</option>
                <option value="team">{sharedT("scope.team")}</option>
              </FilterField>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{t("list.title")}</h3>
              <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                {t("list.description", { count: filteredTasks.length })}
              </p>
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
                    attachmentBusyKey={attachmentBusyKey}
                    busy={busyTaskId === task.id}
                    key={task.id}
                    onAccept={() => void handleAcceptTask(task.id)}
                    onComplete={() => void handleCompleteTask(task.id)}
                    onOpenAttachment={(attachment) => void handleOpenAttachment(task.id, attachment)}
                    task={task}
                    teamNameById={teamNameById}
                    viewerId={viewerId}
                  />
                ))}
              </div>
            )}
            <DashboardPaginationControls
              endIndex={tasksPagination.endIndex}
              hasNextPage={tasksPagination.hasNextPage}
              hasPreviousPage={tasksPagination.hasPreviousPage}
              onNextPage={tasksPagination.goToNextPage}
              onPreviousPage={tasksPagination.goToPreviousPage}
              page={tasksPagination.page}
              pageCount={tasksPagination.pageCount}
              startIndex={tasksPagination.startIndex}
              totalItems={tasksPagination.totalItems}
            />
          </section>
        </>
      )}
    </section>
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
  const t = useTranslations("Tasks.salesman.card");
  const sharedT = useTranslations("Tasks.shared");
  const isMine = task.accepted_by_user_id === viewerId;
  const targetLabel = resolveSalesmanTaskTargetLabel(task, teamNameById, sharedT);

  return (
    <article className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusPill status={task.status} />
          <TaskScopePill scope={task.scope} />
          {task.attachments.length > 0 ? (
            <DataPill accent="blue">
              <Paperclip className="size-3.5" />
              {getTaskAttachmentCountLabel(task.attachments.length, sharedT)}
            </DataPill>
          ) : null}
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{task.task_name}</h3>
          <p className="mt-3 text-sm leading-7 text-[#6f7b85]">{getTaskIntroText(task.task_intro, sharedT)}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile label={t("taskScopeLabel")} value={targetLabel} />
          <InfoTile label={t("createdAtLabel")} value={formatDateTime(task.created_at)} />
          <InfoTile label={t("acceptedAtLabel")} value={formatDateTime(task.accepted_at)} />
          <InfoTile label={t("completedAtLabel")} value={formatDateTime(task.completed_at)} />
        </div>

        {task.attachments.length > 0 ? (
          <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">{t("attachmentsTitle")}</p>
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
                    <span className="text-[#6f7b85]">{formatFileSize(attachment.file_size_bytes)}</span>
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
              {t("accept")}
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
              {t("complete")}
            </Button>
          ) : null}

          {task.status === "accepted" && !isMine ? (
            <p className="text-sm leading-7 text-[#7b858d]">{t("takenByOthers")}</p>
          ) : null}

          {task.status === "completed" ? (
            <p className="text-sm leading-7 text-[#7b858d]">
              {isMine ? t("completedByMe") : t("completedGeneric")}
            </p>
          ) : null}
        </div>
      </div>
    </article>
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
  const sharedT = useTranslations("Tasks.shared");
  const mapping = getTaskStatusMeta(status, sharedT);

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
  const sharedT = useTranslations("Tasks.shared");

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        scope === "public" ? "bg-[#edf2f7] text-[#486782]" : "bg-[#eef6ef] text-[#4c7259]",
      ].join(" ")}
    >
      {scope === "public" ? <Globe2 className="size-3.5" /> : <UsersRound className="size-3.5" />}
      {getTaskScopeLabel(scope, sharedT)}
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
