"use client";

import type { WorkspaceFeedbackType } from "@/lib/workspace-feedback";

export type WorkspaceFeedbackFormState = {
  content: string;
  feedbackType: WorkspaceFeedbackType;
  title: string;
};

export type WorkspaceFeedbackValidationCopy = {
  contentTooLong: string;
  contentTooShort: string;
  titleTooLong: string;
  titleTooShort: string;
};

export const workspaceFeedbackTypeValues = [
  "bug",
  "suggestion",
] as const satisfies readonly WorkspaceFeedbackType[];

export function createEmptyWorkspaceFeedbackForm(): WorkspaceFeedbackFormState {
  return {
    content: "",
    feedbackType: "bug",
    title: "",
  };
}

export function validateWorkspaceFeedbackForm(
  formState: WorkspaceFeedbackFormState,
  copy: WorkspaceFeedbackValidationCopy,
) {
  const titleLength = formState.title.trim().length;
  const contentLength = formState.content.trim().length;

  if (titleLength < 2) {
    return copy.titleTooShort;
  }

  if (titleLength > 100) {
    return copy.titleTooLong;
  }

  if (contentLength < 10) {
    return copy.contentTooShort;
  }

  if (contentLength > 2000) {
    return copy.contentTooLong;
  }

  return null;
}
