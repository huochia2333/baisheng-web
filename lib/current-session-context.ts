import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { getAppRoleFromClaims, getUserStatusFromClaims } from "./auth-claims";
import type { AppRole } from "./auth-routing";
import {
  getAppRoleFromMetadataContainer,
  getUserStatusFromMetadataContainer,
  type UserStatus,
} from "./auth-metadata";
import { withRequestTimeout } from "./request-timeout";

const AUTH_SESSION_TIMEOUT_MS = 8_000;
const AUTH_SESSION_RETRY_DELAY_MS = 350;
const AUTH_SESSION_TIMEOUT_MESSAGE = "登录状态同步较慢，请稍后重试。";
const SESSION_TRACKING_REGISTRY_KEY = "__baishengSessionTrackingRegistry__" as const;

type SessionCacheState = {
  currentClaimsRequest: Promise<unknown | null> | null;
  currentClaimsSnapshot: unknown | null | undefined;
  currentSessionRequest: Promise<Session | null> | null;
  currentSessionSnapshot: Session | null | undefined;
  currentUserRequest: Promise<User | null> | null;
  currentUserSnapshot: User | null | undefined;
  sessionTrackingCleanup: (() => void) | null;
  sessionTrackingReady: boolean;
  resetVersion: number;
};

const sessionCacheByClient = new WeakMap<SupabaseClient, SessionCacheState>();

let sessionCacheResetVersion = 0;

export function resetCurrentAuthContextCache() {
  sessionCacheResetVersion += 1;
}

export function getRoleFromUser(user: User | null | undefined): AppRole | null {
  return getAppRoleFromMetadataContainer(user);
}

export function getStatusFromUser(user: User | null | undefined): UserStatus | null {
  return getUserStatusFromMetadataContainer(user);
}

export async function getCurrentSession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const sessionCache = getSessionCache(supabase);

  ensureSessionTracking(supabase, sessionCache);

  if (sessionCache.currentSessionSnapshot !== undefined) {
    return sessionCache.currentSessionSnapshot;
  }

  if (!sessionCache.currentSessionRequest) {
    sessionCache.currentSessionRequest = resolveCurrentSession(
      supabase,
      sessionCache,
    ).finally(() => {
      sessionCache.currentSessionRequest = null;
    });
  }

  return sessionCache.currentSessionRequest;
}

export async function getCurrentSessionContext(
  supabase: SupabaseClient,
): Promise<{
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  status: UserStatus | null;
}> {
  const [session, user, claims] = await Promise.all([
    getCurrentSession(supabase),
    getCurrentUser(supabase),
    getCurrentClaims(supabase),
  ]);
  const trustedClaims = user ? claims : null;

  return {
    session,
    user,
    role: getAppRoleFromClaims(trustedClaims) ?? getRoleFromUser(user),
    status: getUserStatusFromClaims(trustedClaims) ?? getStatusFromUser(user),
  };
}

async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const sessionCache = getSessionCache(supabase);

  ensureSessionTracking(supabase, sessionCache);

  if (sessionCache.currentUserSnapshot !== undefined) {
    return sessionCache.currentUserSnapshot;
  }

  if (!sessionCache.currentUserRequest) {
    sessionCache.currentUserRequest = resolveCurrentUser(
      supabase,
      sessionCache,
    ).finally(() => {
      sessionCache.currentUserRequest = null;
    });
  }

  return sessionCache.currentUserRequest;
}

function getSessionCache(supabase: SupabaseClient) {
  const existingCache = sessionCacheByClient.get(supabase);

  if (existingCache) {
    if (existingCache.resetVersion !== sessionCacheResetVersion) {
      existingCache.sessionTrackingCleanup?.();
      existingCache.currentClaimsRequest = null;
      existingCache.currentClaimsSnapshot = undefined;
      existingCache.currentSessionRequest = null;
      existingCache.currentSessionSnapshot = undefined;
      existingCache.currentUserRequest = null;
      existingCache.currentUserSnapshot = undefined;
      existingCache.sessionTrackingCleanup = null;
      existingCache.sessionTrackingReady = false;
      existingCache.resetVersion = sessionCacheResetVersion;
    }

    return existingCache;
  }

  const sessionCache: SessionCacheState = {
    currentClaimsRequest: null,
    currentClaimsSnapshot: undefined,
    currentSessionRequest: null,
    currentSessionSnapshot: undefined,
    currentUserRequest: null,
    currentUserSnapshot: undefined,
    sessionTrackingCleanup: null,
    sessionTrackingReady: false,
    resetVersion: sessionCacheResetVersion,
  };

  sessionCacheByClient.set(supabase, sessionCache);
  return sessionCache;
}

async function resolveCurrentSession(
  supabase: SupabaseClient,
  sessionCache: SessionCacheState,
) {
  try {
    const session = await withRequestTimeout(
      fetchCurrentSession(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    sessionCache.currentSessionSnapshot = session;
    return session;
  } catch (error) {
    if (sessionCache.currentSessionSnapshot !== undefined) {
      return sessionCache.currentSessionSnapshot;
    }

    if (!isSessionTimeoutError(error)) {
      throw error;
    }

    await delay(AUTH_SESSION_RETRY_DELAY_MS);

    if (sessionCache.currentSessionSnapshot !== undefined) {
      return sessionCache.currentSessionSnapshot;
    }

    const retriedSession = await withRequestTimeout(
      fetchCurrentSession(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    sessionCache.currentSessionSnapshot = retriedSession;
    return retriedSession;
  }
}

async function fetchCurrentSession(supabase: SupabaseClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

async function resolveCurrentUser(
  supabase: SupabaseClient,
  sessionCache: SessionCacheState,
) {
  try {
    const user = await withRequestTimeout(
      fetchCurrentUser(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    sessionCache.currentUserSnapshot = user;
    return user;
  } catch (error) {
    if (sessionCache.currentUserSnapshot !== undefined) {
      return sessionCache.currentUserSnapshot;
    }

    if (!isSessionTimeoutError(error)) {
      throw error;
    }

    await delay(AUTH_SESSION_RETRY_DELAY_MS);

    if (sessionCache.currentUserSnapshot !== undefined) {
      return sessionCache.currentUserSnapshot;
    }

    const retriedUser = await withRequestTimeout(
      fetchCurrentUser(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    sessionCache.currentUserSnapshot = retriedUser;
    return retriedUser;
  }
}

async function fetchCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionMissingError(error)) {
      return null;
    }

    throw error;
  }

  return user;
}

async function getCurrentClaims(supabase: SupabaseClient): Promise<unknown | null> {
  const sessionCache = getSessionCache(supabase);

  ensureSessionTracking(supabase, sessionCache);

  if (
    sessionCache.currentSessionSnapshot === null ||
    sessionCache.currentUserSnapshot === null
  ) {
    sessionCache.currentClaimsSnapshot = null;
    return null;
  }

  if (sessionCache.currentClaimsSnapshot !== undefined) {
    return sessionCache.currentClaimsSnapshot;
  }

  if (!sessionCache.currentClaimsRequest) {
    sessionCache.currentClaimsRequest = resolveCurrentClaims(
      supabase,
      sessionCache,
    ).finally(() => {
      sessionCache.currentClaimsRequest = null;
    });
  }

  return sessionCache.currentClaimsRequest;
}

async function resolveCurrentClaims(
  supabase: SupabaseClient,
  sessionCache: SessionCacheState,
) {
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    sessionCache.currentClaimsSnapshot = null;
    return null;
  }

  const claims = data?.claims ?? null;
  sessionCache.currentClaimsSnapshot = claims;
  return claims;
}

function ensureSessionTracking(
  supabase: SupabaseClient,
  sessionCache: SessionCacheState,
) {
  if (sessionCache.sessionTrackingReady) {
    return;
  }

  const sessionTrackingRegistry = getSessionTrackingRegistry();
  sessionTrackingRegistry.get(supabase)?.();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    sessionCache.currentClaimsRequest = null;
    sessionCache.currentClaimsSnapshot = undefined;
    sessionCache.currentSessionSnapshot = session;
    sessionCache.currentUserRequest = null;
    sessionCache.currentUserSnapshot = session ? undefined : null;
  });

  const cleanup = () => {
    subscription.unsubscribe();

    if (sessionTrackingRegistry.get(supabase) === cleanup) {
      sessionTrackingRegistry.delete(supabase);
    }

    if (sessionCache.sessionTrackingCleanup === cleanup) {
      sessionCache.sessionTrackingCleanup = null;
      sessionCache.sessionTrackingReady = false;
    }
  };

  sessionCache.sessionTrackingCleanup = cleanup;
  sessionCache.sessionTrackingReady = true;
  sessionTrackingRegistry.set(supabase, cleanup);
}

function getSessionTrackingRegistry() {
  const globalScope = globalThis as typeof globalThis & {
    [SESSION_TRACKING_REGISTRY_KEY]?: WeakMap<SupabaseClient, () => void>;
  };

  if (!globalScope[SESSION_TRACKING_REGISTRY_KEY]) {
    globalScope[SESSION_TRACKING_REGISTRY_KEY] = new WeakMap<SupabaseClient, () => void>();
  }

  return globalScope[SESSION_TRACKING_REGISTRY_KEY];
}

function isSessionTimeoutError(error: unknown) {
  return error instanceof Error && error.message === AUTH_SESSION_TIMEOUT_MESSAGE;
}

function isAuthSessionMissingError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AuthSessionMissingError" ||
      error.message.toLowerCase().includes("auth session missing"))
  );
}

function delay(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, timeoutMs);
  });
}
