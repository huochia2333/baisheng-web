"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  getAdminReviewsPageData,
  type AdminReviewsPageData,
  approveMediaReview,
  approvePrivacyReview,
  rejectMediaReview,
  rejectPrivacyReview,
  type PendingMediaReviewWithPreview,
  type PendingPrivacyReviewRow,
} from "@/lib/admin-reviews";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  createDashboardSharedCopy,
  toErrorMessage,
  type NoticeTone,
} from "../dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "../workspace-session-provider";

import type { BusyAction, ReviewTab } from "./types";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function useAdminReviewsPage(initialData: AdminReviewsPageData) {
  const t = useTranslations("Reviews");
  const sharedT = useTranslations("DashboardShared");
  const sharedCopy = createDashboardSharedCopy(sharedT);
  const supabase = getBrowserSupabaseClient();

  const [activeTab, setActiveTab] = useState<ReviewTab>("privacy");
  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [privacyRows, setPrivacyRows] = useState<PendingPrivacyReviewRow[]>(initialData.privacyRows);
  const [mediaRows, setMediaRows] = useState<PendingMediaReviewWithPreview[]>(initialData.mediaRows);
  const [busyRows, setBusyRows] = useState<Record<string, BusyAction>>({});
  const [previewAsset, setPreviewAsset] = useState<PendingMediaReviewWithPreview | null>(null);

  const applyPageData = useCallback((pageData: AdminReviewsPageData) => {
    setHasPermission(pageData.hasPermission);
    setPrivacyRows(pageData.privacyRows);
    setMediaRows(pageData.mediaRows);
  }, []);

  useEffect(() => {
    applyPageData(initialData);
  }, [applyPageData, initialData]);

  const refreshReviewsPage = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getAdminReviewsPageData(supabase);

        if (!isMounted()) {
          return;
        }

        applyPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error, sharedCopy),
        });
      }
    },
    [applyPageData, sharedCopy, supabase],
  );

  useWorkspaceSyncEffect(refreshReviewsPage);

  const setRowBusyState = useCallback((rowKey: string, action: BusyAction | null) => {
    setBusyRows((current) => {
      if (!action) {
        const next = { ...current };
        delete next[rowKey];
        return next;
      }

      return {
        ...current,
        [rowKey]: action,
      };
    });
  }, []);

  const handlePrivacyReview = useCallback(
    async (row: PendingPrivacyReviewRow, action: BusyAction) => {
      if (!supabase) {
        return;
      }

      const rowKey = `privacy:${row.request_id}`;
      const actionLabel =
        action === "approve" ? t("actions.approve") : t("actions.reject");

      if (busyRows[rowKey]) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        !window.confirm(t("confirm.privacy", { action: actionLabel }))
      ) {
        return;
      }

      setRowBusyState(rowKey, action);
      setPageFeedback(null);

      try {
        if (action === "approve") {
          await approvePrivacyReview(supabase, row.request_id);
        } else {
          await rejectPrivacyReview(supabase, row.request_id);
        }

        setPrivacyRows((current) => current.filter((item) => item.request_id !== row.request_id));
        setPageFeedback({
          tone: "success",
          message:
            action === "approve"
              ? t("feedback.privacyApproved")
              : t("feedback.privacyRejected"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error, sharedCopy),
        });
      } finally {
        setRowBusyState(rowKey, null);
      }
    },
    [busyRows, setRowBusyState, sharedCopy, supabase, t],
  );

  const handleMediaReview = useCallback(
    async (row: PendingMediaReviewWithPreview, action: BusyAction) => {
      if (!supabase) {
        return;
      }

      const rowKey = `media:${row.asset_id}`;
      const actionLabel =
        action === "approve" ? t("actions.approve") : t("actions.reject");

      if (busyRows[rowKey]) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        !window.confirm(t("confirm.media", { action: actionLabel }))
      ) {
        return;
      }

      setRowBusyState(rowKey, action);
      setPageFeedback(null);

      try {
        if (action === "approve") {
          await approveMediaReview(supabase, row.asset_id);
        } else {
          await rejectMediaReview(supabase, row.asset_id);
        }

        setMediaRows((current) => current.filter((item) => item.asset_id !== row.asset_id));
        setPageFeedback({
          tone: "success",
          message:
            action === "approve"
              ? t("feedback.mediaApproved")
              : t("feedback.mediaRejected"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error, sharedCopy),
        });
      } finally {
        setRowBusyState(rowKey, null);
      }
    },
    [busyRows, setRowBusyState, sharedCopy, supabase, t],
  );

  const closePreviewDialog = useCallback((open: boolean) => {
    if (open) {
      return;
    }

    setPreviewAsset(null);
  }, []);

  const reviewTabs = useMemo(
    () => [
      {
        key: "privacy" as const,
        label: t("tabs.privacy"),
        count: privacyRows.length,
      },
      {
        key: "media" as const,
        label: t("tabs.media"),
        count: mediaRows.length,
      },
    ],
    [mediaRows.length, privacyRows.length, t],
  );

  return {
    activeTab,
    busyRows,
    closePreviewDialog,
    handleMediaReview,
    handlePrivacyReview,
    hasPermission,
    mediaRows,
    pageFeedback,
    previewAsset,
    privacyRows,
    reviewTabs,
    setActiveTab,
    setPreviewAsset,
    supabase,
  };
}
