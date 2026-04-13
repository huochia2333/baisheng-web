import { redirect } from "next/navigation";

import { getAuthClaimsUserId, getAppRoleFromClaims } from "./auth-claims";
import {
  getDefaultSignedInPathForRole,
  getDefaultWorkspaceBasePath,
  type AppRole,
} from "./auth-routing";
import { getServerSupabaseClient } from "./supabase-server";

type ServerAuthContext = {
  role: AppRole | null;
  userId: string | null;
};

export async function getServerAuthContext(): Promise<ServerAuthContext> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return {
      role: null,
      userId: null,
    };
  }

  return {
    role: getAppRoleFromClaims(data?.claims),
    userId: getAuthClaimsUserId(data?.claims),
  };
}

export async function redirectAuthenticatedUserToWorkspace() {
  const { role, userId } = await getServerAuthContext();

  if (!userId) {
    return;
  }

  redirect(getDefaultSignedInPathForRole(role));
}

export async function requireWorkspaceAccess(expectedBasePath: string) {
  const { role, userId } = await getServerAuthContext();

  if (!userId) {
    redirect("/login");
  }

  const desiredBasePath = getDefaultWorkspaceBasePath(role);

  if (desiredBasePath !== expectedBasePath) {
    redirect(`${desiredBasePath}/my`);
  }
}
