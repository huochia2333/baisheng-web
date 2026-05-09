"use client";

import { useMemo } from "react";

import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { createWorkspaceFeedbackCopy } from "./workspace-feedback-copy";
import { WorkspaceFeedbackDialog } from "./workspace-feedback-dialog";
import { WorkspaceFeedbackSuccessToast } from "./workspace-feedback-success-toast";
import { useWorkspaceFeedbackForm } from "./use-workspace-feedback-form";

export function WorkspaceFeedbackButton() {
  const t = useTranslations("DashboardShell");
  const copy = useMemo(() => createWorkspaceFeedbackCopy(t), [t]);
  const feedback = useWorkspaceFeedbackForm({ copy: copy.feedback });

  return (
    <>
      <button
        aria-label={copy.open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white sm:h-10 sm:w-10"
        onClick={() => feedback.openDialog()}
        type="button"
      >
        <MessageSquarePlus className="size-[18px]" />
      </button>

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
