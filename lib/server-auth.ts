import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthClaimsUserId, getAppRoleFromClaims } from "./auth-claims";
import {
  canAccessWorkspaceBasePath,
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
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((cookie) =>
    isSupabaseAuthCookieName(cookie.name),
  );

  if (!hasAuthCookie) {
    return {
      role: null,
      userId: null,
    };
  }

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

function isSupabaseAuthCookieName(name: string) {
  return /^sb-.*-auth-token(?:\.\d+)?$/.test(name);
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

  if (!canAccessWorkspaceBasePath(role, expectedBasePath)) {
    redirect(`${desiredBasePath}/my`);
  }
}
