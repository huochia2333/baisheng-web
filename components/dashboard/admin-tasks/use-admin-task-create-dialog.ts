"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import {
  createAdminTask,
  deleteAdminTask,
  uploadAdminTaskAttachments,
  validateAdminTaskAttachments,
  type TaskScope,
} from "@/lib/admin-tasks";
import { type getBrowserSupabaseClient } from "@/lib/supabase";

import {
  toAdminTaskErrorMessage,
  validateTaskDraft,
} from "@/components/dashboard/tasks/tasks-display";

import {
  createEmptyTaskForm,
  type CreateTaskFormState,
} from "./admin-tasks-utils";
import { type PageFeedbackValue } from "./admin-tasks-view-model-shared";

export function useAdminTaskCreateDialog({
  canView,
  onPageFeedback,
  refreshTaskBoard,
  supabase,
  viewerId,
}: {
  canView: boolean;
  onPageFeedback: (feedback: PageFeedbackValue) => void;
  refreshTaskBoard: () => void;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  viewerId: string | null;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] = useState<PageFeedbackValue | null>(
    null,
  );
  const [createPending, setCreatePending] = useState(false);
  const [createFormState, setCreateFormState] = useState<CreateTaskFormState>(
    createEmptyTaskForm,
  );

  const handleCreateDialogOpenChange = useCallback((open: boolean) => {
    setCreateDialogOpen(open);

    if (!open) {
      setCreateDialogFeedback(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setCreateDialogFeedback(null);
    setCreateFormState(createEmptyTaskForm());
    setCreateDialogOpen(true);
  }, []);

  const updateCreateField = useCallback(
    <Key extends keyof CreateTaskFormState>(
      key: Key,
      value: CreateTaskFormState[Key],
    ) => {
      setCreateFormState((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const handleCreateScopeChange = useCallback((scope: TaskScope) => {
    setCreateFormState((current) => ({
      ...current,
      scope,
      teamId: scope === "team" ? current.teamId : "",
    }));
  }, []);

  const handleCreateFilesChange = useCallback((files: File[]) => {
    setCreateFormState((current) => ({
      ...current,
      files,
    }));
  }, []);

  const removeCreateFile = useCallback((index: number) => {
    setCreateFormState((current) => ({
      ...current,
      files: current.files.filter((_, fileIndex) => fileIndex !== index),
    }));
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!supabase || !viewerId || !canView || createPending) {
      return;
    }

    const validationMessage = validateTaskDraft(createFormState, t);

    if (validationMessage) {
      setCreateDialogFeedback({
        tone: "error",
        message: validationMessage,
      });
      return;
    }

    try {
      validateAdminTaskAttachments(createFormState.files);
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);

    try {
      const createdTask = await createAdminTask(supabase, {
        taskName: createFormState.taskName,
        taskIntro: createFormState.taskIntro,
        createdByUserId: viewerId,
        scope: createFormState.scope,
        teamId: createFormState.scope === "team" ? createFormState.teamId : null,
      });

      if (createFormState.files.length > 0) {
        try {
          await uploadAdminTaskAttachments(supabase, {
            taskId: createdTask.id,
            uploadedByUserId: viewerId,
            files: createFormState.files,
          });
        } catch (error) {
          try {
            await deleteAdminTask(supabase, {
              id: createdTask.id,
              attachments: [],
            });
          } catch {
            // Ignore rollback cleanup failure here; surface the original upload error first.
          }

          throw error;
        }
      }

      setCreateDialogOpen(false);
      setCreateFormState(createEmptyTaskForm());
      onPageFeedback({
        tone: "success",
        message:
          createFormState.files.length > 0
            ? t("feedback.createdWithAttachments")
            : t("feedback.created"),
      });
      refreshTaskBoard();
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
    } finally {
      setCreatePending(false);
    }
  }, [canView, createFormState, createPending, onPageFeedback, refreshTaskBoard, sharedT, supabase, t, viewerId]);

  return {
    createDialogFeedback,
    createDialogOpen,
    createFormState,
    createPending,
    handleCreateDialogOpenChange,
    handleCreateFilesChange,
    handleCreateScopeChange,
    handleCreateTask,
    openCreateDialog,
    removeCreateFile,
    updateCreateField,
  };
}
