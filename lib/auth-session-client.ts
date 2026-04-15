import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

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

export function getRoleFromUser(user: User | null | undefined): AppRole | null {
  return getAppRoleFromMetadataContainer(user);
}

export function getRoleFromSession(session: Session | null | undefined): AppRole | null {
  return getRoleFromUser(session?.user);
}
