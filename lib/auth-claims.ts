import type { AppRole } from "./auth-routing";
import {
  getAppRoleFromMetadataContainer,
  getUserStatusFromMetadataContainer,
  type UserStatus,
} from "./auth-metadata";
import { normalizeOptionalString } from "./value-normalizers";

export function getAuthClaimsUserId(claims: unknown) {
  return normalizeOptionalString(readRecord(claims)?.sub);
}

export function getAppRoleFromClaims(claims: unknown): AppRole | null {
  return getAppRoleFromMetadataContainer(claims);
}

export function getUserStatusFromClaims(claims: unknown): UserStatus | null {
  return getUserStatusFromMetadataContainer(claims);
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
