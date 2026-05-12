import type { SalesmanTaskRow } from "@/lib/salesman-tasks";
import type { TaskScope, TaskStatus, TaskTargetRole } from "@/lib/admin-tasks";
import type { Locale } from "@/lib/locale";

import {
  getRawErrorMessage,
  toErrorMessage,
} from "@/components/dashboard/dashboard-shared-ui";

type TranslationValues = Record<string, string | number>;
export type TranslateFn = (key: string, values?: TranslationValues) => string;

type TaskDraftLike = {
  taskName: string;
  taskTypeCode: string;
  commissionAmount: string;
  targetRoles: TaskTargetRole[];
};

type TaskAssignmentDraftLike = {
  targetRoles: TaskTargetRole[];
};

export function getTaskStatusMeta(
  status: TaskStatus | SalesmanTaskRow["status"],
  t: TranslateFn,
) {
  if (status === "to_be_accepted") {
    return { label: t("status.toBeAccepted"), accent: "gold" as const };
  }

  if (status === "accepted") {
    return { label: t("status.accepted"), accent: "blue" as const };
  }

  if (status === "reviewing") {
    return { label: t("status.reviewing"), accent: "orange" as const };
  }

  if (status === "rejected") {
    return { label: t("status.rejected"), accent: "rose" as const };
  }

  return { label: t("status.completed"), accent: "green" as const };
}

export function getTaskScopeLabel(
  scope: TaskScope | SalesmanTaskRow["scope"],
  t: TranslateFn,
) {
  return scope === "public" ? t("scope.public") : t("scope.team");
}

export function getTaskTeamName(
  teamName: string | null | undefined,
  t: TranslateFn,
) {
  return teamName?.trim() || t("fallback.unnamedTeam");
}

export function getTaskTargetRoleLabel(role: TaskTargetRole, t: TranslateFn) {
  return t(`targetRoles.${role}`);
}

export function getTaskTargetRolesLabel(
  roles: TaskTargetRole[],
  t: TranslateFn,
) {
  if (roles.length === 0) {
    return t("fallback.noRecord");
  }

  return roles.map((role) => getTaskTargetRoleLabel(role, t)).join("、");
}

export function getTaskIntroText(
  taskIntro: string | null | undefined,
  t: TranslateFn,
) {
  return taskIntro?.trim() || t("fallback.noTaskIntro");
}

export function getTaskTypeLabel(
  taskTypeLabel: string | null | undefined,
  taskTypeCode: string | null | undefined,
  t: TranslateFn,
) {
  return taskTypeLabel?.trim() || taskTypeCode?.trim() || t("fallback.unknownTaskType");
}

export function formatTaskCommissionMoney(value: number, locale: Locale) {
  if (value <= 0) {
    return locale === "zh" ? "无奖励" : "No reward";
  }

  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseTaskCommissionAmountInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function getTaskAttachmentCountLabel(count: number, t: TranslateFn) {
  return t("attachmentCount", { count });
}

export function getTaskMoreAttachmentsLabel(count: number, t: TranslateFn) {
  return t("moreAttachments", { count });
}

export function resolveTaskActorLabel(
  actor:
    | {
        name: string | null;
        email: string | null;
      }
    | null
    | undefined,
  fallbackUserId: string | null | undefined,
  t: TranslateFn,
) {
  return actor?.name ?? actor?.email ?? fallbackUserId ?? t("fallback.noRecord");
}

export function getTaskAssignmentLabel(
  scope: TaskScope,
  teamName: string | null | undefined,
  t: TranslateFn,
) {
  return scope === "team" ? getTaskTeamName(teamName, t) : t("scope.public");
}

export function validateTaskDraft(
  formState: TaskDraftLike,
  t: TranslateFn,
) {
  if (!formState.taskName.trim()) {
    return t("validation.taskNameRequired");
  }

  if (!formState.taskTypeCode.trim()) {
    return t("validation.taskTypeRequired");
  }

  const commissionAmount = parseTaskCommissionAmountInput(formState.commissionAmount);

  if (commissionAmount === null || commissionAmount < 0) {
    return t("validation.commissionAmountInvalid");
  }

  if (formState.targetRoles.length === 0) {
    return t("validation.targetRolesRequiredForCreate");
  }

  return null;
}

export function validateTaskAssignmentDraft(
  formState: TaskAssignmentDraftLike,
  t: TranslateFn,
) {
  if (formState.targetRoles.length === 0) {
    return t("validation.targetRolesRequiredForAssignment");
  }

  return null;
}

export function toAdminTaskErrorMessage(error: unknown, t: TranslateFn) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error);

  if (rawMessage.includes("task_main_task_name_not_blank")) {
    return t("errors.admin.taskNameBlank");
  }

  if (rawMessage.includes("task_main_scope_team_check")) {
    return t("errors.admin.teamRequired");
  }

  if (rawMessage.includes("task_main_task_type_code_fkey")) {
    return t("errors.admin.taskTypeRequired");
  }

  if (rawMessage.includes("invalid task target roles")) {
    return t("errors.admin.targetRolesRequired");
  }

  if (rawMessage.includes("task target roles can only be changed before acceptance")) {
    return t("errors.admin.targetRolesLocked");
  }

  if (rawMessage.includes("task type display name is required")) {
    return t("errors.admin.taskTypeNameRequired");
  }

  if (rawMessage.includes("task type default commission must be nonnegative")) {
    return t("errors.admin.commissionAmountInvalid");
  }

  if (rawMessage.includes("task type not found")) {
    return t("errors.admin.taskTypeRequired");
  }

  if (rawMessage.includes("task_main_commission_amount_nonnegative")) {
    return t("errors.admin.commissionAmountInvalid");
  }

  if (rawMessage.includes("authenticated user is required")) {
    return t("errors.admin.authExpired");
  }

  if (rawMessage.includes("only administrator")) {
    return t("errors.admin.noPermission");
  }

  if (rawMessage.includes("task not found")) {
    return t("errors.admin.taskNotFound");
  }

  if (rawMessage.includes("completed task cannot be edited")) {
    return t("errors.admin.taskCompletedReadOnly");
  }

  if (rawMessage.includes("completed task cannot be deleted")) {
    return t("errors.admin.taskCompletedReadOnly");
  }

  if (rawMessage.includes("duplicate key value violates unique constraint")) {
    return t("errors.admin.duplicateAttachmentPath");
  }

  if (rawMessage.includes("admin_task_attachments_count_exceeded")) {
    return t("errors.admin.attachmentCountExceeded");
  }

  if (rawMessage.includes("admin_task_attachment_empty")) {
    return t("errors.admin.attachmentEmpty");
  }

  if (rawMessage.includes("admin_task_attachment_too_large")) {
    return t("errors.admin.attachmentTooLarge");
  }

  if (rawMessage.includes("admin_task_attachments_total_too_large")) {
    return t("errors.admin.attachmentTotalTooLarge");
  }

  if (rawMessage.includes("admin_task_attachment_type_not_allowed")) {
    return t("errors.admin.attachmentTypeNotAllowed");
  }

  if (rawMessage.includes("storage")) {
    return t("errors.admin.storage");
  }

  return baseMessage;
}

export function toSalesmanTaskErrorMessage(error: unknown, t: TranslateFn) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error);

  if (rawMessage.includes("current user cannot accept this task")) {
    return t("errors.salesman.cannotAccept");
  }

  if (rawMessage.includes("task is not available for acceptance")) {
    return t("errors.salesman.alreadyAccepted");
  }

  if (rawMessage.includes("current user cannot complete this task")) {
    return t("errors.salesman.cannotComplete");
  }

  if (rawMessage.includes("task is not in accepted status")) {
    return t("errors.salesman.notAccepted");
  }

  if (rawMessage.includes("current user cannot create task review submission")) {
    return t("errors.salesman.cannotCreateReviewSubmission");
  }

  if (rawMessage.includes("current user cannot submit task review")) {
    return t("errors.salesman.cannotSubmitReview");
  }

  if (rawMessage.includes("task review submission assets are required")) {
    return t("errors.salesman.reviewAssetsRequired");
  }

  if (rawMessage.includes("task review submission not found")) {
    return t("errors.salesman.reviewSubmissionMissing");
  }

  if (rawMessage.includes("task review submission is not draft")) {
    return t("errors.salesman.reviewSubmissionInvalid");
  }

  if (rawMessage.includes("task review submission_files_required")) {
    return t("errors.salesman.reviewFilesRequired");
  }

  if (rawMessage.includes("task_review_submission_files_required")) {
    return t("errors.salesman.reviewFilesRequired");
  }

  if (rawMessage.includes("task_review_submission_attachments_count_exceeded")) {
    return t("errors.salesman.reviewAttachmentCountExceeded");
  }

  if (rawMessage.includes("task_review_submission_attachment_empty")) {
    return t("errors.salesman.reviewAttachmentEmpty");
  }

  if (rawMessage.includes("task_review_submission_attachment_too_large")) {
    return t("errors.salesman.reviewAttachmentTooLarge");
  }

  if (rawMessage.includes("task_review_submission_attachments_total_too_large")) {
    return t("errors.salesman.reviewAttachmentTotalTooLarge");
  }

  if (rawMessage.includes("task_review_submission_attachment_type_not_allowed")) {
    return t("errors.salesman.reviewAttachmentTypeNotAllowed");
  }

  if (rawMessage.includes("current user is not active")) {
    return t("errors.salesman.inactive");
  }

  return baseMessage;
}
