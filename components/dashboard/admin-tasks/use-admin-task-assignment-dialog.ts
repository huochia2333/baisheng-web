"use client";

import { useCallback, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  updateAdminTaskAssignment,
  type AdminTaskRow,
  type TaskTargetRole,
} from "@/lib/admin-tasks";
import { type getBrowserSupabaseClient } from "@/lib/supabase";

import {
  toAdminTaskErrorMessage,
  validateTaskAssignmentDraft,
} from "@/components/dashboard/tasks/tasks-display";

import {
  createEmptyAssignmentForm,
  type AssignmentFormState,
} from "./admin-tasks-utils";
import { type PageFeedbackValue } from "./admin-tasks-view-model-shared";

export function useAdminTaskAssignmentDialog({
  onPageFeedback,
  refreshTaskBoard,
  supabase,
  tasks,
}: {
  onPageFeedback: (feedback: PageFeedbackValue) => void;
  refreshTaskBoard: () => void;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  tasks: AdminTaskRow[];
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentDialogFeedback, setAssignmentDialogFeedback] =
    useState<PageFeedbackValue | null>(null);
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [assignmentFormState, setAssignmentFormState] = useState<AssignmentFormState>(
    createEmptyAssignmentForm,
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const handleAssignmentDialogOpenChange = useCallback((open: boolean) => {
    setAssignmentDialogOpen(open);

    if (!open) {
      setAssignmentDialogFeedback(null);
      setSelectedTaskId(null);
    }
  }, []);

  const openAssignmentDialog = useCallback((task: AdminTaskRow) => {
    setSelectedTaskId(task.id);
    setAssignmentDialogFeedback(null);
    setAssignmentFormState({
      targetRoles: task.target_roles,
    });
    setAssignmentDialogOpen(true);
  }, []);

  const handleAssignmentTargetRoleToggle = useCallback((role: TaskTargetRole) => {
    setAssignmentFormState((current) => ({
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((targetRole) => targetRole !== role)
        : [...current.targetRoles, role],
    }));
  }, []);

  const handleSaveAssignment = useCallback(async () => {
    if (!supabase || !selectedTask || assignmentPending) {
      return;
    }

    const validationMessage = validateTaskAssignmentDraft(assignmentFormState, t);

    if (validationMessage) {
      setAssignmentDialogFeedback({
        tone: "error",
        message: validationMessage,
      });
      return;
    }

    setAssignmentPending(true);
    setAssignmentDialogFeedback(null);

    try {
      await updateAdminTaskAssignment(supabase, {
        taskId: selectedTask.id,
        targetRoles: assignmentFormState.targetRoles,
      });

      setAssignmentDialogOpen(false);
      setSelectedTaskId(null);
      onPageFeedback({
        tone: "success",
        message: t("feedback.assignmentUpdated"),
      });
      refreshTaskBoard();
    } catch (error) {
      setAssignmentDialogFeedback({
        tone: "error",
        message: toAdminTaskErrorMessage(error, sharedT),
      });
    } finally {
      setAssignmentPending(false);
    }
  }, [assignmentFormState, assignmentPending, onPageFeedback, refreshTaskBoard, selectedTask, sharedT, supabase, t]);

  return {
    assignmentDialogFeedback,
    assignmentDialogOpen: assignmentDialogOpen && selectedTask !== null,
    assignmentFormState,
    assignmentPending,
    assignmentPendingTaskId: assignmentPending ? selectedTask?.id ?? null : null,
    handleAssignmentDialogOpenChange,
    handleAssignmentTargetRoleToggle,
    handleSaveAssignment,
    openAssignmentDialog,
    selectedTask,
  };
}
