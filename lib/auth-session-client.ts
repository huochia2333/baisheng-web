import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { readAuthClaimsFromAccessToken } from "./auth-access-token";
import { getAppRoleFromClaims } from "./auth-claims";
import { getAppRoleFromMetadataContainer } from "./auth-metadata";
import type { AppRole } from "./auth-routing";

export { getDefaultSignedInPathForRole } from "./auth-routing";

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

function getRoleFromUser(user: User | null | undefined): AppRole | null {
  return getAppRoleFromMetadataContainer(user);
}

export function getRoleFromAuthSession(
  session: Pick<Session, "access_token" | "user"> | null | undefined,
): AppRole | null {
  const fallbackRole = getRoleFromUser(session?.user);

  if (fallbackRole) {
    return fallbackRole;
  }

  return getAppRoleFromClaims(readAuthClaimsFromAccessToken(session?.access_token));
}

export async function getRoleFromAuthClaims(
  supabase: SupabaseClient,
  fallbackUser?: User | null,
): Promise<AppRole | null> {
  const fallbackRole = getRoleFromUser(fallbackUser);

  if (fallbackRole) {
    return fallbackRole;
  }

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return fallbackRole;
  }

  return getAppRoleFromClaims(data?.claims) ?? fallbackRole;
}
