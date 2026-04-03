"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

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

import {
  EmptyState,
  PageBanner,
  formatDateTime,
  mapUserStatus,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";
import { Button } from "../ui/button";

type PageFeedback = { tone: NoticeTone; message: string } | null;

const EMPTY_TEAM_DETAIL: TeamDetail = {
  team: null,
  members: [],
  clients: [],
};

export function TeamManagementClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

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
          message: toTeamManagementErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, selectedTeamId, supabase],
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
    () => filterTeamMembers(detail.members, memberSearchText),
    [detail.members, memberSearchText],
  );
  const filteredClients = useMemo(
    () => filterTeamClients(detail.clients, clientSearchText),
    [clientSearchText, detail.clients],
  );
  const filteredCandidates = useMemo(
    () => filterTeamCandidates(candidateSalesmen, candidateSearchText),
    [candidateSalesmen, candidateSearchText],
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
        message: detail.team ? "团队信息已更新。" : "团队已创建，现在可以继续添加业务员成员。",
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error),
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
        message: "新团队已创建。",
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error),
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
          message: "团队成员已加入。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error),
        });
      } finally {
        setBusyKey(null);
      }
    },
    [detail.team?.team_id, refreshAuthClaims, refreshQuietly, supabase],
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
          message: "团队成员已移出。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error),
        });
      } finally {
        setBusyKey(null);
      }
    },
    [detail.team?.team_id, refreshAuthClaims, refreshQuietly, supabase],
  );

  const handleDeleteTeam = useCallback(async () => {
    if (!supabase || viewerRole !== "administrator" || !detail.team?.team_id) {
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `确认删除团队“${detail.team.team_name ?? "未命名团队"}”吗？此操作会移除团队记录及成员归属关系。`,
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
        message: "团队已删除。",
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toTeamManagementErrorMessage(error),
      });
    } finally {
      setBusyKey(null);
    }
  }, [detail.team, refreshQuietly, supabase, viewerRole]);

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
    return <TeamManagementLoadingState />;
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
              团队组织协作
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">团队管理</h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              {getTeamManagementDescription(viewerRole)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
            <SummaryCard
              accent="blue"
              count={aggregateStats.teamCount}
              icon={<Building2 className="size-5" />}
              label="可见团队"
            />
            <SummaryCard
              accent="green"
              count={aggregateStats.totalMembers}
              icon={<UsersRound className="size-5" />}
              label="团队成员"
            />
            <SummaryCard
              accent="gold"
              count={aggregateStats.totalClients}
              icon={<BriefcaseBusiness className="size-5" />}
              label="团队客户"
            />
            <SummaryCard
              accent="blue"
              count={aggregateStats.manageableTeams}
              icon={<Crown className="size-5" />}
              label="可管理团队"
            />
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
            刷新团队数据
          </Button>
          {canManageSelectedTeam ? (
            <div className="inline-flex items-center rounded-full bg-[#eef5ef] px-4 py-2 text-sm text-[#4c7259]">
              当前团队支持直接调整名称和成员
            </div>
          ) : null}
        </div>
      </section>

      {canView && viewerRole === "administrator" ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <SectionHeader
            description="管理员可以直接新建团队，并在创建时指定经理。未被其他团队占用的经理会优先显示为可分配。"
            title="创建团队"
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                团队名称
              </p>
              <input
                className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                onChange={(event) => setCreateTeamNameDraft(event.target.value)}
                placeholder="请输入团队名称"
                value={createTeamNameDraft}
              />
            </label>

            <label className="block">
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                指定经理
              </p>
              <select
                className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                onChange={(event) => setCreateManagerUserIdDraft(event.target.value)}
                value={createManagerUserIdDraft}
              >
                <option value="">暂不指定经理</option>
                {createManagerCandidates.map((candidate) => (
                  <option
                    disabled={!candidate.assignable}
                    key={candidate.user_id}
                    value={candidate.user_id}
                  >
                    {getManagerCandidateLabel(candidate)}
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
                新建团队
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!canView ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前账号暂时没有团队面板访问权限。团队模块会根据角色和激活状态展示不同范围的数据。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无查看权限"
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
                  创建你的团队面板
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  数据库里团队由 `team_profiles` 作为主表、`team_profiles_data`
                  维护成员。你现在还没有团队记录，可以先创建团队名称，再继续添加业务员。
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
              <label className="block">
                <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                  团队名称
                </p>
                <input
                  className="mt-3 h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                  onChange={(event) => setTeamNameDraft(event.target.value)}
                  placeholder="请输入团队名称"
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
                  创建团队
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <EmptyState
              description="团队建立后，这里会开始展示成员、团队客户和可加入的业务员候选。"
              icon={<UsersRound className="size-6" />}
              title="团队数据暂未建立"
            />
          </section>
        </section>
      ) : overviews.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前可见范围内还没有团队数据。等团队关系建立后，这里会自动汇总团队概览。"
            icon={<Building2 className="size-6" />}
            title="暂无团队数据"
          />
        </section>
      ) : (
        <>
          {overviews.length > 1 || viewerRole !== "manager" ? (
            <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
              <SectionHeader
                description="先选择一个团队查看详细成员和客户结构。经理默认会优先定位到自己可管理的团队。"
                title="团队总览"
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
                          {team.team_name ?? "未命名团队"}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                          负责人：{team.manager_name ?? team.manager_email ?? "未设置"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.can_manage ? <DataPill accent="blue">可管理</DataPill> : null}
                        {selectedTeamId === team.team_id ? (
                          <DataPill accent="green">当前查看</DataPill>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <MiniMetric label="成员" value={team.member_count} />
                      <MiniMetric label="活跃成员" value={team.active_member_count} />
                      <MiniMetric label="客户" value={team.client_count} />
                      <MiniMetric label="VIP 客户" value={team.vip_client_count} />
                    </div>

                    {viewerRole === "administrator" &&
                    selectedTeamId === team.team_id &&
                    detail.members.length > 0 ? (
                      <div className="mt-4 rounded-[18px] bg-[#f7f5f2] px-4 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                          团队成员预览
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.members.slice(0, 8).map((member) => (
                            <DataPill accent="blue" key={member.user_id}>
                              {member.name ?? member.email ?? member.user_id}
                            </DataPill>
                          ))}
                          {detail.members.length > 8 ? (
                            <DataPill accent="gold">+{detail.members.length - 8} 更多</DataPill>
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
                          {detail.team.team_name ?? "未命名团队"}
                        </h3>
                        {detail.team.can_manage ? <DataPill accent="blue">可管理</DataPill> : null}
                        {viewerRole === "administrator" ? (
                          <DataPill accent="gold">管理员视角</DataPill>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
                        团队负责人：{detail.team.manager_name ?? detail.team.manager_email ?? "未设置"}。
                        最后一次成员加入时间：{formatDateTime(detail.team.last_member_joined_at)}。
                      </p>
                    </div>

                    {canManageSelectedTeam ? (
                      <div className="w-full max-w-[360px] rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
                        <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                          编辑团队信息
                        </p>
                        <input
                          className="mt-3 h-11 w-full rounded-[16px] border border-[#e1ddd7] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                          onChange={(event) => setTeamNameDraft(event.target.value)}
                          placeholder="请输入团队名称"
                          value={teamNameDraft}
                        />
                        {viewerRole === "administrator" ? (
                          <select
                            className="mt-3 h-11 w-full rounded-[16px] border border-[#e1ddd7] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                            onChange={(event) => setManagerUserIdDraft(event.target.value)}
                            value={managerUserIdDraft}
                          >
                            <option value="">暂不指定经理</option>
                            {managerCandidates.map((candidate) => (
                              <option
                                disabled={!candidate.assignable}
                                key={candidate.user_id}
                                value={candidate.user_id}
                              >
                                {getManagerCandidateLabel(candidate)}
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
                          保存团队信息
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
                            删除团队
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      icon={<UsersRound className="size-5" />}
                      label="团队成员"
                      tone="blue"
                      value={detail.team.member_count}
                    />
                    <MetricCard
                      icon={<Star className="size-5" />}
                      label="活跃成员"
                      tone="green"
                      value={detail.team.active_member_count}
                    />
                    <MetricCard
                      icon={<BriefcaseBusiness className="size-5" />}
                      label="团队客户"
                      tone="gold"
                      value={detail.team.client_count}
                    />
                    <MetricCard
                      icon={<Crown className="size-5" />}
                      label="VIP 客户"
                      tone="blue"
                      value={detail.team.vip_client_count}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <SectionHeader
                  description="这里按数据库里的推荐关系汇总团队客户，方便快速判断团队当前结构。"
                  title="团队画像"
                />

                <div className="mt-6 space-y-4">
                  <InsightCard
                    description={
                      detail.team.active_member_count === 0
                        ? "当前团队还没有激活中的业务员，建议先补齐成员。"
                        : "当前团队已经形成基础成员结构，可以继续安排客户转化。"
                    }
                    title={`${detail.team.active_member_count} 名活跃业务员`}
                  />
                  <InsightCard
                    description={
                      detail.team.vip_client_count === 0
                        ? "暂时还没有 VIP 客户。后续一旦团队客户完成 VIP 标记，这里会同步增长。"
                        : "已有客户完成 VIP 标记，可以直接结合订单和佣金模块继续跟进。"
                    }
                    title={`${detail.team.vip_client_count} 名 VIP 客户`}
                  />
                  <InsightCard
                    description={`当前选中团队下，共沉淀 ${detail.clients.length} 条可见客户推荐关系。`}
                    title={`${detail.clients.length} 条客户关系`}
                  />
                </div>
              </section>
            </section>
          ) : null}

          {detail.team ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <SectionHeader
                  description="业务员成员来自 `team_profiles_data`，每个成员卡片上会同步展示直接客户数量。"
                  title="团队成员"
                />

                <div className="mt-5">
                  <SearchField
                    onChange={setMemberSearchText}
                    placeholder="搜索成员姓名、邮箱或客户状态"
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
                      description="当前搜索条件下没有匹配到团队成员。"
                      icon={<UsersRound className="size-6" />}
                      title="没有成员结果"
                    />
                  )}
                </div>
              </section>

              {canManageSelectedTeam ? (
                <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                  <SectionHeader
                    description="候选列表来自 `salesman` 角色用户。已经归属其他团队的业务员会保留标记，不能重复加入。"
                    title="可加入业务员"
                  />

                  <div className="mt-5">
                    <SearchField
                      onChange={setCandidateSearchText}
                      placeholder="搜索业务员姓名、邮箱或当前团队"
                      value={candidateSearchText}
                    />
                  </div>

                  <div className="mt-4 rounded-[22px] border border-[#d9e8dc] bg-[#edf5ef] px-4 py-3 text-sm text-[#42624b]">
                    当前共有 {availableCandidateCount} 位可直接加入的业务员候选。
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
                        description="当前搜索条件下没有候选业务员。"
                        icon={<UserPlus className="size-6" />}
                        title="没有候选结果"
                      />
                    )}
                  </div>
                </section>
              ) : (
                <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                  <EmptyState
                    description="当前视角主要用于查看团队结构，不提供成员变更操作。"
                    icon={<ShieldAlert className="size-6" />}
                    title="当前为只读视角"
                  />
                </section>
              )}
            </section>
          ) : null}

          {detail.team ? (
            <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
              <SectionHeader
                description="团队客户根据业务员推荐关系拼出来，并同步展示 VIP 标记。"
                title="团队客户"
              />

              <div className="mt-5">
                <SearchField
                  onChange={setClientSearchText}
                  placeholder="搜索客户姓名、邮箱或推荐业务员"
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
                      description="当前搜索条件下没有匹配到团队客户。"
                      icon={<BriefcaseBusiness className="size-6" />}
                      title="没有客户结果"
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

function TeamManagementLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载团队数据...
      </div>
    </div>
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
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
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
  const status = mapUserStatus(member.status);

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
            {member.email ?? "暂无邮箱"} / 直属客户 {member.client_count} 人
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
            移出团队
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="加入团队时间" value={formatDateTime(member.joined_at)} />
        <MiniInfo label="账号创建时间" value={formatDateTime(member.created_at)} />
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
  const status = mapUserStatus(candidate.status);

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
            <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{candidate.email ?? "暂无邮箱"}</p>
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
            {candidate.assignable ? "加入团队" : "不可加入"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MiniInfo label="当前归属团队" value={candidate.current_team_name ?? "未分配"} />
          <MiniInfo label="直属客户数量" value={`${candidate.direct_client_count} 人`} />
        </div>
      </div>
    </article>
  );
}

function ClientCard({ client }: { client: TeamClient }) {
  const status = mapUserStatus(client.status);

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
            {client.vip_status ? <DataPill accent="blue">VIP</DataPill> : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{client.email ?? "暂无邮箱"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="推荐业务员" value={client.referrer_name ?? "暂无记录"} />
        <MiniInfo label="关联时间" value={formatDateTime(client.created_at)} />
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

function resolvePreferredTeamId(
  overviews: TeamOverview[],
  preferredTeamId: string | null,
) {
  if (preferredTeamId && overviews.some((team) => team.team_id === preferredTeamId)) {
    return preferredTeamId;
  }

  const manageableTeam = overviews.find((team) => team.can_manage);
  return manageableTeam?.team_id ?? overviews[0]?.team_id ?? null;
}

function filterTeamMembers(members: TeamMember[], searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (!normalizedSearchText) {
    return members;
  }

  return members.filter((member) =>
    [member.name, member.email, mapUserStatus(member.status).label, `${member.client_count}`]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

function filterTeamClients(clients: TeamClient[], searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (!normalizedSearchText) {
    return clients;
  }

  return clients.filter((client) =>
    [
      client.name,
      client.email,
      client.referrer_name,
      mapUserStatus(client.status).label,
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
      mapUserStatus(candidate.status).label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

function getManagerCandidateLabel(candidate: TeamManagerCandidate) {
  const baseLabel = candidate.name ?? candidate.email ?? candidate.user_id;

  if (candidate.current_team_name) {
    return `${baseLabel}（当前负责：${candidate.current_team_name}${candidate.assignable ? "" : "，不可改派"}）`;
  }

  return `${baseLabel}${candidate.assignable ? "" : "（不可分配）"}`;
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

function getTeamManagementDescription(role: AppRole | null) {
  if (role === "manager") {
    return "经理可以管理自己的团队资料、成员和团队客户结构。面板会根据团队表、成员表与推荐关系自动汇总。";
  }

  if (role === "administrator") {
    return "管理员可以查看全部团队，并直接创建团队、删除团队、调整团队成员，以及更换团队经理。";
  }

  if (role === "salesman") {
    return "业务员可以查看当前可见团队结构，了解团队成员、客户沉淀和负责人的组织关系。";
  }

  if (role === "finance" || role === "operator") {
    return "当前页面会按数据库权限展示可见团队的结构概览，方便协同查看团队成员和客户沉淀。";
  }

  return "这里会把团队主表、成员表和客户推荐关系汇总成一个可直接查看的管理面板。";
}

function toTeamManagementErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("team profile does not exist")) {
    return "请先创建团队，再继续添加成员。";
  }

  if (baseMessage.includes("team name is required")) {
    return "请先填写团队名称。";
  }

  if (baseMessage.includes("team not found or not visible")) {
    return "当前选中的团队不可见，已经尝试重新同步。";
  }

  if (baseMessage.includes("current user cannot add this salesman to team")) {
    return "这个业务员当前不能加入团队，可能已经归属其他团队。";
  }

  if (baseMessage.includes("current user cannot assign this manager to team")) {
    return "这个经理当前不能分配到该团队，可能已经负责其他团队。";
  }

  if (baseMessage.includes("current user cannot manage team")) {
    return "当前账号暂时不能管理团队资料。";
  }

  if (baseMessage.includes("current user cannot manage team members")) {
    return "当前账号暂时不能调整团队成员。";
  }

  if (baseMessage.includes("current user cannot delete team")) {
    return "当前账号暂时不能删除团队。";
  }

  if (baseMessage.includes("team not found")) {
    return "目标团队不存在，可能已被其他人修改。";
  }

  return baseMessage;
}
