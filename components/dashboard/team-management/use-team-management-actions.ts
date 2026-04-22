"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";

import { useTranslations } from "next-intl";

import {
  addTeamSalesman,
  deleteTeamProfile,
  getTeamManagementPageData,
  removeTeamSalesman,
  saveTeamProfile,
  type TeamManagementPageData,
} from "@/lib/team-management";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { toTeamManagementErrorMessage } from "./team-management-display";
import {
  type PageFeedback,
  type TeamManagementDataState,
} from "./team-management-view-model-shared";

export function useTeamManagementActions({
  applyTeamManagementPageData,
  currentData,
  setBusyKey,
  setPageFeedback,
  supabase,
}: {
  applyTeamManagementPageData: (pageData: TeamManagementPageData) => void;
  currentData: TeamManagementDataState;
  setBusyKey: Dispatch<SetStateAction<string | null>>;
  setPageFeedback: Dispatch<SetStateAction<PageFeedback>>;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
}) {
  const t = useTranslations("TeamManagement");

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
      if (!supabase) {
        return;
      }

      const nextPageData = await getTeamManagementPageData(
        supabase,
        preferredTeamId ?? currentData.selectedTeamId,
      );

      applyTeamManagementPageData(nextPageData);
      setPageFeedback(null);
    },
    [applyTeamManagementPageData, currentData.selectedTeamId, supabase, setPageFeedback],
  );

  const refreshTeamManagementPage = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getTeamManagementPageData(
          supabase,
          currentData.selectedTeamId,
        );

        if (!isMounted()) {
          return;
        }

        applyTeamManagementPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toTeamManagementErrorMessage(error, t),
        });
      }
    },
    [applyTeamManagementPageData, currentData.selectedTeamId, supabase, t, setPageFeedback],
  );

  const handleSaveTeam = useCallback(async () => {
    if (!supabase || !currentData.teamNameDraft.trim()) {
      return;
    }

    setBusyKey("save-team");

    try {
      const teamId = await saveTeamProfile(supabase, {
        teamId: currentData.detail.team?.team_id ?? null,
        teamName: currentData.teamNameDraft,
        managerUserId:
          currentData.viewerRole === "administrator"
            ? currentData.managerUserIdDraft || null
            : undefined,
      });
      await refreshAuthClaims();
      await refreshQuietly(teamId);
      setPageFeedback({
        tone: "success",
        message: currentData.detail.team
          ? t("feedback.updated")
          : t("feedback.createdAndContinue"),
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
    currentData.detail.team,
    currentData.managerUserIdDraft,
    currentData.teamNameDraft,
    currentData.viewerRole,
    refreshAuthClaims,
    refreshQuietly,
    setBusyKey,
    setPageFeedback,
    supabase,
    t,
  ]);

  const handleCreateTeam = useCallback(async () => {
    if (
      !supabase ||
      currentData.viewerRole !== "administrator" ||
      !currentData.createTeamNameDraft.trim()
    ) {
      return;
    }

    setBusyKey("create-team");

    try {
      const teamId = await saveTeamProfile(supabase, {
        teamName: currentData.createTeamNameDraft,
        managerUserId: currentData.createManagerUserIdDraft || null,
      });
      await refreshAuthClaims();
      await refreshQuietly(teamId);
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
    currentData.createManagerUserIdDraft,
    currentData.createTeamNameDraft,
    currentData.viewerRole,
    refreshAuthClaims,
    refreshQuietly,
    setBusyKey,
    setPageFeedback,
    supabase,
    t,
  ]);

  const handleAddSalesman = useCallback(
    async (salesmanUserId: string) => {
      if (!supabase || !currentData.detail.team?.team_id) {
        return;
      }

      setBusyKey(`add:${salesmanUserId}`);

      try {
        const teamId = await addTeamSalesman(supabase, {
          salesmanUserId,
          teamId: currentData.detail.team.team_id,
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
    [
      currentData.detail.team?.team_id,
      refreshAuthClaims,
      refreshQuietly,
      setBusyKey,
      setPageFeedback,
      supabase,
      t,
    ],
  );

  const handleRemoveSalesman = useCallback(
    async (salesmanUserId: string) => {
      if (!supabase || !currentData.detail.team?.team_id) {
        return;
      }

      setBusyKey(`remove:${salesmanUserId}`);

      try {
        const teamId = await removeTeamSalesman(supabase, {
          salesmanUserId,
          teamId: currentData.detail.team.team_id,
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
    [
      currentData.detail.team?.team_id,
      refreshAuthClaims,
      refreshQuietly,
      setBusyKey,
      setPageFeedback,
      supabase,
      t,
    ],
  );

  const handleDeleteTeam = useCallback(async () => {
    if (
      !supabase ||
      currentData.viewerRole !== "administrator" ||
      !currentData.detail.team?.team_id
    ) {
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        t("confirmDelete", {
          teamName:
            currentData.detail.team.team_name?.trim() ||
            t("shared.fallback.unnamedTeam"),
        }),
      );

      if (!confirmed) {
        return;
      }
    }

    setBusyKey("delete-team");

    try {
      await deleteTeamProfile(supabase, currentData.detail.team.team_id);
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
  }, [
    currentData.detail.team,
    currentData.viewerRole,
    refreshQuietly,
    setBusyKey,
    setPageFeedback,
    supabase,
    t,
  ]);

  const handleSelectTeam = useCallback(
    async (teamId: string) => {
      if (teamId === currentData.selectedTeamId) {
        return;
      }

      setBusyKey(`team:${teamId}`);

      try {
        await refreshQuietly(teamId);
      } finally {
        setBusyKey(null);
      }
    },
    [currentData.selectedTeamId, refreshQuietly, setBusyKey],
  );

  const handleRefresh = useCallback(async () => {
    setBusyKey("refresh");

    try {
      await refreshQuietly(currentData.selectedTeamId);
    } finally {
      setBusyKey(null);
    }
  }, [currentData.selectedTeamId, refreshQuietly, setBusyKey]);

  return {
    handleAddSalesman,
    handleCreateTeam,
    handleDeleteTeam,
    handleRefresh,
    handleRemoveSalesman,
    handleSaveTeam,
    handleSelectTeam,
    refreshTeamManagementPage,
  };
}
