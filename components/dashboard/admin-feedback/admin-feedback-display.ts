"use client";

import type { AppRole } from "@/lib/auth-routing";
import type { Locale } from "@/lib/locale";
import type {
  AdminWorkspaceFeedbackItem,
  WorkspaceFeedbackStatus,
  WorkspaceFeedbackType,
} from "@/lib/workspace-feedback";
import { normalizeSearchText } from "@/lib/value-normalizers";

export type AdminFeedbackRoleLabels = Record<AppRole, string>;
export type AdminFeedbackStatusLabels = Record<WorkspaceFeedbackStatus, string>;
export type AdminFeedbackTypeLabels = Record<WorkspaceFeedbackType, string>;

export function getFeedbackSubmitterName(
  feedback: AdminWorkspaceFeedbackItem,
  fallback: string,
) {
  return feedback.submitter_name ?? feedback.submitter_email ?? fallback;
}

export function getFeedbackSubmitterContact(
  feedback: AdminWorkspaceFeedbackItem,
  fallback: string,
) {
  return feedback.submitter_email ?? fallback;
}

export function getFeedbackRoleLabel(
  role: AppRole | null,
  labels: AdminFeedbackRoleLabels,
  fallback: string,
) {
  return role ? labels[role] : fallback;
}

export function formatFeedbackDate(
  value: string | null | undefined,
  locale: Locale,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function feedbackMatchesSearch(
  feedback: AdminWorkspaceFeedbackItem,
  searchText: string,
) {
  const normalizedSearch = normalizeSearchText(searchText);

  if (!normalizedSearch) {
    return true;
  }

  return [
    feedback.title,
    feedback.content,
    feedback.source_path,
    feedback.submitter_name,
    feedback.submitter_email,
    feedback.submitted_role,
    feedback.feedback_type,
    feedback.status,
  ].some((value) => normalizeSearchText(value).includes(normalizedSearch));
}
