import type { AppRole } from "./auth-routing";

export type UserStatus = "inactive" | "active" | "suspended";

const APP_ROLES = new Set<AppRole>([
  "administrator",
  "operator",
  "manager",
  "recruiter",
  "salesman",
  "finance",
  "client",
]);

const USER_STATUSES = new Set<UserStatus>(["inactive", "active", "suspended"]);

export function getAppRoleFromMetadataContainer(value: unknown): AppRole | null {
  const role = normalizeOptionalString(getAppMetadata(value)?.role);

  return role && APP_ROLES.has(role as AppRole) ? (role as AppRole) : null;
}

export function getUserStatusFromMetadataContainer(value: unknown): UserStatus | null {
  const status = normalizeOptionalString(getAppMetadata(value)?.status);

  return status && USER_STATUSES.has(status as UserStatus)
    ? (status as UserStatus)
    : null;
}

function getAppMetadata(value: unknown) {
  const record = readRecord(value);

  if (!record) {
    return null;
  }

  return readRecord(record.app_metadata) ?? readRecord(record.appMetadata);
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
