"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
  approveMediaReview,
  approvePrivacyReview,
  getCurrentReviewerContext,
  getPendingMediaReviews,
  getPendingPrivacyReviews,
  rejectMediaReview,
  rejectPrivacyReview,
  type PendingMediaReviewWithPreview,
  type PendingPrivacyReviewRow,
} from "@/lib/admin-reviews";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import { useResumeRecovery } from "@/lib/use-resume-recovery";

import { toErrorMessage, type NoticeTone } from "../dashboard-shared-ui";

import type { BusyAction, ReviewTab } from "./types";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function useAdminReviewsPage() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [activeTab, setActiveTab] = useState<ReviewTab>("privacy");
  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [privacyRows, setPrivacyRows] = useState<PendingPrivacyReviewRow[]>([]);
  const [mediaRows, setMediaRows] = useState<PendingMediaReviewWithPreview[]>([]);
  const [busyRows, setBusyRows] = useState<Record<string, BusyAction>>({});
  const [previewAsset, setPreviewAsset] = useState<PendingMediaReviewWithPreview | null>(null);
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadPage = useCallback(
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

        const reviewer = await getCurrentReviewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!reviewer) {
          router.replace("/login");
          return;
        }

        const isAdmin = reviewer.role === "administrator";
        setHasPermission(isAdmin);

        if (!isAdmin) {
          setPrivacyRows([]);
          setMediaRows([]);
          setPageFeedback(null);
          return;
        }

        const [nextPrivacyRows, nextMediaRows] = await Promise.all([
          getPendingPrivacyReviews(supabase),
          getPendingMediaReviews(supabase),
        ]);

        if (!isMounted()) {
          return;
        }

        setPrivacyRows(nextPrivacyRows);
        setMediaRows(nextMediaRows);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error),
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
      loadPage({
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

      await loadPage({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

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
      const actionLabel = action === "approve" ? "通过" : "拒绝";

      if (busyRows[rowKey]) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        !window.confirm(`确定要${actionLabel}这条个人隐私资料审核吗？`)
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
          message: action === "approve" ? "个人隐私资料已审核通过。" : "个人隐私资料已拒绝。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error),
        });
      } finally {
        setRowBusyState(rowKey, null);
      }
    },
    [busyRows, setRowBusyState, supabase],
  );

  const handleMediaReview = useCallback(
    async (row: PendingMediaReviewWithPreview, action: BusyAction) => {
      if (!supabase) {
        return;
      }

      const rowKey = `media:${row.asset_id}`;
      const actionLabel = action === "approve" ? "通过" : "拒绝";

      if (busyRows[rowKey]) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        !window.confirm(`确定要${actionLabel}这条个人媒体审核吗？`)
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
          message: action === "approve" ? "个人媒体已审核通过。" : "个人媒体已拒绝。",
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error),
        });
      } finally {
        setRowBusyState(rowKey, null);
      }
    },
    [busyRows, setRowBusyState, supabase],
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
        label: "隐私审核",
        count: privacyRows.length,
      },
      {
        key: "media" as const,
        label: "媒体审核",
        count: mediaRows.length,
      },
    ],
    [mediaRows.length, privacyRows.length],
  );

  return {
    activeTab,
    busyRows,
    closePreviewDialog,
    handleMediaReview,
    handlePrivacyReview,
    hasPermission,
    loading,
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
