import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { mapWithConcurrencyLimit } from "./async-collection";
import { getAppRoleFromClaims, getUserStatusFromClaims } from "./auth-claims";
import {
  getDefaultSignedInPathForRole,
  getDefaultWorkspaceBasePath,
  type AppRole,
} from "./auth-routing";
import {
  getAppRoleFromMetadataContainer,
  getUserStatusFromMetadataContainer,
  type UserStatus,
} from "./auth-metadata";
import { withRequestTimeout } from "./request-timeout";

export { getDefaultSignedInPathForRole, getDefaultWorkspaceBasePath };
export type { AppRole, UserStatus };
export type PrivacyRequestStatus = "pending" | "pass" | "denied";
export type MediaKind = "image" | "video";

export type UserProfileRow = {
  user_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: UserStatus;
  city: string | null;
  referral_code: string | null;
  created_at: string;
};

export type UserPrivacyDataRow = {
  user_id: string;
  passport: string | null;
  id_card: string | null;
};

export type UserPrivacyRequestRow = {
  id: string;
  user_id: string;
  passport_requests: string | null;
  id_card_requests: string | null;
  status: PrivacyRequestStatus;
  reviewer_user_id: string | null;
  created_at: string;
  review_at: string | null;
  type: boolean;
};

export type UserVipMembershipRow = {
  user_id: string;
  status: "active" | "expired" | "cancelled";
  started_at: string | null;
  expires_at: string | null;
  first_paid_order_overview_id: string | null;
  latest_paid_order_overview_id: string | null;
};

export type UserMediaAssetRow = {
  id: string;
  user_id: string;
  kind: MediaKind;
  bucket_name: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  status: PrivacyRequestStatus;
  reviewer_user_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  purge_after: string | null;
};

export type UserMediaAssetWithPreview = UserMediaAssetRow & {
  previewUrl: string | null;
};

export type CurrentUserBundle = {
  authUser: User;
  role: AppRole | null;
  profile: UserProfileRow | null;
  privacyData: UserPrivacyDataRow | null;
  privacyRequests: UserPrivacyRequestRow[];
  mediaAssets: UserMediaAssetWithPreview[];
  vipMembership: UserVipMembershipRow | null;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_CONCURRENCY = 10;
const AUTH_SESSION_TIMEOUT_MS = 8_000;
const AUTH_SESSION_RETRY_DELAY_MS = 350;
const AUTH_SESSION_TIMEOUT_MESSAGE = "登录状态同步较慢，请稍后重试。";
const USER_MEDIA_MUTATION_TIMEOUT_MS = 60_000;
const USER_MEDIA_MUTATION_TIMEOUT_MESSAGE = "媒体操作超时，请稍后重试。";

const PROFILE_MUTATION_TIMEOUT_MS = 20_000;
const PROFILE_MUTATION_TIMEOUT_MESSAGE = "Profile update timed out. Please try again.";

type SessionCacheState = {
  currentClaimsRequest: Promise<unknown | null> | null;
  currentClaimsSnapshot: unknown | null | undefined;
  currentSessionRequest: Promise<Session | null> | null;
  currentSessionSnapshot: Session | null | undefined;
  sessionTrackingCleanup: (() => void) | null;
  sessionTrackingReady: boolean;
  resetVersion: number;
};

const sessionCacheByClient = new WeakMap<SupabaseClient, SessionCacheState>();
const SESSION_TRACKING_REGISTRY_KEY = "__baishengSessionTrackingRegistry__" as const;

let sessionCacheResetVersion = 0;

export function resetCurrentSessionCache() {
  sessionCacheResetVersion += 1;
}

export function getRoleFromUser(user: User | null | undefined): AppRole | null {
  return getAppRoleFromMetadataContainer(user);
}

export function getStatusFromUser(user: User | null | undefined): UserStatus | null {
  return getUserStatusFromMetadataContainer(user);
}

export async function getRoleFromCurrentSession(
  supabase: SupabaseClient,
): Promise<AppRole | null> {
  const { role } = await getCurrentSessionContext(supabase);
  return role;
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

function getSessionCache(supabase: SupabaseClient) {
  const existingCache = sessionCacheByClient.get(supabase);

  if (existingCache) {
    if (existingCache.resetVersion !== sessionCacheResetVersion) {
      existingCache.sessionTrackingCleanup?.();
      existingCache.currentClaimsRequest = null;
      existingCache.currentClaimsSnapshot = undefined;
      existingCache.currentSessionRequest = null;
      existingCache.currentSessionSnapshot = undefined;
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
    sessionTrackingCleanup: null,
    sessionTrackingReady: false,
    resetVersion: sessionCacheResetVersion,
  };

  sessionCacheByClient.set(supabase, sessionCache);
  return sessionCache;
}

export async function getCurrentSessionContext(
  supabase: SupabaseClient,
): Promise<{
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  status: UserStatus | null;
}> {
  const session = await getCurrentSession(supabase);
  const user = session?.user ?? null;
  const claims = user ? await getCurrentClaims(supabase) : null;

  return {
    session,
    user,
    role: getAppRoleFromClaims(claims) ?? getRoleFromUser(user),
    status: getUserStatusFromClaims(claims) ?? getStatusFromUser(user),
  };
}

export function getDefaultSignedInPath() {
  return getDefaultSignedInPathForRole(null);
}

export async function getCurrentUserBundle(
  supabase: SupabaseClient,
): Promise<CurrentUserBundle | null> {
  const { user, role } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  const [profileResult, privacyDataResult, privacyRequestsResult, vipResult, mediaResult] =
    await withRequestTimeout(
      Promise.all([
        supabase
          .from("user_profiles")
          .select("user_id,name,phone,email,status,city,referral_code,created_at")
          .eq("user_id", user.id)
          .maybeSingle<UserProfileRow>(),
        supabase
          .from("user_privacy_data")
          .select("user_id,passport,id_card")
          .eq("user_id", user.id)
          .maybeSingle<UserPrivacyDataRow>(),
        supabase
          .from("user_privacy_requests")
          .select(
            "id,user_id,passport_requests,id_card_requests,status,reviewer_user_id,created_at,review_at,type",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .returns<UserPrivacyRequestRow[]>(),
        supabase
          .from("user_vip_membership")
          .select(
            "user_id,status,started_at,expires_at,first_paid_order_overview_id,latest_paid_order_overview_id",
          )
          .eq("user_id", user.id)
          .maybeSingle<UserVipMembershipRow>(),
        supabase
          .from("user_media_assets")
          .select(
            "id,user_id,kind,bucket_name,storage_path,original_name,mime_type,file_size_bytes,status,reviewer_user_id,created_at,reviewed_at,purge_after",
          )
          .eq("user_id", user.id)
          .neq("status", "denied")
          .order("created_at", { ascending: false })
          .returns<UserMediaAssetRow[]>(),
      ]),
    );

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (privacyDataResult.error) {
    throw privacyDataResult.error;
  }

  if (privacyRequestsResult.error) {
    throw privacyRequestsResult.error;
  }

  if (vipResult.error) {
    throw vipResult.error;
  }

  if (mediaResult.error) {
    throw mediaResult.error;
  }

  const syncedProfile = await syncProfileFromAuthMetadataIfPossible(
    supabase,
    user,
    profileResult.data,
    role,
  );

  const mediaAssets = await withRequestTimeout(
    mapWithConcurrencyLimit(
      mediaResult.data ?? [],
      SIGNED_URL_CONCURRENCY,
      async (asset) => {
        const { data, error } = await supabase.storage
          .from(asset.bucket_name)
          .createSignedUrl(asset.storage_path, SIGNED_URL_TTL_SECONDS);

        return {
          ...asset,
          previewUrl: error ? null : (data?.signedUrl ?? null),
        } satisfies UserMediaAssetWithPreview;
      },
    ),
  );

  return {
    authUser: user,
    role,
    profile: syncedProfile,
    privacyData: privacyDataResult.data,
    privacyRequests: privacyRequestsResult.data ?? [],
    mediaAssets,
    vipMembership: vipResult.data,
  };
}

export async function createPrivacyRequest(
  supabase: SupabaseClient,
  options: {
    field: "id_card" | "passport";
    userId: string;
    value: string;
  },
) {
  const payload =
    options.field === "id_card"
      ? { user_id: options.userId, id_card_requests: options.value.trim() }
      : { user_id: options.userId, passport_requests: options.value.trim() };

  const { error } = await withRequestTimeout(
    supabase.from("user_privacy_requests").insert(payload),
    {
      timeoutMs: PROFILE_MUTATION_TIMEOUT_MS,
      message: PROFILE_MUTATION_TIMEOUT_MESSAGE,
    },
  );

  if (error) {
    throw error;
  }
}

export async function uploadUserMedia(
  supabase: SupabaseClient,
  options: {
    userId: string;
    kind: MediaKind;
    files: File[];
  },
) {
  if (options.files.length === 0) {
    return;
  }

  const formData = new FormData();
  formData.set("action", "upload");
  formData.set("kind", options.kind);

  for (const file of options.files) {
    formData.append("files", file, file.name);
  }

  await invokeUserMediaMutation(supabase, formData);
}

export async function deleteUserMediaAssets(
  supabase: SupabaseClient,
  assets: Array<Pick<UserMediaAssetRow, "bucket_name" | "storage_path" | "id">>,
) {
  if (assets.length === 0) {
    return;
  }

  await invokeUserMediaMutation(supabase, {
    action: "delete",
    assetIds: assets.map((asset) => asset.id),
  });
}

export async function updateUserProfileCity(
  supabase: SupabaseClient,
  options: {
    userId: string;
    city: string;
  },
) {
  const normalizedCity = options.city.trim();

  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_profiles")
      .update({ city: normalizedCity })
      .eq("user_id", options.userId)
      .select("user_id,name,phone,email,status,city,referral_code,created_at")
      .maybeSingle<UserProfileRow>(),
    {
      timeoutMs: PROFILE_MUTATION_TIMEOUT_MS,
      message: PROFILE_MUTATION_TIMEOUT_MESSAGE,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

async function syncProfileFromAuthMetadataIfPossible(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfileRow | null,
  role: AppRole | null,
) {
  if (!profile) {
    return profile;
  }
  const metadataCity = normalizeOptionalString(user.user_metadata?.city);

  if (!metadataCity || profile.city) {
    return profile;
  }

  if (role !== "administrator" && profile.status !== "active") {
    return profile;
  }

  let data: UserProfileRow | null = null;
  let error: Error | null = null;

  try {
    const result = await withRequestTimeout(
      supabase
        .from("user_profiles")
        .update({ city: metadataCity })
        .eq("user_id", user.id)
        .select("user_id,name,phone,email,status,city,referral_code,created_at")
        .maybeSingle<UserProfileRow>(),
    );

    data = result.data;
    error = result.error;
  } catch {
    return profile;
  }

  if (error) {
    return profile;
  }

  return data ?? profile;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
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

async function getCurrentClaims(supabase: SupabaseClient): Promise<unknown | null> {
  const sessionCache = getSessionCache(supabase);

  ensureSessionTracking(supabase, sessionCache);

  const session = await getCurrentSession(supabase);

  if (!session?.access_token) {
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

function delay(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, timeoutMs);
  });
}

async function invokeUserMediaMutation(
  supabase: SupabaseClient,
  body: FormData | { action: "delete"; assetIds: string[] },
) {
  const { error } = await withRequestTimeout(
    supabase.functions.invoke("user-media-mutate", {
      body,
    }),
    {
      timeoutMs: USER_MEDIA_MUTATION_TIMEOUT_MS,
      message: USER_MEDIA_MUTATION_TIMEOUT_MESSAGE,
    },
  );

  if (!error) {
    return;
  }

  throw await toUserMediaMutationError(error);
}

async function toUserMediaMutationError(error: unknown) {
  const response = getFunctionErrorResponse(error);

  if (response) {
    try {
      const payload = (await response.clone().json()) as {
        error?: string;
        message?: string;
      };
      const message =
        normalizeOptionalString(payload.message) ??
        normalizeOptionalString(payload.error);

      if (message) {
        return new Error(message);
      }
    } catch {
      // Fall through to the original function client error.
    }
  }

  return error instanceof Error
    ? error
    : new Error("当前服务暂时不可用，请稍后再试。");
}

function getFunctionErrorResponse(error: unknown) {
  if (typeof error !== "object" || error === null || !("context" in error)) {
    return null;
  }

  const { context } = error as { context?: unknown };
  return context instanceof Response ? context : null;
}
