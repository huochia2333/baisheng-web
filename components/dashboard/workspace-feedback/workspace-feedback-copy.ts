"use client";

import type { WorkspaceFeedbackType } from "@/lib/workspace-feedback";

type TranslationValues = Record<string, string | number>;
type Translator = (key: string, values?: TranslationValues) => string;

export function createWorkspaceFeedbackCopy(t: Translator) {
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
