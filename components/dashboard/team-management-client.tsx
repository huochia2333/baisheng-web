"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CirclePlus,
  Crown,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import {
  addTeamSalesman,
  deleteTeamProfile,
  getTeamDetail,
  getTeamManagerCandidates,
  getTeamSalesmanCandidates,
  getVisibleTeamOverviews,
  removeTeamSalesman,
  saveTeamProfile,
  type TeamClient,
  type TeamDetail,
  type TeamManagerCandidate,
  type TeamMember,
  type TeamOverview,
  type TeamSalesmanCandidate,
} from "@/lib/team-management";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "@/lib/user-self-service";

import { Button } from "../ui/button";
import { DashboardCenteredLoadingState } from "./dashboard-centered-loading-state";
import { DashboardMetricCard } from "./dashboard-metric-card";
import {
  EmptyState,
  PageBanner,
  formatDateTime,
  mapUserStatus,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  getManagerCandidateLabel,
  getOptionalEmailLabel,
  getOptionalRecordLabel,
  getOptionalTeamAssignmentLabel,
  getTeamDisplayName,
  getTeamManagementDescription,
  getTeamManagerLabel,
  resolvePreferredTeamId,
  toTeamManagementErrorMessage,
} from "./team-management-copy";

type PageFeedback = { tone: NoticeTone; message: string } | null;

const EMPTY_TEAM_DETAIL: TeamDetail = {
  team: null,
  members: [],
  clients: [],
};

export function TeamManagementClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const { locale } = useLocale();
  const t = useTranslations("TeamManagement");

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [overviews, setOverviews] = useState<TeamOverview[]>([]);
  const [detail, setDetail] = useState<TeamDetail>(EMPTY_TEAM_DETAIL);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [candidateSalesmen, setCandidateSalesmen] = useState<TeamSalesmanCandidate[]>([]);
  const [managerCandidates, setManagerCandidates] = useState<TeamManagerCandidate[]>([]);
  const [createManagerCandidates, setCreateManagerCandidates] = useState<
    TeamManagerCandidate[]
  >([]);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [managerUserIdDraft, setManagerUserIdDraft] = useState("");
  const [createTeamNameDraft, setCreateTeamNameDraft] = useState("");
  const [createManagerUserIdDraft, setCreateManagerUserIdDraft] = useState("");
  const [memberSearchText, setMemberSearchText] = useState("");
  const [clientSearchText, setClientSearchText] = useState("");
  const [candidateSearchText, setCandidateSearchText] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadTeamPanel = useCallback(
    async ({
      isMounted,
      preferredTeamId,
      showLoading,
    }: {
      isMounted: () => boolean;
      preferredTeamId?: string | null;
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

        const sessionContext = await getCurrentSessionContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!sessionContext.user) {
          router.replace("/login");
          return;
        }

        setViewerRole(sessionContext.role);
        setViewerStatus(sessionContext.status);

        if (!canViewTeamPanel(sessionContext.role, sessionContext.status)) {
          setOverviews([]);
          setDetail(EMPTY_TEAM_DETAIL);
          setSelectedTeamId(null);
          setCandidateSalesmen([]);
          setManagerCandidates([]);
          setCreateManagerCandidates([]);
          setTeamNameDraft("");
          setManagerUserIdDraft("");
          setCreateTeamNameDraft("");
          setCreateManagerUserIdDraft("");
          setPageFeedback(null);
          return;
        }

        const nextOverviews = await getVisibleTeamOverviews(supabase);

        if (!isMounted()) {
          return;
        }

        const nextSelectedTeamId = resolvePreferredTeamId(
          nextOverviews,
          preferredTeamId ?? selectedTeamId,
        );
        const nextDetail = nextSelectedTeamId
          ? await getTeamDetail(supabase, nextSelectedTeamId)
          : EMPTY_TEAM_DETAIL;

        if (!isMounted()) {
          return;
        }

        const [nextSalesmanCandidates, nextManagerCandidates, nextCreateManagerCandidates] =
          await Promise.all([
            nextDetail.team?.can_manage &&
            (sessionContext.role === "administrator" || sessionContext.role === "manager")
              ? getTeamSalesmanCandidates(supabase, nextDetail.team.team_id)
              : Promise.resolve([]),
            sessionContext.role === "administrator" && nextDetail.team
              ? getTeamManagerCandidates(supabase, nextDetail.team.team_id)
              : Promise.resolve([]),
            sessionContext.role === "administrator"
              ? getTeamManagerCandidates(supabase, null)
              : Promise.resolve([]),
          ]);

        if (!isMounted()) {
          return;
        }

        setOverviews(nextOverviews);
        setDetail(nextDetail);
        setSelectedTeamId(nextDetail.team?.team_id ?? nextSelectedTeamId ?? null);
        setCandidateSalesmen(nextSalesmanCandidates);
        setManagerCandidates(nextManagerCandidates);
        setCreateManagerCandidates(nextCreateManagerCandidates);
        setTeamNameDraft(nextDetail.team?.team_name ?? "");
        setManagerUserIdDraft(nextDetail.team?.manager_user_id ?? "");
        setCreateTeamNameDraft("");
        setCreateManagerUserIdDraft("");
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error, t),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, selectedTeamId, supabase, t],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadTeamPanel({
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

      await loadTeamPanel({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const canView = canViewTeamPanel(viewerRole, viewerStatus);
  const canManageSelectedTeam = detail.team?.can_manage === true;

  const aggregateStats = useMemo(
    () => ({
      teamCount: overviews.length,
      totalMembers: overviews.reduce((sum, team) => sum + team.member_count, 0),
      totalClients: overviews.reduce((sum, team) => sum + team.client_count, 0),
      manageableTeams: overviews.filter((team) => team.can_manage).length,
    }),
    [overviews],
  );

  const filteredMembers = useMemo(
    () => filterTeamMembers(detail.members, memberSearchText, locale),
    [detail.members, locale, memberSearchText],
  );
  const filteredClients = useMemo(
    () => filterTeamClients(detail.clients, clientSearchText, locale),
    [clientSearchText, detail.clients, locale],
  );
  const filteredCandidates = useMemo(
    () => filterTeamCandidates(candidateSalesmen, candidateSearchText, locale),
    [candidateSalesmen, candidateSearchText, locale],
  );
  const availableCandidateCount = useMemo(
    () => candidateSalesmen.filter((candidate) => candidate.assignable).length,
    [candidateSalesmen],
  );

  const refreshAuthClaims = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }
  }, [supabase]);

  const refreshQuietly = useCallback(
    async (preferredTeamId?: string | null) => {
      await loadTeamPanel({
        isMounted: () => true,
        preferredTeamId,
        showLoading: false,
      });
    },
    [loadTeamPanel],
  );

  const handleSaveTeam = useCallback(async () => {
    if (!supabase || !teamNameDraft.trim()) {
      return;
    }

    setBusyKey("save-team");

    try {
      const teamId = await saveTeamProfile(supabase, {
        teamName: teamNameDraft,
        teamId: detail.team?.team_id ?? null,
        managerUserId:
          viewerRole === "administrator" ? managerUserIdDraft || null : undefined,
      });
      await refreshAuthClaims();
      await refreshQuietly(teamId);
      setPageFeedback({
        tone: "success",
        message: detail.team ? t("feedback.updated") : t("feedback.createdAndContinue"),
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error, t),
      });
    } finally {
      setBusyKey(null);
    }
  }, [
    detail.team,
    managerUserIdDraft,
    refreshAuthClaims,
    refreshQuietly,
    supabase,
    t,
    teamNameDraft,
    viewerRole,
  ]);

  const handleCreateTeam = useCallback(async () => {
    if (!supabase || viewerRole !== "administrator" || !createTeamNameDraft.trim()) {
      return;
    }

    setBusyKey("create-team");

    try {
      const teamId = await saveTeamProfile(supabase, {
        teamName: createTeamNameDraft,
        managerUserId: createManagerUserIdDraft || null,
      });
      await refreshAuthClaims();
      await refreshQuietly(teamId);
      setCreateTeamNameDraft("");
      setCreateManagerUserIdDraft("");
      setPageFeedback({
        tone: "success",
        message: t("feedback.created"),
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error, t),
      });
    } finally {
      setBusyKey(null);
    }
  }, [
    createManagerUserIdDraft,
    createTeamNameDraft,
    refreshAuthClaims,
    refreshQuietly,
    supabase,
    t,
    viewerRole,
  ]);

  const handleAddSalesman = useCallback(
    async (salesmanUserId: string) => {
      if (!supabase || !detail.team?.team_id) {
        return;
      }

      setBusyKey(`add:${salesmanUserId}`);

      try {
        const teamId = await addTeamSalesman(supabase, {
          teamId: detail.team.team_id,
          salesmanUserId,
        });
        await refreshAuthClaims();
        await refreshQuietly(teamId);
        setPageFeedback({
          tone: "success",
          message: t("feedback.memberAdded"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error, t),
        });
      } finally {
        setBusyKey(null);
      }
    },
    [detail.team?.team_id, refreshAuthClaims, refreshQuietly, supabase, t],
  );

  const handleRemoveSalesman = useCallback(
    async (salesmanUserId: string) => {
      if (!supabase || !detail.team?.team_id) {
        return;
      }

      setBusyKey(`remove:${salesmanUserId}`);

      try {
        const teamId = await removeTeamSalesman(supabase, {
          teamId: detail.team.team_id,
          salesmanUserId,
        });
        await refreshAuthClaims();
        await refreshQuietly(teamId);
        setPageFeedback({
          tone: "success",
          message: t("feedback.memberRemoved"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error, t),
        });
      } finally {
        setBusyKey(null);
      }
    },
    [detail.team?.team_id, refreshAuthClaims, refreshQuietly, supabase, t],
  );

  const handleDeleteTeam = useCallback(async () => {
    if (!supabase || viewerRole !== "administrator" || !detail.team?.team_id) {
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        t("confirmDelete", {
          teamName: getTeamDisplayName(detail.team.team_name, t),
        }),
      );

      if (!confirmed) {
        return;
      }
    }

    setBusyKey("delete-team");

    try {
      await deleteTeamProfile(supabase, detail.team.team_id);
      await refreshQuietly(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.deleted"),
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error, t),
      });
    } finally {
      setBusyKey(null);
    }
  }, [detail.team, refreshQuietly, supabase, t, viewerRole]);

  const handleSelectTeam = useCallback(
    async (teamId: string) => {
      if (teamId === selectedTeamId) {
        return;
      }

      setBusyKey(`team:${teamId}`);

      try {
        await refreshQuietly(teamId);
      } finally {
        setBusyKey(null);
      }
    },
    [refreshQuietly, selectedTeamId],
  );

  const handleRefresh = useCallback(async () => {
    setBusyKey("refresh");

    try {
      await refreshQuietly(selectedTeamId);
    } finally {
      setBusyKey(null);
    }
  }, [refreshQuietly, selectedTeamId]);

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
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              {getTeamManagementDescription(viewerRole, t)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
            <DashboardMetricCard accent="blue" icon={<Building2 className="size-5" />} label={t("summary.visibleTeams")} value={aggregateStats.teamCount} />
            <DashboardMetricCard accent="green" icon={<UsersRound className="size-5" />} label={t("summary.teamMembers")} value={aggregateStats.totalMembers} />
            <DashboardMetricCard accent="gold" icon={<BriefcaseBusiness className="size-5" />} label={t("summary.teamClients")} value={aggregateStats.totalClients} />
            <DashboardMetricCard accent="blue" icon={<Crown className="size-5" />} label={t("summary.manageableTeams")} value={aggregateStats.manageableTeams} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
            disabled={busyKey !== null}
            onClick={() => void handleRefresh()}
            variant="outline"
          >
            {busyKey === "refresh" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("header.refresh")}
          </Button>
          {canManageSelectedTeam ? (
            <div className="inline-flex items-center rounded-full bg-[#eef5ef] px-4 py-2 text-sm text-[#4c7259]">
              {t("header.manageableHint")}
            </div>
          ) : null}
        </div>
      </section>

      {canView && viewerRole === "administrator" ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <SectionHeader
            description={t("adminCreate.description")}
            title={t("adminCreate.title")}
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                {t("adminCreate.teamNameLabel")}
              </p>
              <input
                className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                onChange={(event) => setCreateTeamNameDraft(event.target.value)}
                placeholder={t("adminCreate.teamNamePlaceholder")}
                value={createTeamNameDraft}
              />
            </label>

            <label className="block">
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                {t("adminCreate.managerLabel")}
              </p>
              <select
                className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                onChange={(event) => setCreateManagerUserIdDraft(event.target.value)}
                value={createManagerUserIdDraft}
              >
                <option value="">{t("shared.managerOptionNone")}</option>
                {createManagerCandidates.map((candidate) => (
                  <option
                    disabled={!candidate.assignable}
                    key={candidate.user_id}
                    value={candidate.user_id}
                  >
                    {getManagerCandidateLabel(candidate, t)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button
                className="h-12 w-full rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] xl:w-auto"
                disabled={!createTeamNameDraft.trim() || busyKey !== null}
                onClick={() => void handleCreateTeam()}
              >
                {busyKey === "create-team" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CirclePlus className="size-4" />
                )}
                {t("adminCreate.button")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!canView ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : viewerRole === "manager" && overviews.length === 0 ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f6] text-[#486782]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
                  {t("managerSetup.title")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  {t("managerSetup.description")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
              <label className="block">
                <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                  {t("managerSetup.teamNameLabel")}
                </p>
                <input
                  className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                  onChange={(event) => setTeamNameDraft(event.target.value)}
                  placeholder={t("managerSetup.teamNamePlaceholder")}
                  value={teamNameDraft}
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={!teamNameDraft.trim() || busyKey !== null}
                  onClick={() => void handleSaveTeam()}
                >
                  {busyKey === "save-team" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                  {t("managerSetup.button")}
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <EmptyState
              description={t("managerSetup.emptyDescription")}
              icon={<UsersRound className="size-6" />}
              title={t("managerSetup.emptyTitle")}
            />
          </section>
        </section>
      ) : overviews.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noTeamDataDescription")}
            icon={<Building2 className="size-6" />}
            title={t("states.noTeamDataTitle")}
          />
        </section>
      ) : (
        <>
          {overviews.length > 1 || viewerRole !== "manager" ? (
            <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
              <SectionHeader
                description={t("overview.description")}
                title={t("overview.title")}
              />

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {overviews.map((team) => (
                  <button
                    key={team.team_id}
                    className={[
                      "rounded-[24px] border p-5 text-left shadow-[0_10px_24px_rgba(96,113,128,0.05)] transition-all",
                      selectedTeamId === team.team_id
                        ? "border-[#8fb3cf] bg-[#f4f8fb]"
                        : "border-[#ebe7e1] bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(96,113,128,0.10)]",
                    ].join(" ")}
                    onClick={() => void handleSelectTeam(team.team_id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold tracking-tight text-[#23313a]">
                          {getTeamDisplayName(team.team_name, t)}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                          {t("overview.managerPrefix", {
                            managerLabel: getTeamManagerLabel(
                              team.manager_name,
                              team.manager_email,
                              t,
                            ),
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.can_manage ? <DataPill accent="blue">{t("shared.pills.manageable")}</DataPill> : null}
                        {selectedTeamId === team.team_id ? (
                          <DataPill accent="green">{t("shared.pills.currentView")}</DataPill>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <MiniMetric label={t("overview.metrics.members")} value={team.member_count} />
                      <MiniMetric label={t("overview.metrics.activeMembers")} value={team.active_member_count} />
                      <MiniMetric label={t("overview.metrics.clients")} value={team.client_count} />
                      <MiniMetric label={t("overview.metrics.vipClients")} value={team.vip_client_count} />
                    </div>

                    {viewerRole === "administrator" &&
                    selectedTeamId === team.team_id &&
                    detail.members.length > 0 ? (
                      <div className="mt-4 rounded-[18px] bg-[#f7f5f2] px-4 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                          {t("overview.memberPreview")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.members.slice(0, 8).map((member) => (
                            <DataPill accent="blue" key={member.user_id}>
                              {member.name ?? member.email ?? member.user_id}
                            </DataPill>
                          ))}
                          {detail.members.length > 8 ? (
                            <DataPill accent="gold">
                              {t("overview.moreMembers", { count: detail.members.length - 8 })}
                            </DataPill>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {detail.team ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-[#23313a]">
                          {getTeamDisplayName(detail.team.team_name, t)}
                        </h3>
                        {detail.team.can_manage ? <DataPill accent="blue">{t("shared.pills.manageable")}</DataPill> : null}
                        {viewerRole === "administrator" ? (
                          <DataPill accent="gold">{t("shared.pills.adminView")}</DataPill>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
                        {t("detail.managerSummary", {
                          managerLabel: getTeamManagerLabel(
                            detail.team.manager_name,
                            detail.team.manager_email,
                            t,
                          ),
                          joinedAt: formatDateTime(detail.team.last_member_joined_at, locale),
                        })}
                      </p>
                    </div>

                    {canManageSelectedTeam ? (
                      <div className="w-full max-w-[360px] rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
                        <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                          {t("detail.editTitle")}
                        </p>
                        <input
                          className="mt-3 h-11 w-full rounded-[16px] border border-[#e1ddd7] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                          onChange={(event) => setTeamNameDraft(event.target.value)}
                          placeholder={t("detail.teamNamePlaceholder")}
                          value={teamNameDraft}
                        />
                        {viewerRole === "administrator" ? (
                          <select
                            className="mt-3 h-11 w-full rounded-[16px] border border-[#e1ddd7] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                            onChange={(event) => setManagerUserIdDraft(event.target.value)}
                            value={managerUserIdDraft}
                          >
                            <option value="">{t("shared.managerOptionNone")}</option>
                            {managerCandidates.map((candidate) => (
                              <option
                                disabled={!candidate.assignable}
                                key={candidate.user_id}
                                value={candidate.user_id}
                              >
                                {getManagerCandidateLabel(candidate, t)}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <Button
                          className="mt-3 h-10 w-full rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                          disabled={!teamNameDraft.trim() || busyKey !== null}
                          onClick={() => void handleSaveTeam()}
                        >
                          {busyKey === "save-team" ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Building2 className="size-4" />
                          )}
                          {t("detail.saveButton")}
                        </Button>
                        {viewerRole === "administrator" ? (
                          <Button
                            className="mt-3 h-10 w-full rounded-full border-[#f1d1d1] bg-[#fff2f2] text-[#b13d3d] hover:bg-[#fce5e5]"
                            disabled={busyKey !== null}
                            onClick={() => void handleDeleteTeam()}
                            variant="outline"
                          >
                            {busyKey === "delete-team" ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            {t("detail.deleteButton")}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard icon={<UsersRound className="size-5" />} label={t("detail.metrics.members")} tone="blue" value={detail.team.member_count} />
                    <MetricCard icon={<Star className="size-5" />} label={t("detail.metrics.activeMembers")} tone="green" value={detail.team.active_member_count} />
                    <MetricCard icon={<BriefcaseBusiness className="size-5" />} label={t("detail.metrics.clients")} tone="gold" value={detail.team.client_count} />
                    <MetricCard icon={<Crown className="size-5" />} label={t("detail.metrics.vipClients")} tone="blue" value={detail.team.vip_client_count} />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <SectionHeader
                  description={t("insights.description")}
                  title={t("insights.title")}
                />

                <div className="mt-6 space-y-4">
                  <InsightCard
                    description={
                      detail.team.active_member_count === 0
                        ? t("insights.activeEmptyDescription")
                        : t("insights.activeReadyDescription")
                    }
                    title={t("insights.activeTitle", { count: detail.team.active_member_count })}
                  />
                  <InsightCard
                    description={
                      detail.team.vip_client_count === 0
                        ? t("insights.vipEmptyDescription")
                        : t("insights.vipReadyDescription")
                    }
                    title={t("insights.vipTitle", { count: detail.team.vip_client_count })}
                  />
                  <InsightCard
                    description={t("insights.relationsDescription", {
                      count: detail.clients.length,
                    })}
                    title={t("insights.relationsTitle", { count: detail.clients.length })}
                  />
                </div>
              </section>
            </section>
          ) : null}

          {detail.team ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <SectionHeader
                  description={t("members.description")}
                  title={t("members.title")}
                />

                <div className="mt-5">
                  <SearchField
                    onChange={setMemberSearchText}
                    placeholder={t("members.searchPlaceholder")}
                    value={memberSearchText}
                  />
                </div>

                <div className="mt-6 grid gap-4">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <MemberCard
                        busy={busyKey === `remove:${member.user_id}`}
                        canManage={canManageSelectedTeam}
                        key={member.user_id}
                        member={member}
                        onRemove={handleRemoveSalesman}
                      />
                    ))
                  ) : (
                    <EmptyState
                      description={t("members.emptyDescription")}
                      icon={<UsersRound className="size-6" />}
                      title={t("members.emptyTitle")}
                    />
                  )}
                </div>
              </section>

              {canManageSelectedTeam ? (
                <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                  <SectionHeader
                    description={t("candidates.description")}
                    title={t("candidates.title")}
                  />

                  <div className="mt-5">
                    <SearchField
                      onChange={setCandidateSearchText}
                      placeholder={t("candidates.searchPlaceholder")}
                      value={candidateSearchText}
                    />
                  </div>

                  <div className="mt-4 rounded-[22px] border border-[#d9e8dc] bg-[#edf5ef] px-4 py-3 text-sm text-[#42624b]">
                    {t("candidates.availableCount", { count: availableCandidateCount })}
                  </div>

                  <div className="mt-6 space-y-3">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((candidate) => (
                        <CandidateCard
                          busy={busyKey === `add:${candidate.user_id}`}
                          candidate={candidate}
                          key={candidate.user_id}
                          onAdd={handleAddSalesman}
                        />
                      ))
                    ) : (
                      <EmptyState
                        description={t("candidates.emptyDescription")}
                        icon={<UserPlus className="size-6" />}
                        title={t("candidates.emptyTitle")}
                      />
                    )}
                  </div>
                </section>
              ) : (
                <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                  <EmptyState
                    description={t("candidates.readOnlyDescription")}
                    icon={<ShieldAlert className="size-6" />}
                    title={t("candidates.readOnlyTitle")}
                  />
                </section>
              )}
            </section>
          ) : null}

          {detail.team ? (
            <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
              <SectionHeader
                description={t("clients.description")}
                title={t("clients.title")}
              />

              <div className="mt-5">
                <SearchField
                  onChange={setClientSearchText}
                  placeholder={t("clients.searchPlaceholder")}
                  value={clientSearchText}
                />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <ClientCard
                      client={client}
                      key={`${client.user_id}-${client.created_at ?? ""}`}
                    />
                  ))
                ) : (
                  <div className="lg:col-span-2">
                    <EmptyState
                      description={t("clients.emptyDescription")}
                      icon={<BriefcaseBusiness className="size-6" />}
                      title={t("clients.emptyTitle")}
                    />
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{description}</p>
    </div>
  );
}


function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]",
        tone === "blue" ? "border-[#dde7ef] bg-[#f7fafc]" : "",
        tone === "green" ? "border-[#dce8df] bg-[#f2f7f3]" : "",
        tone === "gold" ? "border-[#eadfbf] bg-[#fbf5e8]" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full text-white",
            tone === "blue" ? "bg-[#486782]" : "",
            tone === "green" ? "bg-[#4c7259]" : "",
            tone === "gold" ? "bg-[#b7892f]" : "",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#23313a]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-[#f7f5f2] px-3 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#23313a]">{value}</p>
    </div>
  );
}

function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
      <p className="text-lg font-semibold tracking-tight text-[#23313a]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{description}</p>
    </article>
  );
}

function MemberCard({
  member,
  canManage,
  onRemove,
  busy,
}: {
  member: TeamMember;
  canManage: boolean;
  onRemove: (salesmanUserId: string) => Promise<void>;
  busy: boolean;
}) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(member.status, locale);

  return (
    <article className="rounded-[24px] border border-[#ebe7e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
              {member.name ?? member.email ?? member.user_id}
            </p>
            <DataPill accent={status.accent === "success" ? "green" : "gold"}>
              {status.label}
            </DataPill>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
            {t("memberCard.emailAndClients", {
              email: getOptionalEmailLabel(member.email, t),
              count: member.client_count,
            })}
          </p>
        </div>

        {canManage ? (
          <Button
            className="h-10 rounded-full border-[#f1d1d1] bg-[#fff2f2] px-4 text-[#b13d3d] hover:bg-[#fce5e5]"
            disabled={busy}
            onClick={() => void onRemove(member.user_id)}
            variant="outline"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UserMinus className="size-4" />
            )}
            {t("memberCard.remove")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label={t("memberCard.joinedAt")} value={formatDateTime(member.joined_at, locale)} />
        <MiniInfo label={t("memberCard.accountCreatedAt")} value={formatDateTime(member.created_at, locale)} />
      </div>
    </article>
  );
}

function CandidateCard({
  candidate,
  onAdd,
  busy,
}: {
  candidate: TeamSalesmanCandidate;
  onAdd: (salesmanUserId: string) => Promise<void>;
  busy: boolean;
}) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(candidate.status, locale);

  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
                {candidate.name ?? candidate.email ?? candidate.user_id}
              </p>
              <DataPill accent={status.accent === "success" ? "green" : "gold"}>
                {status.label}
              </DataPill>
            </div>
            <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
              {getOptionalEmailLabel(candidate.email, t)}
            </p>
          </div>

          <Button
            className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79] disabled:bg-[#9baab6]"
            disabled={!candidate.assignable || busy}
            onClick={() => void onAdd(candidate.user_id)}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {candidate.assignable ? t("candidateCard.add") : t("candidateCard.disabled")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MiniInfo
            label={t("candidateCard.currentTeam")}
            value={getOptionalTeamAssignmentLabel(candidate.current_team_name, t)}
          />
          <MiniInfo
            label={t("candidateCard.directClientCount")}
            value={t("candidateCard.directClientCountValue", {
              count: candidate.direct_client_count,
            })}
          />
        </div>
      </div>
    </article>
  );
}

function ClientCard({ client }: { client: TeamClient }) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(client.status, locale);

  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
              {client.name ?? client.email ?? client.user_id}
            </p>
            <DataPill accent={status.accent === "success" ? "green" : "gold"}>
              {status.label}
            </DataPill>
            {client.vip_status ? <DataPill accent="blue">{t("shared.pills.vip")}</DataPill> : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{getOptionalEmailLabel(client.email, t)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label={t("clientCard.referrer")} value={getOptionalRecordLabel(client.referrer_name, t)} />
        <MiniInfo label={t("clientCard.relatedAt")} value={formatDateTime(client.created_at, locale)} />
      </div>
    </article>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-full border border-[#dfe5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
      <Search className="size-4 text-[#7a8790]" />
      <input
        className="w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function DataPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
        accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        accent === "green" ? "bg-[#e7f3ea] text-[#4c7259]" : "",
        accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#23313a]">{value}</p>
    </div>
  );
}

function canViewTeamPanel(role: AppRole | null, status: UserStatus | null) {
  if (role === "administrator") {
    return true;
  }

  return (
    status === "active" &&
    (role === "manager" || role === "operator" || role === "finance" || role === "salesman")
  );
}

function filterTeamMembers(
  members: TeamMember[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (!normalizedSearchText) {
    return members;
  }

  return members.filter((member) =>
    [member.name, member.email, mapUserStatus(member.status, locale).label, `${member.client_count}`]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

function filterTeamClients(
  clients: TeamClient[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (!normalizedSearchText) {
    return clients;
  }

  return clients.filter((client) =>
    [
      client.name,
      client.email,
      client.referrer_name,
      mapUserStatus(client.status, locale).label,
      client.vip_status ? "vip" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

function filterTeamCandidates(
  candidates: TeamSalesmanCandidate[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (!normalizedSearchText) {
    return candidates;
  }

  return candidates.filter((candidate) =>
    [
      candidate.name,
      candidate.email,
      candidate.current_team_name,
      mapUserStatus(candidate.status, locale).label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}
