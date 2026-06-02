"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  getAdminTaskMediaLibraryKind,
} from "@/lib/admin-task-media-library";
import {
  getAdminTaskReviewBoardData,
  type AdminTaskReviewBoardData,
} from "@/lib/admin-task-reviews";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  approveTaskReview,
  downloadTaskReviewSubmissionAssetBlob,
  getTaskReviewSubmissionAssetSignedUrl,
  rejectTaskReview,
  type PendingTaskReviewWithAssets,
  type TaskReviewSubmissionAsset,
} from "@/lib/task-reviews";

import {
  createDashboardSharedCopy,
  getRawErrorMessage,
  toErrorMessage,
} from "../dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "../workspace-session-provider";
import type {
  AdminTaskFilePreviewItem,
} from "./admin-task-file-preview-dialog";
import type { PageFeedback } from "./admin-tasks-view-model-shared";
import type { AdminTaskReviewAction } from "./admin-task-review-types";

type PreviewTaskReviewAsset = AdminTaskFilePreviewItem & {
  asset: TaskReviewSubmissionAsset;
  submissionId: string;
};

export function useAdminTaskReviewBoard(initialData: AdminTaskReviewBoardData) {
  const t = useTranslations("Tasks.admin");
  const reviewsT = useTranslations("ReviewsUI");
  const sharedT = useTranslations("DashboardShared");
  const sharedCopy = useMemo(() => createDashboardSharedCopy(sharedT), [sharedT]);
  const supabase = getBrowserSupabaseClient();

  const [canView, setCanView] = useState(initialData.canView);
  const [rows, setRows] = useState<PendingTaskReviewWithAssets[]>(initialData.rows);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [busyRows, setBusyRows] = useState<Record<string, AdminTaskReviewAction>>({});
  const [assetBusyKey, setAssetBusyKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<PreviewTaskReviewAsset | null>(null);
  const [previewDownloadBusy, setPreviewDownloadBusy] = useState(false);

  const applyPageData = useCallback((pageData: AdminTaskReviewBoardData) => {
    setCanView(pageData.canView);
    setRows(pageData.rows);
  }, []);

  useEffect(() => {
    applyPageData(initialData);
  }, [applyPageData, initialData]);

  const refreshReviewBoard = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getAdminTaskReviewBoardData(supabase);

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

  useWorkspaceSyncEffect(refreshReviewBoard);

  const handleRefresh = useCallback(() => {
    if (!supabase || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    void refreshReviewBoard({ isMounted: () => true }).finally(() => {
      setIsRefreshing(false);
    });
  }, [isRefreshing, refreshReviewBoard, supabase]);

  const setRowBusyState = useCallback(
    (rowKey: string, action: AdminTaskReviewAction | null) => {
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
    },
    [],
  );

  const handleTaskReview = useCallback(
    async (row: PendingTaskReviewWithAssets, action: AdminTaskReviewAction) => {
      if (!supabase) {
        return;
      }

      const rowKey = `task:${row.acceptance_id}`;
      const actionLabel =
        action === "approve" ? reviewsT("actions.approve") : reviewsT("actions.reject");

      if (busyRows[rowKey]) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        !window.confirm(t("reviewBoard.confirm", { action: actionLabel }))
      ) {
        return;
      }

      let rejectReason: string | null = null;

      if (action === "reject" && typeof window !== "undefined") {
        const input = window.prompt(t("reviewBoard.rejectReasonPrompt"), "");

        if (input === null) {
          return;
        }

        rejectReason = input;
      }

      setRowBusyState(rowKey, action);
      setPageFeedback(null);

      try {
        if (action === "approve") {
          await approveTaskReview(supabase, row.acceptance_id);
        } else {
          await rejectTaskReview(supabase, {
            acceptanceId: row.acceptance_id,
            reason: rejectReason,
          });
        }

        setRows((current) =>
          current.filter((item) => item.acceptance_id !== row.acceptance_id),
        );
        setPageFeedback({
          tone: "success",
          message:
            action === "approve"
              ? t("reviewBoard.feedback.approved")
              : t("reviewBoard.feedback.rejected"),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toAdminTaskReviewErrorMessage(error, t, sharedCopy),
        });
      } finally {
        setRowBusyState(rowKey, null);
      }
    },
    [busyRows, reviewsT, setRowBusyState, sharedCopy, supabase, t],
  );

  const handleOpenAsset = useCallback(
    async (row: PendingTaskReviewWithAssets, asset: TaskReviewSubmissionAsset) => {
      if (!supabase) {
        return;
      }

      const nextBusyKey = `${row.submission_id}:${asset.id}`;

      if (assetBusyKey === nextBusyKey) {
        return;
      }

      setAssetBusyKey(nextBusyKey);
      setPageFeedback(null);

      try {
        const signedUrl = await getTaskReviewSubmissionAssetSignedUrl(supabase, asset);

        setPreviewAsset({
          asset,
          file_size_bytes: asset.file_size_bytes,
          id: asset.id,
          kind: getAdminTaskMediaLibraryKind(asset.mime_type, asset.original_name),
          mime_type: asset.mime_type,
          original_name: asset.original_name,
          signedUrl,
          submitted_at: row.submitted_at,
          submitted_by_name: row.accepted_by_name ?? row.accepted_by_email,
          submission_round: row.submission_round,
          submissionId: row.submission_id,
          task_name: row.task_name,
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error, sharedCopy),
        });
      } finally {
        setAssetBusyKey((current) => (current === nextBusyKey ? null : current));
      }
    },
    [assetBusyKey, sharedCopy, supabase],
  );

  const handlePreviewDownload = useCallback(
    async (file: AdminTaskFilePreviewItem) => {
      const currentAsset = previewAsset && previewAsset.id === file.id ? previewAsset : null;

      if (!supabase || !currentAsset || previewDownloadBusy) {
        return;
      }

      setPreviewDownloadBusy(true);
      setPageFeedback(null);

      try {
        const blob = await downloadTaskReviewSubmissionAssetBlob(
          supabase,
          currentAsset.asset,
        );
        downloadBlob(blob, currentAsset.original_name);
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error, sharedCopy),
        });
      } finally {
        setPreviewDownloadBusy(false);
      }
    },
    [previewAsset, previewDownloadBusy, sharedCopy, supabase],
  );

  const closePreview = useCallback((open: boolean) => {
    if (!open) {
      setPreviewAsset(null);
      setPreviewDownloadBusy(false);
    }
  }, []);

  return {
    assetBusyKey,
    busyRows,
    canView,
    closePreview,
    handleOpenAsset,
    handlePreviewDownload,
    handleRefresh,
    handleTaskReview,
    isRefreshing,
    pageFeedback,
    previewAsset,
    previewDownloadBusy,
    rows,
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
}

function toAdminTaskReviewErrorMessage(
  error: unknown,
  t: ReturnType<typeof useTranslations>,
  sharedCopy: ReturnType<typeof createDashboardSharedCopy>,
) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error, sharedCopy);

  if (rawMessage.includes("only administrator can approve task review")) {
    return t("reviewBoard.errors.noPermission");
  }

  if (rawMessage.includes("only administrator can reject task review")) {
    return t("reviewBoard.errors.noPermission");
  }

  if (rawMessage.includes("task is not in reviewing status")) {
    return t("reviewBoard.errors.notReviewing");
  }

  if (rawMessage.includes("task review submission not found")) {
    return t("reviewBoard.errors.submissionMissing");
  }

  if (rawMessage.includes("task current submission is missing")) {
    return t("reviewBoard.errors.submissionMissing");
  }

  if (rawMessage.includes("task review submission is not pending")) {
    return t("reviewBoard.errors.submissionMissing");
  }

  if (rawMessage.includes("task not found")) {
    return t("reviewBoard.errors.taskMissing");
  }

  return baseMessage;
}
