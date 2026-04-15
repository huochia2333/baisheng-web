import type { SalesmanTaskRow } from "@/lib/salesman-tasks";
import type { TaskScope, TaskStatus } from "@/lib/admin-tasks";

import { toErrorMessage } from "./dashboard-shared-ui";

type TranslationValues = Record<string, string | number>;
export type TranslateFn = (key: string, values?: TranslationValues) => string;

type TaskDraftLike = {
  taskName: string;
  scope: TaskScope;
  teamId: string;
};

type TaskAssignmentDraftLike = {
  scope: TaskScope;
  teamId: string;
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

export function getTaskIntroText(
  taskIntro: string | null | undefined,
  t: TranslateFn,
) {
  return taskIntro?.trim() || t("fallback.noTaskIntro");
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

  if (formState.scope === "team" && !formState.teamId) {
    return t("validation.teamRequiredForCreate");
  }

  return null;
}

export function validateTaskAssignmentDraft(
  formState: TaskAssignmentDraftLike,
  t: TranslateFn,
) {
  if (formState.scope === "team" && !formState.teamId) {
    return t("validation.teamRequiredForAssignment");
  }

  return null;
}

export function resolveSalesmanTaskTargetLabel(
  task: SalesmanTaskRow,
  teamNameById: Map<string, string>,
  t: TranslateFn,
) {
  if (task.scope === "public") {
    return t("scope.public");
  }

  if (task.team_id) {
    return teamNameById.get(task.team_id) ?? t("scope.team");
  }

  return t("scope.team");
}

export function toAdminTaskErrorMessage(error: unknown, t: TranslateFn) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("task_main_task_name_not_blank")) {
    return t("errors.admin.taskNameBlank");
  }

  if (baseMessage.includes("task_main_scope_team_check")) {
    return t("errors.admin.teamRequired");
  }

  if (baseMessage.includes("authenticated user is required")) {
    return t("errors.admin.authExpired");
  }

  if (baseMessage.includes("task not found")) {
    return t("errors.admin.taskNotFound");
  }

  if (baseMessage.includes("duplicate key value violates unique constraint")) {
    return t("errors.admin.duplicateAttachmentPath");
  }

  if (baseMessage.includes("admin_task_attachments_count_exceeded")) {
    return t("errors.admin.attachmentCountExceeded");
  }

  if (baseMessage.includes("admin_task_attachment_empty")) {
    return t("errors.admin.attachmentEmpty");
  }

  if (baseMessage.includes("admin_task_attachment_too_large")) {
    return t("errors.admin.attachmentTooLarge");
  }

  if (baseMessage.includes("admin_task_attachments_total_too_large")) {
    return t("errors.admin.attachmentTotalTooLarge");
  }

  if (baseMessage.includes("admin_task_attachment_type_not_allowed")) {
    return t("errors.admin.attachmentTypeNotAllowed");
  }

  if (baseMessage.includes("storage")) {
    return t("errors.admin.storage");
  }

  return baseMessage;
}

export function toSalesmanTaskErrorMessage(error: unknown, t: TranslateFn) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("current user cannot accept this task")) {
    return t("errors.salesman.cannotAccept");
  }

  if (baseMessage.includes("task is not available for acceptance")) {
    return t("errors.salesman.alreadyAccepted");
  }

  if (baseMessage.includes("current user cannot complete this task")) {
    return t("errors.salesman.cannotComplete");
  }

  if (baseMessage.includes("task is not in accepted status")) {
    return t("errors.salesman.notAccepted");
  }

  if (baseMessage.includes("current user is not active")) {
    return t("errors.salesman.inactive");
  }

  return baseMessage;
}
