import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type MediaKind,
  type PrivacyRequestStatus,
  type UserMediaAssetRow,
  type UserPrivacyRequestRow,
} from "./user-self-service";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type PendingPrivacyReviewRow = {
  request_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  passport_requests: string | null;
  id_card_requests: string | null;
  status: PrivacyRequestStatus;
  type: boolean;
  created_at: string;
};

export type PendingMediaReviewRow = {
  asset_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  kind: MediaKind;
  bucket_name: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  status: PrivacyRequestStatus;
  created_at: string;
};

export type PendingMediaReviewWithPreview = PendingMediaReviewRow & {
  previewUrl: string | null;
};

export async function getCurrentReviewerContext(
  supabase: SupabaseClient,
): Promise<{ user: User; role: AppRole | null } | null> {
  const { user, role } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return {
    user,
    role,
  };
}

export async function getPendingPrivacyReviews(
  supabase: SupabaseClient,
): Promise<PendingPrivacyReviewRow[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("pending_user_privacy_requests")
      .select(
        "request_id,user_id,name,email,passport_requests,id_card_requests,status,type,created_at",
      )
      .order("created_at", { ascending: false })
      .returns<PendingPrivacyReviewRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPendingMediaReviews(
  supabase: SupabaseClient,
): Promise<PendingMediaReviewWithPreview[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("pending_user_media_assets")
      .select(
        "asset_id,user_id,name,email,kind,bucket_name,storage_path,original_name,mime_type,file_size_bytes,status,created_at",
      )
      .order("created_at", { ascending: false })
      .returns<PendingMediaReviewRow[]>(),
  );

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  return withRequestTimeout(
    Promise.all(
      rows.map(async (row) => {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(row.bucket_name)
          .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);

        return {
          ...row,
          previewUrl: signedUrlError ? null : (signedUrlData?.signedUrl ?? null),
        } satisfies PendingMediaReviewWithPreview;
      }),
    ),
  );
}

export async function approvePrivacyReview(
  supabase: SupabaseClient,
  requestId: string,
) {
  const { data, error } = await supabase.rpc("approve_user_privacy_request", {
    _request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return data as UserPrivacyRequestRow | null;
}

export async function rejectPrivacyReview(
  supabase: SupabaseClient,
  requestId: string,
) {
  const { data, error } = await supabase.rpc("deny_user_privacy_request", {
    _request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return data as UserPrivacyRequestRow | null;
}

export async function approveMediaReview(
  supabase: SupabaseClient,
  assetId: string,
) {
  const { data, error } = await supabase.rpc("approve_user_media_asset", {
    _asset_id: assetId,
  });

  if (error) {
    throw error;
  }

  return data as UserMediaAssetRow | null;
}

export async function rejectMediaReview(
  supabase: SupabaseClient,
  assetId: string,
) {
  const { data, error } = await supabase.rpc("deny_user_media_asset", {
    _asset_id: assetId,
  });

  if (error) {
    throw error;
  }

  return data as UserMediaAssetRow | null;
}
