"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  getWorkspaceAnnouncementsState,
  markWorkspaceAnnouncementsRead,
  type WorkspaceAnnouncementsState,
} from "@/lib/workspace-announcements";

type DialogMode = "auto" | "manual";

type WorkspaceHeaderAnnouncementsCopy = {
  loadError: string;
  readError: string;
};

type UseWorkspaceHeaderAnnouncementsOptions = {
  copy: WorkspaceHeaderAnnouncementsCopy;
  initialState: WorkspaceAnnouncementsState;
};

export function useWorkspaceHeaderAnnouncements({
  copy,
  initialState,
}: UseWorkspaceHeaderAnnouncementsOptions) {
  const supabase = getBrowserSupabaseClient();
  const initialHasUnreadAnnouncements = initialState.unreadAnnouncements.length > 0;
  const autoOpenedRef = useRef(initialHasUnreadAnnouncements);

  const [announcementsState, setAnnouncementsState] =
    useState<WorkspaceAnnouncementsState>(initialState);
  const [dialogMode, setDialogMode] = useState<DialogMode>(
    initialHasUnreadAnnouncements ? "auto" : "manual",
  );
  const [dialogOpen, setDialogOpen] = useState(initialHasUnreadAnnouncements);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const applyAnnouncementsState = useCallback(
    (nextState: WorkspaceAnnouncementsState) => {
      setAnnouncementsState(nextState);

      if (!autoOpenedRef.current && nextState.unreadAnnouncements.length > 0) {
        autoOpenedRef.current = true;
        setDialogMode("auto");
        setDialogOpen(true);
      }
    },
    [],
  );

  useEffect(() => {
    applyAnnouncementsState(initialState);
  }, [applyAnnouncementsState, initialState]);

  const refreshAnnouncements = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextState = await getWorkspaceAnnouncementsState(supabase);

      applyAnnouncementsState(nextState);
    } catch {
      setErrorMessage(copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [applyAnnouncementsState, copy.loadError, supabase]);

  const markUnreadAsRead = useCallback(async () => {
    if (!supabase || announcementsState.unreadAnnouncements.length === 0) {
      return;
    }

    setMarkingRead(true);

    try {
      await markWorkspaceAnnouncementsRead(
        supabase,
        announcementsState.unreadAnnouncements,
      );
      setAnnouncementsState((current) => ({
        ...current,
        unreadAnnouncements: [],
      }));
      setErrorMessage(null);
    } catch {
      setErrorMessage(copy.readError);
    } finally {
      setMarkingRead(false);
    }
  }, [announcementsState.unreadAnnouncements, copy.readError, supabase]);

  const closeDialog = useCallback(
    (open: boolean) => {
      if (open) {
        setDialogOpen(true);
        return;
      }

      setDialogOpen(false);

      if (announcementsState.unreadAnnouncements.length > 0) {
        void markUnreadAsRead();
      }
    },
    [announcementsState.unreadAnnouncements.length, markUnreadAsRead],
  );

  const openRecentAnnouncements = useCallback(() => {
    setDialogMode("manual");
    setDialogOpen(true);

    if (!loading) {
      void refreshAnnouncements();
    }
  }, [loading, refreshAnnouncements]);

  const acknowledgeAnnouncements = useCallback(async () => {
    await markUnreadAsRead();
    setDialogOpen(false);
  }, [markUnreadAsRead]);

  const displayedAnnouncements = useMemo(() => {
    if (
      dialogMode === "auto" &&
      announcementsState.unreadAnnouncements.length > 0
    ) {
      return announcementsState.unreadAnnouncements;
    }

    return announcementsState.announcements;
  }, [
    announcementsState.announcements,
    announcementsState.unreadAnnouncements,
    dialogMode,
  ]);

  return {
    acknowledgeAnnouncements,
    closeDialog,
    dialogMode,
    dialogOpen,
    displayedAnnouncements,
    errorMessage,
    loading,
    markingRead,
    openRecentAnnouncements,
    unreadCount: announcementsState.unreadAnnouncements.length,
  };
}
