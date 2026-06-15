import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";

import {
  canAccessWorkspaceBasePath,
  getDefaultSignedInPathForRole,
  type AppRole,
} from "./auth-routing";
import { getCurrentSessionContext } from "./current-session-context";
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
  const { user, role } = await getCurrentSessionContext(supabase);

  if (!user) {
    return {
      role: null,
      userId: null,
    };
  }

  return {
    role,
    userId: user.id,
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

  if (!canAccessWorkspaceBasePath(role, expectedBasePath)) {
    forbidden();
  }
}
