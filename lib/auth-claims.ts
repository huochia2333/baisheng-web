import type { AppRole } from "./auth-routing";

const APP_ROLES: AppRole[] = [
  "administrator",
  "operator",
  "manager",
  "recruiter",
  "salesman",
  "finance",
  "client",
];

export function getAuthClaimsUserId(claims: unknown) {
  return normalizeOptionalString(readRecord(claims)?.sub);
}

export function getAppRoleFromClaims(claims: unknown): AppRole | null {
  const metadata = getAppMetadata(readRecord(claims));
  const role = normalizeOptionalString(metadata?.role);

  return role && APP_ROLES.includes(role as AppRole) ? (role as AppRole) : null;
}

function getAppMetadata(claims: Record<string, unknown> | null) {
  if (!claims) {
    return null;
  }

  return readRecord(claims.app_metadata) ?? readRecord(claims.appMetadata);
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
