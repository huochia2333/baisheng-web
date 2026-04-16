import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthClaimsUserId, getAppRoleFromClaims } from "./auth-claims";
import {
  canAccessWorkspaceBasePath,
  getDefaultSignedInPathForRole,
  getDefaultWorkspaceBasePath,
  getWorkspaceBasePath,
} from "./auth-routing";
import { getSupabaseEnv } from "./supabase";

const AUTH_ENTRY_PATHS = new Set(["/", "/login", "/register", "/forgot-password"]);

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const currentBasePath = getWorkspaceBasePath(pathname);
  const hasAuthCookie = request.cookies.getAll().some((cookie) =>
    isSupabaseAuthCookieName(cookie.name),
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasAuthCookie) {
    if (currentBasePath) {
      return createRedirectResponse(request, supabaseResponse, "/login", {
        clearSearch: true,
      });
    }

    return supabaseResponse;
  }

  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach((cookie) => {
          supabaseResponse.cookies.set(cookie);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = getAuthClaimsUserId(data?.claims);
  const role = getAppRoleFromClaims(data?.claims);

  if (currentBasePath) {
    if (!userId) {
      return createRedirectResponse(request, supabaseResponse, "/login", {
        clearSearch: true,
      });
    }

    const desiredBasePath = getDefaultWorkspaceBasePath(role);

    if (!canAccessWorkspaceBasePath(role, currentBasePath)) {
      const suffix = pathname.slice(currentBasePath.length) || "/my";

      return createRedirectResponse(
        request,
        supabaseResponse,
        `${desiredBasePath}${suffix}`,
      );
    }
  }

  if (AUTH_ENTRY_PATHS.has(pathname) && userId) {
    return createRedirectResponse(
      request,
      supabaseResponse,
      getDefaultSignedInPathForRole(role),
      {
        clearSearch: true,
      },
    );
  }

  return supabaseResponse;
}

function isSupabaseAuthCookieName(name: string) {
  return /^sb-.*-auth-token(?:\.\d+)?$/.test(name);
}

function createRedirectResponse(
  request: NextRequest,
  supabaseResponse: NextResponse,
  destinationPath: string,
  options?: {
    clearSearch?: boolean;
  },
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destinationPath;

  if (options?.clearSearch) {
    redirectUrl.search = "";
  }

  const response = NextResponse.redirect(redirectUrl);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
