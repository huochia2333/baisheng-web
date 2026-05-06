"use client";

import { useMemo } from "react";

import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WorkspaceFeedbackType } from "@/lib/workspace-feedback";

import { WorkspaceFeedbackDialog } from "./workspace-feedback-dialog";
import { useWorkspaceFeedbackForm } from "./use-workspace-feedback-form";

type TranslationValues = Record<string, string | number>;
type Translator = (key: string, values?: TranslationValues) => string;

export function WorkspaceFeedbackButton() {
  const t = useTranslations("DashboardShell");
  const copy = useMemo(() => createWorkspaceFeedbackCopy(t), [t]);
  const feedback = useWorkspaceFeedbackForm({ copy: copy.feedback });

  return (
    <>
      <button
        aria-label={copy.open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white sm:h-10 sm:w-10"
        onClick={feedback.openDialog}
        type="button"
      >
        <MessageSquarePlus className="size-[18px]" />
      </button>

      {feedback.successMessage ? (
        <div
          className="fixed right-3 top-20 z-50 max-w-[calc(100vw-1.5rem)] rounded-[20px] border border-[#cfe1d8] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#2f6b4f] shadow-[0_18px_42px_rgba(72,86,98,0.16)] sm:right-6"
          role="status"
        >
          {feedback.successMessage}
        </div>
      ) : null}

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

function createWorkspaceFeedbackCopy(t: Translator) {
  const typeOptions: Record<WorkspaceFeedbackType, string> = {
    bug: t("feedback.types.bug"),
    suggestion: t("feedback.types.suggestion"),
  };

  return {
    dialog: {
      cancel: t("feedback.cancel"),
      contentLabel: t("feedback.contentLabel"),
      contentPlaceholder: t("feedback.contentPlaceholder"),
      description: t("feedback.description"),
      submit: t("feedback.submit"),
      title: t("feedback.title"),
      titleLabel: t("feedback.titleLabel"),
      titlePlaceholder: t("feedback.titlePlaceholder"),
      typeLabel: t("feedback.typeLabel"),
      typeOptions,
    },
    feedback: {
      contentTooLong: t("feedback.contentTooLong"),
      contentTooShort: t("feedback.contentTooShort"),
      serviceUnavailable: t("feedback.serviceUnavailable"),
      success: t("feedback.success"),
      titleTooLong: t("feedback.titleTooLong"),
      titleTooShort: t("feedback.titleTooShort"),
    },
    open: t("feedback.open"),
  };
}
