"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import {
  deleteAdminTask,
  type AdminTaskRow,
} from "@/lib/admin-tasks";
import { type getBrowserSupabaseClient } from "@/lib/supabase";

import { toAdminTaskErrorMessage } from "@/components/dashboard/tasks/tasks-display";

import { type PageFeedbackValue } from "./admin-tasks-view-model-shared";

export function useAdminTaskDeleteAction({
  onPageFeedback,
  refreshTaskBoard,
  supabase,
}: {
  onPageFeedback: (feedback: PageFeedbackValue) => void;
  refreshTaskBoard: () => void;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const [deletePendingTaskId, setDeletePendingTaskId] = useState<string | null>(null);

  const handleDeleteTask = useCallback(
    async (task: AdminTaskRow) => {
      if (!supabase || deletePendingTaskId) {
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(t("confirmDelete", { taskName: task.task_name }));

        if (!confirmed) {
          return;
        }
      }

      setDeletePendingTaskId(task.id);

      try {
        const result = await deleteAdminTask(supabase, task);
        onPageFeedback({
          tone: result.attachmentCleanupFailed ? "info" : "success",
          message: result.attachmentCleanupFailed
            ? t("feedback.deletedWithAttachmentCleanupWarning")
            : t("feedback.deleted"),
        });
        refreshTaskBoard();
      } catch (error) {
        onPageFeedback({
          tone: "error",
          message: toAdminTaskErrorMessage(error, sharedT),
        });
      } finally {
        setDeletePendingTaskId(null);
      }
    },
    [deletePendingTaskId, onPageFeedback, refreshTaskBoard, sharedT, supabase, t],
  );

  return {
    deletePendingTaskId,
    handleDeleteTask,
  };
}
