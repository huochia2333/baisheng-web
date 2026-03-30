import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export type AppRole =
  | "administrator"
  | "operator"
  | "manager"
  | "salesman"
  | "finance"
  | "client";

export type UserStatus = "inactive" | "active" | "suspended";
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

export type UserVipDataRow = {
  user_id: string;
  status: boolean;
  category: string | null;
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
  vipData: UserVipDataRow | null;
};

const USER_MEDIA_BUCKET = "user-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const AUTH_SESSION_TIMEOUT_MS = 15_000;

let currentSessionRequest: Promise<Session | null> | null = null;

export function getRoleFromUser(user: User | null | undefined): AppRole | null {
  const role = normalizeOptionalString(user?.app_metadata?.role);

  if (
    role === "administrator" ||
    role === "operator" ||
    role === "manager" ||
    role === "salesman" ||
    role === "finance" ||
    role === "client"
  ) {
    return role;
  }

  return null;
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
  if (!currentSessionRequest) {
    currentSessionRequest = withTimeout(
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          throw error;
        }

        return data.session;
      }),
      AUTH_SESSION_TIMEOUT_MS,
      "登录状态检查超时，请刷新页面后重试。",
    ).finally(() => {
      currentSessionRequest = null;
    });
  }

  return currentSessionRequest;
}

export async function getCurrentSessionContext(
  supabase: SupabaseClient,
): Promise<{
  session: Session | null;
  user: User | null;
  role: AppRole | null;
}> {
  const session = await getCurrentSession(supabase);

  return {
    session,
    user: session?.user ?? null,
    role: getRoleFromAccessToken(session?.access_token),
  };
}

export function getRoleFromAccessToken(accessToken: string | null | undefined): AppRole | null {
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const appMetadata =
    typeof payload === "object" && payload !== null && "app_metadata" in payload
      ? payload.app_metadata
      : null;

  const role =
    typeof appMetadata === "object" && appMetadata !== null && "role" in appMetadata
      ? normalizeOptionalString(appMetadata.role)
      : null;

  if (
    role === "administrator" ||
    role === "operator" ||
    role === "manager" ||
    role === "salesman" ||
    role === "finance" ||
    role === "client"
  ) {
    return role;
  }

  return null;
}

export function getDefaultSignedInPath() {
  return getDefaultSignedInPathForRole(null);
}

export function getDefaultWorkspaceBasePath(role: AppRole | null) {
  if (role === "salesman") {
    return "/salesman";
  }

  return "/admin";
}

export function getDefaultSignedInPathForRole(role: AppRole | null) {
  return `${getDefaultWorkspaceBasePath(role)}/my`;
}

export async function getCurrentUserBundle(
  supabase: SupabaseClient,
): Promise<CurrentUserBundle | null> {
  const { user, role } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  const [profileResult, privacyDataResult, privacyRequestsResult, vipResult, mediaResult] =
    await Promise.all([
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
        .from("user_vip_data")
        .select("user_id,status,category")
        .eq("user_id", user.id)
        .maybeSingle<UserVipDataRow>(),
      supabase
        .from("user_media_assets")
        .select(
          "id,user_id,kind,bucket_name,storage_path,original_name,mime_type,file_size_bytes,status,reviewer_user_id,created_at,reviewed_at,purge_after",
        )
        .eq("user_id", user.id)
        .neq("status", "denied")
        .order("created_at", { ascending: false })
        .returns<UserMediaAssetRow[]>(),
    ]);

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

  const mediaAssets = await Promise.all(
    (mediaResult.data ?? []).map(async (asset) => {
      const { data, error } = await supabase.storage
        .from(asset.bucket_name)
        .createSignedUrl(asset.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        ...asset,
        previewUrl: error ? null : (data?.signedUrl ?? null),
      } satisfies UserMediaAssetWithPreview;
    }),
  );

  return {
    authUser: user,
    role,
    profile: syncedProfile,
    privacyData: privacyDataResult.data,
    privacyRequests: privacyRequestsResult.data ?? [],
    mediaAssets,
    vipData: vipResult.data,
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

  const { error } = await supabase.from("user_privacy_requests").insert(payload);

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
  for (const file of options.files) {
    const path = buildUserMediaPath(options.userId, options.kind, file.name);
    const mimeType =
      normalizeOptionalString(file.type) ??
      (options.kind === "image" ? "image/*" : "video/*");

    const { error: uploadError } = await supabase.storage
      .from(USER_MEDIA_BUCKET)
      .upload(path, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: insertError } = await supabase.from("user_media_assets").insert({
      user_id: options.userId,
      kind: options.kind,
      bucket_name: USER_MEDIA_BUCKET,
      storage_path: path,
      original_name: file.name,
      mime_type: mimeType,
      file_size_bytes: file.size,
    });

    if (insertError) {
      await supabase.storage.from(USER_MEDIA_BUCKET).remove([path]);
      throw insertError;
    }
  }
}

export async function deleteUserMediaAssets(
  supabase: SupabaseClient,
  assets: Array<Pick<UserMediaAssetRow, "bucket_name" | "storage_path" | "id">>,
) {
  for (const asset of assets) {
    const { error: storageError } = await supabase.storage
      .from(asset.bucket_name)
      .remove([asset.storage_path]);

    if (storageError) {
      throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("user_media_assets")
      .delete()
      .eq("id", asset.id);

    if (deleteError) {
      throw deleteError;
    }
  }
}

export async function updateUserProfileCity(
  supabase: SupabaseClient,
  options: {
    userId: string;
    city: string;
  },
) {
  const normalizedCity = options.city.trim();

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ city: normalizedCity })
    .eq("user_id", options.userId)
    .select("user_id,name,phone,email,status,city,referral_code,created_at")
    .maybeSingle<UserProfileRow>();

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

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ city: metadataCity })
    .eq("user_id", user.id)
    .select("user_id,name,phone,email,status,city,referral_code,created_at")
    .maybeSingle<UserProfileRow>();

  if (error) {
    return profile;
  }

  return data ?? profile;
}

function buildUserMediaPath(userId: string, kind: MediaKind, originalName: string) {
  const safeFileName = sanitizeFileName(originalName);
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${userId}/${kind}/${suffix}-${safeFileName}`;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^-+/, "")
    .slice(0, 120);
}

function decodeJwtPayload(accessToken: string) {
  const segments = accessToken.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(atob(normalizeBase64Url(segments[1])));
  } catch {
    return null;
  }
}

function normalizeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;

  if (padding === 0) {
    return base64;
  }

  return `${base64}${"=".repeat(4 - padding)}`;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(resolve, reject).finally(() => {
      globalThis.clearTimeout(timeoutId);
    });
  });
}
