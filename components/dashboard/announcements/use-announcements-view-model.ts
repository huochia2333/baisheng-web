"use client";

import { useCallback, useMemo, useState } from "react";

import { markBrowserCloudSyncActivity } from "@/lib/browser-sync-recovery";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncementsPageData,
  publishAnnouncement,
  sortAnnouncements,
  takeAnnouncementOffline,
  updateAnnouncement,
  type AdminAnnouncementsPageData,
  type AnnouncementAudience,
  type AnnouncementRow,
  type AnnouncementStatus,
} from "@/lib/announcements";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import type { NoticeTone } from "../dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "../workspace-session-provider";
import {
  createAnnouncementFormFromRow,
  createEmptyAnnouncementForm,
  toAnnouncementErrorMessage,
  type AnnouncementFormState,
} from "./announcements-display";

type Feedback = { tone: NoticeTone; message: string } | null;
type AnnouncementAction = "delete" | "offline" | "publish";
type PendingAnnouncementAction = {
  id: string;
  type: AnnouncementAction;
} | null;

type UseAdminAnnouncementsViewModelOptions = {
  copy: {
    createSuccess: string;
    deleteConfirm: (title: string) => string;
    deleteSuccess: string;
    missingContent: string;
    missingTitle: string;
    notFoundError: string;
    offlineSuccess: string;
    permissionError: string;
    publishSuccess: string;
    unknownError: string;
    updateSuccess: string;
  };
  initialData: AdminAnnouncementsPageData;
};

export function useAdminAnnouncementsViewModel({
  copy,
  initialData,
}: UseAdminAnnouncementsViewModelOptions) {
  const supabase = getBrowserSupabaseClient();
  const [announcements, setAnnouncements] = useState(initialData.announcements);
  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [pageFeedback, setPageFeedback] = useState<Feedback>(null);
  const [dialogFeedback, setDialogFeedback] = useState<Feedback>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AnnouncementRow | null>(null);
  const [formState, setFormState] = useState<AnnouncementFormState>(() =>
    createEmptyAnnouncementForm(),
  );
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementAudience | "all">(
    "all",
  );
  const [submitPending, setSubmitPending] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<PendingAnnouncementAction>(null);

  const applyPageData = useCallback((pageData: AdminAnnouncementsPageData) => {
    setHasPermission(pageData.hasPermission);
    setAnnouncements(sortAnnouncements(pageData.announcements));
  }, []);

  const refreshAnnouncements = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const pageData = await getAdminAnnouncementsPageData(supabase);

        if (!isMounted()) {
          return;
        }

        applyPageData(pageData);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toAnnouncementErrorMessage(error, copy),
        });
      }
    },
    [applyPageData, copy, supabase],
  );

  useWorkspaceSyncEffect(refreshAnnouncements);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const statusMatches =
        statusFilter === "all" || announcement.status === statusFilter;
      const audienceMatches =
        audienceFilter === "all" || announcement.audience === audienceFilter;

      return statusMatches && audienceMatches;
    });
  }, [announcements, audienceFilter, statusFilter]);

  const openCreateDialog = useCallback(() => {
    setEditingAnnouncement(null);
    setFormState(createEmptyAnnouncementForm());
    setDialogFeedback(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((announcement: AnnouncementRow) => {
    setEditingAnnouncement(announcement);
    setFormState(createAnnouncementFormFromRow(announcement));
    setDialogFeedback(null);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setDialogFeedback(null);
    }
  }, []);

  const updateFormField = useCallback(
    <Key extends keyof AnnouncementFormState>(
      field: Key,
      value: AnnouncementFormState[Key],
    ) => {
      setFormState((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!supabase || submitPending) {
      return;
    }

    if (!formState.title.trim()) {
      setDialogFeedback({ tone: "error", message: copy.missingTitle });
      return;
    }

    if (!formState.content.trim()) {
      setDialogFeedback({ tone: "error", message: copy.missingContent });
      return;
    }

    setSubmitPending(true);
    setDialogFeedback(null);

    try {
      const savedAnnouncement = editingAnnouncement
        ? await updateAnnouncement(supabase, editingAnnouncement.id, formState)
        : await createAnnouncement(supabase, formState);

      markBrowserCloudSyncActivity();
      setAnnouncements((current) =>
        sortAnnouncements(
          editingAnnouncement
            ? current.map((item) =>
                item.id === savedAnnouncement.id ? savedAnnouncement : item,
              )
            : [savedAnnouncement, ...current],
        ),
      );
      setPageFeedback({
        tone: "success",
        message: editingAnnouncement ? copy.updateSuccess : copy.createSuccess,
      });
      setDialogOpen(false);
      setEditingAnnouncement(null);
      setFormState(createEmptyAnnouncementForm());
    } catch (error) {
      setDialogFeedback({
        tone: "error",
        message: toAnnouncementErrorMessage(error, copy),
      });
    } finally {
      setSubmitPending(false);
    }
  }, [
    copy,
    editingAnnouncement,
    formState,
    submitPending,
    supabase,
  ]);

  const handlePublish = useCallback(
    async (announcement: AnnouncementRow) => {
      if (!supabase || pendingAction) {
        return;
      }

      setPendingAction({ id: announcement.id, type: "publish" });
      setPageFeedback(null);

      try {
        const updatedAnnouncement = await publishAnnouncement(
          supabase,
          announcement.id,
        );

        markBrowserCloudSyncActivity();
        setAnnouncements((current) =>
          sortAnnouncements(
            current.map((item) =>
              item.id === updatedAnnouncement.id ? updatedAnnouncement : item,
            ),
          ),
        );
        setPageFeedback({ tone: "success", message: copy.publishSuccess });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toAnnouncementErrorMessage(error, copy),
        });
      } finally {
        setPendingAction(null);
      }
    },
    [copy, pendingAction, supabase],
  );

  const handleTakeOffline = useCallback(
    async (announcement: AnnouncementRow) => {
      if (!supabase || pendingAction) {
        return;
      }

      setPendingAction({ id: announcement.id, type: "offline" });
      setPageFeedback(null);

      try {
        const updatedAnnouncement = await takeAnnouncementOffline(
          supabase,
          announcement.id,
        );

        markBrowserCloudSyncActivity();
        setAnnouncements((current) =>
          sortAnnouncements(
            current.map((item) =>
              item.id === updatedAnnouncement.id ? updatedAnnouncement : item,
            ),
          ),
        );
        setPageFeedback({ tone: "success", message: copy.offlineSuccess });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toAnnouncementErrorMessage(error, copy),
        });
      } finally {
        setPendingAction(null);
      }
    },
    [copy, pendingAction, supabase],
  );

  const handleDelete = useCallback(
    async (announcement: AnnouncementRow) => {
      if (!supabase || pendingAction) {
        return;
      }

      if (!window.confirm(copy.deleteConfirm(announcement.title))) {
        return;
      }

      setPendingAction({ id: announcement.id, type: "delete" });
      setPageFeedback(null);

      try {
        await deleteAnnouncement(supabase, announcement.id);

        markBrowserCloudSyncActivity();
        setAnnouncements((current) =>
          current.filter((item) => item.id !== announcement.id),
        );
        setPageFeedback({ tone: "success", message: copy.deleteSuccess });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toAnnouncementErrorMessage(error, copy),
        });
      } finally {
        setPendingAction(null);
      }
    },
    [copy, pendingAction, supabase],
  );

  return {
    audienceFilter,
    dialogFeedback,
    dialogOpen,
    editingAnnouncement,
    filteredAnnouncements,
    formState,
    hasPermission,
    handleDelete,
    handleDialogOpenChange,
    handlePublish,
    handleSubmit,
    handleTakeOffline,
    openCreateDialog,
    openEditDialog,
    pageFeedback,
    pendingAction,
    setAudienceFilter,
    setStatusFilter,
    statusFilter,
    submitPending,
    updateFormField,
  };
}
