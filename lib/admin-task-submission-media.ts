import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

const TASK_REVIEW_ASSET_SELECT =
  "id,submission_id,task_attachment_storage_path,file_size_bytes,original_name,bucket_name,mime_type,uploaded_by_user_id,created_at";

type TaskReviewSubmissionRecord = {
  id: string | null;
  task_id: string | null;
  round_index: number | string | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type TaskReviewSubmissionAssetRecord = {
  id: string | null;
  submission_id: string | null;
  task_attachment_storage_path: string | null;
  file_size_bytes: number | string | null;
  original_name: string | null;
  bucket_name: string | null;
  mime_type: string | null;
  uploaded_by_user_id: string | null;
  created_at: string | null;
};

export type AdminTaskSubmissionMediaKind = "image" | "video";

export type AdminTaskSubmissionMedia = {
  id: string;
  task_id: string;
  submission_id: string;
  submission_round: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  task_attachment_storage_path: string;
  file_size_bytes: number;
  original_name: string;
  bucket_name: string;
  mime_type: string;
  uploaded_by_user_id: string;
  created_at: string | null;
  kind: AdminTaskSubmissionMediaKind;
};

export async function getCompletedTaskSubmissionMediaByTaskIds(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<AdminTaskSubmissionMedia[]> {
  const normalizedTaskIds = Array.from(
    new Set(taskIds.map((taskId) => normalizeOptionalString(taskId)).filter(Boolean)),
  ) as string[];

  if (normalizedTaskIds.length === 0) {
    return [];
  }

  const { data: submissionsData, error: submissionsError } = await withRequestTimeout(
    supabase
      .from("task_review_submissions")
      .select("id,task_id,round_index,status,submitted_at,reviewed_at")
      .in("task_id", normalizedTaskIds)
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .returns<TaskReviewSubmissionRecord[]>(),
  );

  if (submissionsError) {
    throw submissionsError;
  }

  const submissionById = new Map<string, NormalizedTaskReviewSubmission>();

  for (const item of submissionsData ?? []) {
    const submission = normalizeTaskReviewSubmissionRecord(item);

    if (submission) {
      submissionById.set(submission.id, submission);
    }
  }

  if (submissionById.size === 0) {
    return [];
  }

  const { data: assetsData, error: assetsError } = await withRequestTimeout(
    supabase
      .from("task_review_submission_assets")
      .select(TASK_REVIEW_ASSET_SELECT)
      .in("submission_id", Array.from(submissionById.keys()))
      .order("created_at", { ascending: true })
      .returns<TaskReviewSubmissionAssetRecord[]>(),
  );

  if (assetsError) {
    throw assetsError;
  }

  return (assetsData ?? [])
    .map((asset) => normalizeSubmissionMediaRecord(asset, submissionById))
    .filter((asset): asset is AdminTaskSubmissionMedia => asset !== null);
}

export async function getAdminTaskSubmissionMediaSignedUrl(
  supabase: SupabaseClient,
  media: Pick<AdminTaskSubmissionMedia, "bucket_name" | "task_attachment_storage_path">,
  expiresIn = 60 * 10,
) {
  const { data, error } = await withRequestTimeout(
    supabase.storage
      .from(media.bucket_name)
      .createSignedUrl(media.task_attachment_storage_path, expiresIn),
  );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function downloadAdminTaskSubmissionMediaBlob(
  supabase: SupabaseClient,
  media: Pick<AdminTaskSubmissionMedia, "bucket_name" | "task_attachment_storage_path">,
) {
  const { data, error } = await withRequestTimeout(
    supabase.storage
      .from(media.bucket_name)
      .download(media.task_attachment_storage_path),
    {
      timeoutMs: 60_000,
      message: "task_submission_media_download_timeout",
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

type NormalizedTaskReviewSubmission = {
  id: string;
  task_id: string;
  round_index: number;
  submitted_at: string | null;
  reviewed_at: string | null;
};

function normalizeTaskReviewSubmissionRecord(
  value: TaskReviewSubmissionRecord,
): NormalizedTaskReviewSubmission | null {
  const id = normalizeOptionalString(value.id);
  const taskId = normalizeOptionalString(value.task_id);
  const roundIndex = normalizeInteger(value.round_index);

  if (!id || !taskId || !roundIndex || value.status !== "approved") {
    return null;
  }

  return {
    id,
    task_id: taskId,
    round_index: roundIndex,
    submitted_at: normalizeOptionalString(value.submitted_at),
    reviewed_at: normalizeOptionalString(value.reviewed_at),
  };
}

function normalizeSubmissionMediaRecord(
  value: TaskReviewSubmissionAssetRecord,
  submissionById: Map<string, NormalizedTaskReviewSubmission>,
): AdminTaskSubmissionMedia | null {
  const id = normalizeOptionalString(value.id);
  const submissionId = normalizeOptionalString(value.submission_id);
  const storagePath = normalizeOptionalString(value.task_attachment_storage_path);
  const originalName = normalizeOptionalString(value.original_name);
  const bucketName = normalizeOptionalString(value.bucket_name);
  const mimeType = normalizeOptionalString(value.mime_type);
  const uploadedByUserId = normalizeOptionalString(value.uploaded_by_user_id);
  const fileSizeBytes = normalizeNonnegativeNumber(value.file_size_bytes);
  const kind = mimeType ? getMediaKind(mimeType) : null;
  const submission = submissionId ? submissionById.get(submissionId) : null;

  if (
    !id ||
    !submissionId ||
    !storagePath ||
    !originalName ||
    !bucketName ||
    !mimeType ||
    !uploadedByUserId ||
    fileSizeBytes === null ||
    !kind ||
    !submission
  ) {
    return null;
  }

  return {
    id,
    task_id: submission.task_id,
    submission_id: submissionId,
    submission_round: submission.round_index,
    submitted_at: submission.submitted_at,
    reviewed_at: submission.reviewed_at,
    task_attachment_storage_path: storagePath,
    file_size_bytes: fileSizeBytes,
    original_name: originalName,
    bucket_name: bucketName,
    mime_type: mimeType,
    uploaded_by_user_id: uploadedByUserId,
    created_at: normalizeOptionalString(value.created_at),
    kind,
  };
}

function getMediaKind(mimeType: string): AdminTaskSubmissionMediaKind | null {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("video/")) {
    return "video";
  }

  return null;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeNonnegativeNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
