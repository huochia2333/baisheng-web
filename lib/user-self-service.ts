import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

export type AppRole =
  | "administrator"
  | "operator"
  | "manager"
  | "recruiter"
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
const AUTH_SESSION_TIMEOUT_MS = 8_000;
const AUTH_SESSION_RETRY_DELAY_MS = 350;
const AUTH_SESSION_TIMEOUT_MESSAGE = "登录状态同步较慢，请稍后重试。";
const USER_MEDIA_MUTATION_TIMEOUT_MS = 60_000;
const USER_MEDIA_MUTATION_TIMEOUT_MESSAGE = "媒体操作超时，请稍后重试。";

let currentSessionRequest: Promise<Session | null> | null = null;
let currentSessionSnapshot: Session | null | undefined;
let sessionTrackingReady = false;

export function resetCurrentSessionCache() {
  currentSessionRequest = null;
  currentSessionSnapshot = undefined;
  sessionTrackingReady = false;
}

export function getRoleFromUser(user: User | null | undefined): AppRole | null {
  const role = normalizeOptionalString(user?.app_metadata?.role);

  if (
    role === "administrator" ||
    role === "operator" ||
    role === "manager" ||
    role === "recruiter" ||
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
  ensureSessionTracking(supabase);

  if (currentSessionSnapshot !== undefined) {
    return currentSessionSnapshot;
  }

  if (!currentSessionRequest) {
    currentSessionRequest = resolveCurrentSession(supabase).finally(() => {
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
  status: UserStatus | null;
}> {
  const session = await getCurrentSession(supabase);

  return {
    session,
    user: session?.user ?? null,
    role: getRoleFromAccessToken(session?.access_token),
    status: getStatusFromAccessToken(session?.access_token),
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
    role === "recruiter" ||
    role === "salesman" ||
    role === "finance" ||
    role === "client"
  ) {
    return role;
  }

  return null;
}

export function getStatusFromAccessToken(
  accessToken: string | null | undefined,
): UserStatus | null {
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const appMetadata =
    typeof payload === "object" && payload !== null && "app_metadata" in payload
      ? payload.app_metadata
      : null;

  const status =
    typeof appMetadata === "object" && appMetadata !== null && "status" in appMetadata
      ? normalizeOptionalString(appMetadata.status)
      : null;

  if (status === "inactive" || status === "active" || status === "suspended") {
    return status;
  }

  return null;
}

export function getDefaultSignedInPath() {
  return getDefaultSignedInPathForRole(null);
}

export function getDefaultWorkspaceBasePath(role: AppRole | null) {
  if (role === "manager") {
    return "/manager";
  }

  if (role === "recruiter") {
    return "/recruiter";
  }

  if (role === "salesman") {
    return "/salesman";
  }

  if (role === "operator") {
    return "/operator";
  }

  if (role === "finance") {
    return "/finance";
  }

  if (role === "client") {
    return "/client";
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
    Promise.all(
      (mediaResult.data ?? []).map(async (asset) => {
        const { data, error } = await supabase.storage
          .from(asset.bucket_name)
          .createSignedUrl(asset.storage_path, SIGNED_URL_TTL_SECONDS);

        return {
          ...asset,
          previewUrl: error ? null : (data?.signedUrl ?? null),
        } satisfies UserMediaAssetWithPreview;
      }),
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

async function resolveCurrentSession(supabase: SupabaseClient) {
  try {
    const session = await withRequestTimeout(
      fetchCurrentSession(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    currentSessionSnapshot = session;
    return session;
  } catch (error) {
    if (currentSessionSnapshot !== undefined) {
      return currentSessionSnapshot;
    }

    if (!isSessionTimeoutError(error)) {
      throw error;
    }

    await delay(AUTH_SESSION_RETRY_DELAY_MS);

    if (currentSessionSnapshot !== undefined) {
      return currentSessionSnapshot;
    }

    const retriedSession = await withRequestTimeout(
      fetchCurrentSession(supabase),
      {
        timeoutMs: AUTH_SESSION_TIMEOUT_MS,
        message: AUTH_SESSION_TIMEOUT_MESSAGE,
      },
    );

    currentSessionSnapshot = retriedSession;
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

function ensureSessionTracking(supabase: SupabaseClient) {
  if (sessionTrackingReady) {
    return;
  }

  sessionTrackingReady = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSessionSnapshot = session;
  });
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
