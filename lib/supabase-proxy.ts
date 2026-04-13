import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthClaimsUserId, getAppRoleFromClaims } from "./auth-claims";
import {
  getDefaultSignedInPathForRole,
  getDefaultWorkspaceBasePath,
} from "./auth-routing";
import { getSupabaseEnv } from "./supabase";

const AUTH_ENTRY_PATHS = new Set(["/login", "/register"]);
const WORKSPACE_BASE_PATHS = [
  "/admin",
  "/manager",
  "/recruiter",
  "/operator",
  "/finance",
  "/client",
  "/salesman",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
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
  const pathname = request.nextUrl.pathname;
  const currentBasePath = getWorkspaceBasePath(pathname);

  if (currentBasePath) {
    if (!userId) {
      return createRedirectResponse(request, supabaseResponse, "/login", {
        clearSearch: true,
      });
    }

    const desiredBasePath = getDefaultWorkspaceBasePath(role);

    if (desiredBasePath !== currentBasePath) {
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

function getWorkspaceBasePath(pathname: string) {
  for (const basePath of WORKSPACE_BASE_PATHS) {
    if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
      return basePath;
    }
  }

  return null;
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
