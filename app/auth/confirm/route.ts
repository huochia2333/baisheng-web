import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getServerSupabaseClient } from "@/lib/supabase-server";

const EMAIL_CONFIRMATION_TYPE = "email" satisfies EmailOtpType;
const DEFAULT_REDIRECT_PATH = "/login";
const DEFAULT_PUBLIC_ORIGIN = "https://account.pt5china.com";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const publicOrigin = getPublicOrigin(request);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
    publicOrigin,
  );

  if (!tokenHash || type !== EMAIL_CONFIRMATION_TYPE) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, publicOrigin));
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: EMAIL_CONFIRMATION_TYPE,
  });

  if (error) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, publicOrigin));
  }

  return NextResponse.redirect(new URL(nextPath, publicOrigin));
}

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? getFirstHeaderValue(request.headers.get("host"));
  const forwardedProto = getFirstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol =
    forwardedProto ?? request.nextUrl.protocol.replace(/:$/, "") ?? "https";

  if (!host || host.startsWith("0.0.0.0")) {
    return DEFAULT_PUBLIC_ORIGIN;
  }

  return `${protocol}://${host}`;
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
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
