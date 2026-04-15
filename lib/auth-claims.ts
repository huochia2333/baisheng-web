import type { AppRole } from "./auth-routing";
import { getAppRoleFromMetadataContainer } from "./auth-metadata";

export function getAuthClaimsUserId(claims: unknown) {
  return normalizeOptionalString(readRecord(claims)?.sub);
}

export function getAppRoleFromClaims(claims: unknown): AppRole | null {
  return getAppRoleFromMetadataContainer(claims);
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
