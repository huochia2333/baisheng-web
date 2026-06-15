import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getDefaultSignedInPathForRole,
  getDefaultWorkspaceBasePath,
  type AppRole,
} from "./auth-routing";
import type { UserStatus } from "./auth-metadata";
import {
  getCurrentSessionContext,
  resetCurrentAuthContextCache,
} from "./current-session-context";
import { withRequestTimeout } from "./request-timeout";
import { normalizeOptionalString } from "./value-normalizers";

export { getDefaultSignedInPathForRole, getDefaultWorkspaceBasePath };
export {
  getCurrentSession,
  getCurrentSessionContext,
  getRoleFromUser,
  getStatusFromUser,
} from "./current-session-context";
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
const SIGNED_URL_CACHE_GRACE_MS = 30_000;
const USER_MEDIA_MUTATION_TIMEOUT_MS = 60_000;
const USER_MEDIA_MUTATION_TIMEOUT_MESSAGE = "媒体操作超时，请稍后重试。";

const PROFILE_MUTATION_TIMEOUT_MS = 20_000;
const PROFILE_MUTATION_TIMEOUT_MESSAGE = "Profile update timed out. Please try again.";

const userMediaPreviewUrlCache = new Map<
  string,
  {
    expiresAt: number;
    url: string | null;
  }
>();
const userMediaPreviewUrlRequestCache = new Map<string, Promise<string | null>>();

export function resetCurrentSessionCache() {
  resetCurrentAuthContextCache();
  userMediaPreviewUrlCache.clear();
  userMediaPreviewUrlRequestCache.clear();
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
          .order("expires_at", { ascending: false, nullsFirst: false })
          .limit(1)
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

  const mediaAssets = (mediaResult.data ?? []).map((asset) => ({
    ...asset,
    previewUrl: null,
  })) satisfies UserMediaAssetWithPreview[];

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

export async function createUserMediaAssetPreviewUrl(
  supabase: SupabaseClient,
  asset: Pick<UserMediaAssetRow, "bucket_name" | "storage_path"> & {
    previewUrl?: string | null;
  },
) {
  if (asset.previewUrl) {
    cacheUserMediaPreviewUrl(asset, asset.previewUrl);
    return asset.previewUrl;
  }

  const cacheKey = getUserMediaPreviewCacheKey(asset);
  const cachedPreviewUrl = getCachedUserMediaPreviewUrl(cacheKey);

  if (cachedPreviewUrl !== undefined) {
    return cachedPreviewUrl;
  }

  const pendingRequest = userMediaPreviewUrlRequestCache.get(cacheKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = supabase.storage
    .from(asset.bucket_name)
    .createSignedUrl(asset.storage_path, SIGNED_URL_TTL_SECONDS)
    .then(({ data, error }) => {
      const previewUrl = error ? null : (data?.signedUrl ?? null);
      cacheUserMediaPreviewUrl(asset, previewUrl);
      return previewUrl;
    })
    .catch(() => null)
    .finally(() => {
      userMediaPreviewUrlRequestCache.delete(cacheKey);
    });

  userMediaPreviewUrlRequestCache.set(cacheKey, request);
  return request;
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

function getUserMediaPreviewCacheKey(
  asset: Pick<UserMediaAssetRow, "bucket_name" | "storage_path">,
) {
  return `${asset.bucket_name}:${asset.storage_path}`;
}

function getCachedUserMediaPreviewUrl(cacheKey: string) {
  const cachedEntry = userMediaPreviewUrlCache.get(cacheKey);

  if (!cachedEntry) {
    return undefined;
  }

  if (Date.now() >= cachedEntry.expiresAt - SIGNED_URL_CACHE_GRACE_MS) {
    userMediaPreviewUrlCache.delete(cacheKey);
    return undefined;
  }

  return cachedEntry.url;
}

function cacheUserMediaPreviewUrl(
  asset: Pick<UserMediaAssetRow, "bucket_name" | "storage_path">,
  previewUrl: string | null,
) {
  userMediaPreviewUrlCache.set(getUserMediaPreviewCacheKey(asset), {
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    url: previewUrl,
  });
}
