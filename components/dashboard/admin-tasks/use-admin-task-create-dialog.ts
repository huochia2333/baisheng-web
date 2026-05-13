"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import {
  createAdminTask,
  deleteAdminTask,
  type TaskTypeOption,
  uploadAdminTaskAttachments,
  validateAdminTaskAttachments,
  type TaskTargetRole,
} from "@/lib/admin-tasks";
import { type getBrowserSupabaseClient } from "@/lib/supabase";

import {
  parseTaskAcceptanceLimitInput,
  parseTaskCommissionAmountInput,
  toAdminTaskErrorMessage,
  validateTaskDraft,
} from "@/components/dashboard/tasks/tasks-display";

import {
  createEmptyTaskForm,
  formatOptionalTaskCommissionInput,
  type CreateTaskFormState,
} from "./admin-tasks-utils";
import { type PageFeedbackValue } from "./admin-tasks-view-model-shared";

export function useAdminTaskCreateDialog({
  canView,
  onPageFeedback,
  refreshTaskBoard,
  supabase,
  taskTypeOptions,
  viewerId,
}: {
  canView: boolean;
  onPageFeedback: (feedback: PageFeedbackValue) => void;
  refreshTaskBoard: () => void;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  taskTypeOptions: TaskTypeOption[];
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
    () => createEmptyTaskForm(taskTypeOptions),
  );

  const handleCreateDialogOpenChange = useCallback((open: boolean) => {
    setCreateDialogOpen(open);

    if (!open) {
      setCreateDialogFeedback(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setCreateDialogFeedback(null);
    setCreateFormState(createEmptyTaskForm(taskTypeOptions));
    setCreateDialogOpen(true);
  }, [taskTypeOptions]);

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

  const handleCreateTargetRoleToggle = useCallback((role: TaskTargetRole) => {
    setCreateFormState((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((targetRole) => targetRole !== role)
        : [...current.targetRoles, role],
    }));
  }, []);

  const handleCreateTaskTypeChange = useCallback(
    (taskTypeCode: string) => {
      setCreateFormState((current) => {
        const currentType = taskTypeOptions.find(
          (taskType) => taskType.code === current.taskTypeCode,
        );
        const nextType =
          taskTypeOptions.find((taskType) => taskType.code === taskTypeCode) ?? null;
        const currentDefault =
          currentType !== undefined
            ? formatOptionalTaskCommissionInput(currentType.defaultCommissionAmountRmb)
            : "";
        const nextDefault =
          nextType !== null
            ? formatOptionalTaskCommissionInput(nextType.defaultCommissionAmountRmb)
            : "";
        const shouldReplaceCommission =
          current.commissionAmount.trim().length === 0
          || current.commissionAmount === currentDefault;

        return {
          ...current,
          taskTypeCode,
          commissionAmount: shouldReplaceCommission
            ? nextDefault
            : current.commissionAmount,
        };
      });
    },
    [taskTypeOptions],
  );

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
        taskTypeCode: createFormState.taskTypeCode,
        commissionAmountRmb:
          parseTaskCommissionAmountInput(createFormState.commissionAmount) ?? 0,
        acceptanceLimit: parseTaskAcceptanceLimitInput(createFormState.acceptanceLimit) ?? 1,
        acceptanceUnlimited: createFormState.acceptanceUnlimited,
        createdByUserId: viewerId,
        targetRoles: createFormState.targetRoles,
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
      setCreateFormState(createEmptyTaskForm(taskTypeOptions));
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
  }, [canView, createFormState, createPending, onPageFeedback, refreshTaskBoard, sharedT, supabase, t, taskTypeOptions, viewerId]);

  return {
    createDialogFeedback,
    createDialogOpen,
    createFormState,
    createPending,
    handleCreateDialogOpenChange,
    handleCreateFilesChange,
    handleCreateTargetRoleToggle,
    handleCreateTaskTypeChange,
    handleCreateTask,
    openCreateDialog,
    removeCreateFile,
    updateCreateField,
  };
}
