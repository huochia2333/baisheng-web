"use client";

import { useCallback, useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { markBrowserCloudSyncActivity } from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { submitWorkspaceFeedback } from "@/lib/workspace-feedback";

import type { NoticeTone } from "../dashboard-shared-ui";
import {
  createEmptyWorkspaceFeedbackForm,
  validateWorkspaceFeedbackForm,
  type WorkspaceFeedbackFormState,
  type WorkspaceFeedbackValidationCopy,
} from "./workspace-feedback-display";

type Feedback = { tone: NoticeTone; message: string } | null;

type UseWorkspaceFeedbackFormOptions = {
  copy: WorkspaceFeedbackValidationCopy & {
    serviceUnavailable: string;
    success: string;
  };
};
type WorkspaceFeedbackDraft = Partial<WorkspaceFeedbackFormState>;

const SUCCESS_MESSAGE_VISIBLE_MS = 4_000;

export function useWorkspaceFeedbackForm({
  copy,
}: UseWorkspaceFeedbackFormOptions) {
  const pathname = usePathname();
  const supabase = getBrowserSupabaseClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<WorkspaceFeedbackFormState>(() =>
    createEmptyWorkspaceFeedbackForm(),
  );
  const [dialogFeedback, setDialogFeedback] = useState<Feedback>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, SUCCESS_MESSAGE_VISIBLE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const openDialog = useCallback((draft?: WorkspaceFeedbackDraft) => {
    setSuccessMessage(null);
    setDialogFeedback(null);
    setFormState({
      ...createEmptyWorkspaceFeedbackForm(),
      ...draft,
    });
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && submitPending) {
        return;
      }

      setDialogOpen(open);

      if (!open) {
        setDialogFeedback(null);
      }
    },
    [submitPending],
  );

  const updateFormField = useCallback(
    <Key extends keyof WorkspaceFeedbackFormState>(
      field: Key,
      value: WorkspaceFeedbackFormState[Key],
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

    const validationMessage = validateWorkspaceFeedbackForm(formState, copy);

    if (validationMessage) {
      setDialogFeedback({ tone: "error", message: validationMessage });
      return;
    }

    setSubmitPending(true);
    setDialogFeedback(null);

    try {
      await submitWorkspaceFeedback(supabase, {
        content: formState.content,
        feedbackType: formState.feedbackType,
        sourcePath: pathname || "/",
        title: formState.title,
      });

      markBrowserCloudSyncActivity();
      setFormState(createEmptyWorkspaceFeedbackForm());
      setDialogOpen(false);
      setSuccessMessage(copy.success);
    } catch {
      setDialogFeedback({
        tone: "error",
        message: copy.serviceUnavailable,
      });
    } finally {
      setSubmitPending(false);
    }
  }, [copy, formState, pathname, submitPending, supabase]);

  return {
    dialogFeedback,
    dialogOpen,
    formState,
    submitPending,
    successMessage,
    handleDialogOpenChange,
    handleSubmit,
    openDialog,
    updateFormField,
  };
}
