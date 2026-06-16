import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getCompanyPublicOrigin } from "@/lib/company-config";
import { getServerSupabaseClient } from "@/lib/supabase-server";

const EMAIL_CONFIRMATION_TYPE = "email" satisfies EmailOtpType;
const PASSWORD_RECOVERY_TYPE = "recovery" satisfies EmailOtpType;
const DEFAULT_REDIRECT_PATH = "/login";
const DEFAULT_RECOVERY_REDIRECT_PATH = "/forgot-password?type=recovery";
const DEFAULT_PUBLIC_ORIGIN = getCompanyPublicOrigin();
const LOCAL_PUBLIC_HOST_PATTERN = /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
const ALLOWED_PUBLIC_HOSTS = new Set(
  [DEFAULT_PUBLIC_ORIGIN, process.env.NEXT_PUBLIC_SITE_URL]
    .map(getOriginHost)
    .filter((host): host is string => Boolean(host)),
);

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const publicOrigin = getPublicOrigin(request);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getSupportedEmailOtpType(requestUrl.searchParams.get("type"));
  // Recovery verification creates the reset session; always land on the reset form.
  const nextPath =
    type === PASSWORD_RECOVERY_TYPE
      ? DEFAULT_RECOVERY_REDIRECT_PATH
      : getSafeRedirectPath(requestUrl.searchParams.get("next"), publicOrigin);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, publicOrigin));
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, publicOrigin));
  }

  return NextResponse.redirect(new URL(nextPath, publicOrigin));
}

function getSupportedEmailOtpType(value: string | null): EmailOtpType | null {
  if (value === EMAIL_CONFIRMATION_TYPE || value === PASSWORD_RECOVERY_TYPE) {
    return value;
  }

  return null;
}

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = normalizePublicHost(
    forwardedHost ?? getFirstHeaderValue(request.headers.get("host")),
  );

  if (!host || !isAllowedPublicHost(host)) {
    return DEFAULT_PUBLIC_ORIGIN;
  }

  const protocol = LOCAL_PUBLIC_HOST_PATTERN.test(host) ? "http" : "https";

  return `${protocol}://${host}`;
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getOriginHost(origin: string | undefined) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizePublicHost(value: string | null) {
  const host = value?.trim().toLowerCase();

  if (!host || host.startsWith("0.0.0.0") || /[/?#@\\]/.test(host)) {
    return null;
  }

  return host;
}

function isAllowedPublicHost(host: string) {
  return ALLOWED_PUBLIC_HOSTS.has(host) || LOCAL_PUBLIC_HOST_PATTERN.test(host);
}

function getSafeRedirectPath(value: string | null, origin: string) {
  if (!value) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const url = new URL(value, origin);

    if (url.origin !== origin) {
      return DEFAULT_REDIRECT_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}
