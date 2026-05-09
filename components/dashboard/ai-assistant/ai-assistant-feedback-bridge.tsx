"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { useTranslations } from "next-intl";

import { createWorkspaceFeedbackCopy } from "@/components/dashboard/workspace-feedback/workspace-feedback-copy";
import { WorkspaceFeedbackDialog } from "@/components/dashboard/workspace-feedback/workspace-feedback-dialog";
import type { WorkspaceFeedbackFormState } from "@/components/dashboard/workspace-feedback/workspace-feedback-display";
import { WorkspaceFeedbackSuccessToast } from "@/components/dashboard/workspace-feedback/workspace-feedback-success-toast";
import { useWorkspaceFeedbackForm } from "@/components/dashboard/workspace-feedback/use-workspace-feedback-form";

export type AiAssistantOpenFeedback = (
  draft?: Partial<WorkspaceFeedbackFormState>,
) => void;

type AiAssistantFeedbackBridgeProps = {
  children: (controls: { openFeedback: AiAssistantOpenFeedback }) => ReactNode;
};

export function AiAssistantFeedbackBridge({
  children,
}: AiAssistantFeedbackBridgeProps) {
  const t = useTranslations("DashboardShell");
  const copy = useMemo(() => createWorkspaceFeedbackCopy(t), [t]);
  const feedback = useWorkspaceFeedbackForm({ copy: copy.feedback });

  return (
    <>
      {children({ openFeedback: feedback.openDialog })}

      <WorkspaceFeedbackSuccessToast message={feedback.successMessage} />

      <WorkspaceFeedbackDialog
        copy={copy.dialog}
        feedback={feedback.dialogFeedback}
        formState={feedback.formState}
        onOpenChange={feedback.handleDialogOpenChange}
        onSubmit={() => void feedback.handleSubmit()}
        onUpdateField={feedback.updateFormField}
        open={feedback.dialogOpen}
        pending={feedback.submitPending}
      />
    </>
  );
}
