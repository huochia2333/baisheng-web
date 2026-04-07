import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type AppRole =
  | "administrator"
  | "operator"
  | "manager"
  | "recruiter"
  | "salesman"
  | "finance"
  | "client";

export async function getAuthSession(supabase: SupabaseClient): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export function getRoleFromAccessToken(accessToken: string | null | undefined): AppRole | null {
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const appMetadata =
    typeof payload === "object" && payload !== null && "app_metadata" in payload
      ? payload.app_metadata
      : null;

  const role =
    typeof appMetadata === "object" && appMetadata !== null && "role" in appMetadata
      ? normalizeOptionalString(appMetadata.role)
      : null;

  if (
    role === "administrator" ||
    role === "operator" ||
    role === "manager" ||
    role === "recruiter" ||
    role === "salesman" ||
    role === "finance" ||
    role === "client"
  ) {
    return role;
  }

  return null;
}

export function getDefaultSignedInPathForRole(role: AppRole | null) {
  if (role === "manager") {
    return "/manager/my";
  }

  if (role === "recruiter") {
    return "/recruiter/my";
  }

  if (role === "salesman") {
    return "/salesman/my";
  }

  if (role === "operator") {
    return "/operator/my";
  }

  if (role === "finance") {
    return "/finance/my";
  }

  if (role === "client") {
    return "/client/my";
  }

  return "/admin/my";
}

function decodeJwtPayload(accessToken: string) {
  const segments = accessToken.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(atob(normalizeBase64Url(segments[1])));
  } catch {
    return null;
  }
}

function normalizeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;

  if (padding === 0) {
    return base64;
  }

  return `${base64}${"=".repeat(4 - padding)}`;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
