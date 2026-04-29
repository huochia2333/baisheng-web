import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_AUTH_KEY_PATTERN = /^sb-.*-auth-token(?:\.\d+)?(?:-code-verifier)?$/;

export function signOutCurrentBrowserSession(
  supabase: SupabaseClient | null,
  destination = "/login",
) {
  void supabase?.auth.signOut({ scope: "local" }).catch(() => undefined);
  clearSupabaseBrowserSession();

  if (typeof window !== "undefined") {
    window.location.replace(destination);
  }
}

function clearSupabaseBrowserSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    clearMatchingStorageKeys(window.localStorage);
    clearMatchingStorageKeys(window.sessionStorage);
    clearMatchingCookies();
  } catch {
    // Best-effort local cleanup should not block the visible logout transition.
  }
}

function clearMatchingStorageKeys(storage: Storage) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && SUPABASE_AUTH_KEY_PATTERN.test(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    storage.removeItem(key);
  });
}

function clearMatchingCookies() {
  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name && SUPABASE_AUTH_KEY_PATTERN.test(name)))
    .forEach((name) => {
      expireCookie(name);
      getRootCookieDomain()?.forEach((domain) => expireCookie(name, domain));
    });
}

function expireCookie(name: string, domain?: string) {
  const encodedName = encodeURIComponent(name);
  const domainPart = domain ? `; domain=${domain}` : "";

  document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}; SameSite=Lax`;
}

function getRootCookieDomain() {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".");

  if (parts.length < 2) {
    return null;
  }

  const rootDomain = parts.slice(-2).join(".");
  return [hostname, `.${rootDomain}`];
}
