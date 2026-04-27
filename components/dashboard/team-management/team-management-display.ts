"use client";

import type {
  TeamManagerCandidate,
} from "@/lib/team-management";
import type { AppRole } from "@/lib/user-self-service";

import {
  getRawErrorMessage,
  toErrorMessage,
} from "@/components/dashboard/dashboard-shared-ui";

type TranslationValues = Record<string, string | number>;
export type TeamTranslateFn = (key: string, values?: TranslationValues) => string;

export function getTeamDisplayName(
  teamName: string | null | undefined,
  t: TeamTranslateFn,
) {
  return teamName?.trim() || t("shared.fallback.unnamedTeam");
}

export function getTeamManagerLabel(
  managerName: string | null | undefined,
  managerEmail: string | null | undefined,
  t: TeamTranslateFn,
) {
  return managerName?.trim() || managerEmail?.trim() || t("shared.fallback.notSet");
}

export function getOptionalEmailLabel(
  email: string | null | undefined,
  t: TeamTranslateFn,
) {
  return email?.trim() || t("shared.fallback.noEmail");
}

export function getOptionalRecordLabel(
  value: string | null | undefined,
  t: TeamTranslateFn,
) {
  return value?.trim() || t("shared.fallback.noRecord");
}

export function getOptionalTeamAssignmentLabel(
  teamName: string | null | undefined,
  t: TeamTranslateFn,
) {
  return teamName?.trim() || t("shared.fallback.unassigned");
}

export function getManagerCandidateLabel(
  candidate: TeamManagerCandidate,
  t: TeamTranslateFn,
) {
  const baseLabel = candidate.name ?? candidate.email ?? candidate.user_id;

  if (candidate.current_team_name) {
    return candidate.assignable
      ? t("shared.managerCandidate.currentTeamAssignable", {
          label: baseLabel,
          teamName: candidate.current_team_name,
        })
      : t("shared.managerCandidate.currentTeamLocked", {
          label: baseLabel,
          teamName: candidate.current_team_name,
        });
  }

  return candidate.assignable
    ? baseLabel
    : t("shared.managerCandidate.unassignable", {
        label: baseLabel,
      });
}

export function getTeamManagementDescription(
  role: AppRole | null,
  t: TeamTranslateFn,
) {
  if (role === "manager") {
    return t("descriptions.manager");
  }

  if (role === "administrator") {
    return t("descriptions.administrator");
  }

  if (role === "salesman") {
    return t("descriptions.salesman");
  }

  if (role === "finance" || role === "operator") {
    return t("descriptions.readOnly");
  }

  return t("descriptions.fallback");
}

export function toTeamManagementErrorMessage(
  error: unknown,
  t: TeamTranslateFn,
) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error);

  if (
    rawMessage.includes("team profile save did not return team id") ||
    rawMessage.includes("团队资料保存后没有返回团队 ID")
  ) {
    return t("errors.missingTeamId");
  }

  if (rawMessage.includes("team profile does not exist")) {
    return t("errors.teamProfileMissing");
  }

  if (rawMessage.includes("team name is required")) {
    return t("errors.teamNameRequired");
  }

  if (rawMessage.includes("team not found or not visible")) {
    return t("errors.teamNotVisible");
  }

  if (rawMessage.includes("current user cannot add this salesman to team")) {
    return t("errors.salesmanNotAssignable");
  }

  if (rawMessage.includes("current user cannot assign this manager to team")) {
    return t("errors.managerNotAssignable");
  }

  if (rawMessage.includes("current user cannot manage team")) {
    return t("errors.cannotManageTeam");
  }

  if (rawMessage.includes("current user cannot manage team members")) {
    return t("errors.cannotManageMembers");
  }

  if (rawMessage.includes("current user cannot delete team")) {
    return t("errors.cannotDeleteTeam");
  }

  if (rawMessage.includes("team not found")) {
    return t("errors.teamNotFound");
  }

  return baseMessage;
}
