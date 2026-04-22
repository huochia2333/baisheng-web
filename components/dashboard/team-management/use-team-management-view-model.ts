"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  canViewTeamPanel,
  type TeamManagementPageData,
} from "@/lib/team-management";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

import {
  filterTeamCandidates,
  filterTeamClients,
  filterTeamMembers,
} from "./team-management-utils";
import {
  createTeamManagementDataState,
  getTeamManagementDataKey,
  type PageFeedback,
  type TeamManagementDataState,
} from "./team-management-view-model-shared";
import { useTeamManagementActions } from "./use-team-management-actions";

export function useTeamManagementViewModel({
  initialData,
}: {
  initialData: TeamManagementPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const { locale } = useLocale();

  const initialDataKey = useMemo(
    () => getTeamManagementDataKey(initialData),
    [initialData],
  );
  const [dataState, setDataState] = useState<TeamManagementDataState>(() =>
    createTeamManagementDataState(initialData),
  );
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [memberSearchText, setMemberSearchText] = useState("");
  const [clientSearchText, setClientSearchText] = useState("");
  const [candidateSearchText, setCandidateSearchText] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const currentData =
    dataState.dataKey === initialDataKey
      ? dataState
      : createTeamManagementDataState(initialData);

  const updateDataState = useCallback(
    (updater: (current: TeamManagementDataState) => TeamManagementDataState) => {
      setDataState((current) => {
        const resolvedCurrent =
          current.dataKey === initialDataKey
            ? current
            : createTeamManagementDataState(initialData);

        return updater(resolvedCurrent);
      });
    },
    [initialData, initialDataKey],
  );

  const applyTeamManagementPageData = useCallback((pageData: TeamManagementPageData) => {
    setDataState(createTeamManagementDataState(pageData));
  }, []);

  const actions = useTeamManagementActions({
    applyTeamManagementPageData,
    currentData,
    setBusyKey,
    setPageFeedback,
    supabase,
  });

  useWorkspaceSyncEffect(actions.refreshTeamManagementPage);

  const canView = canViewTeamPanel(currentData.viewerRole, currentData.viewerStatus);
  const canManageSelectedTeam = currentData.detail.team?.can_manage === true;

  const aggregateStats = useMemo(
    () => ({
      manageableTeams: currentData.overviews.filter((team) => team.can_manage).length,
      teamCount: currentData.overviews.length,
      totalClients: currentData.overviews.reduce((sum, team) => sum + team.client_count, 0),
      totalMembers: currentData.overviews.reduce((sum, team) => sum + team.member_count, 0),
    }),
    [currentData.overviews],
  );

  const filteredMembers = useMemo(
    () => filterTeamMembers(currentData.detail.members, memberSearchText, locale),
    [currentData.detail.members, locale, memberSearchText],
  );
  const filteredClients = useMemo(
    () => filterTeamClients(currentData.detail.clients, clientSearchText, locale),
    [clientSearchText, currentData.detail.clients, locale],
  );
  const filteredCandidates = useMemo(
    () =>
      filterTeamCandidates(
        currentData.candidateSalesmen,
        candidateSearchText,
        locale,
      ),
    [candidateSearchText, currentData.candidateSalesmen, locale],
  );
  const availableCandidateCount = useMemo(
    () =>
      currentData.candidateSalesmen.filter((candidate) => candidate.assignable).length,
    [currentData.candidateSalesmen],
  );

  const updateTeamNameDraft = useCallback(
    (value: string) => {
      updateDataState((current) => ({
        ...current,
        teamNameDraft: value,
      }));
    },
    [updateDataState],
  );

  const updateManagerUserIdDraft = useCallback(
    (value: string) => {
      updateDataState((current) => ({
        ...current,
        managerUserIdDraft: value,
      }));
    },
    [updateDataState],
  );

  const updateCreateTeamNameDraft = useCallback(
    (value: string) => {
      updateDataState((current) => ({
        ...current,
        createTeamNameDraft: value,
      }));
    },
    [updateDataState],
  );

  const updateCreateManagerUserIdDraft = useCallback(
    (value: string) => {
      updateDataState((current) => ({
        ...current,
        createManagerUserIdDraft: value,
      }));
    },
    [updateDataState],
  );

  return {
    aggregateStats,
    availableCandidateCount,
    busyKey,
    canManageSelectedTeam,
    canView,
    candidateSalesmen: currentData.candidateSalesmen,
    candidateSearchText,
    clientSearchText,
    createManagerCandidates: currentData.createManagerCandidates,
    createManagerUserIdDraft: currentData.createManagerUserIdDraft,
    createTeamNameDraft: currentData.createTeamNameDraft,
    detail: currentData.detail,
    filteredCandidates,
    filteredClients,
    filteredMembers,
    handleAddSalesman: actions.handleAddSalesman,
    handleCreateTeam: actions.handleCreateTeam,
    handleDeleteTeam: actions.handleDeleteTeam,
    handleRefresh: actions.handleRefresh,
    handleRemoveSalesman: actions.handleRemoveSalesman,
    handleSaveTeam: actions.handleSaveTeam,
    handleSelectTeam: actions.handleSelectTeam,
    managerCandidates: currentData.managerCandidates,
    managerUserIdDraft: currentData.managerUserIdDraft,
    memberSearchText,
    overviews: currentData.overviews,
    pageFeedback,
    selectedTeamId: currentData.selectedTeamId,
    setCandidateSearchText,
    setClientSearchText,
    setMemberSearchText,
    teamNameDraft: currentData.teamNameDraft,
    updateCreateManagerUserIdDraft,
    updateCreateTeamNameDraft,
    updateManagerUserIdDraft,
    updateTeamNameDraft,
    viewerRole: currentData.viewerRole,
    viewerStatus: currentData.viewerStatus,
  };
}
