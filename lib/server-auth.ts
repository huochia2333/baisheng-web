import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";

import { getAppRoleFromMetadataContainer } from "./auth-metadata";
import {
  canAccessWorkspaceBasePath,
  getDefaultSignedInPathForRole,
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      role: null,
      userId: null,
    };
  }

  return {
    role: getAppRoleFromMetadataContainer(user),
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
