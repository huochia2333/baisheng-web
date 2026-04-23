import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

const TASK_REVIEW_BUCKET = "task-review-submissions";
const TASK_REVIEW_ASSET_SELECT =
  "id,submission_id,task_attachment_storage_path,file_size_bytes,original_name,bucket_name,mime_type,uploaded_by_user_id,created_at";
const PENDING_TASK_REVIEW_SELECT =
  "task_id,task_name,task_intro,task_type_code,task_type_name,commission_amount_rmb,scope,team_id,team_name,accepted_by_user_id,accepted_by_name,accepted_by_email,submission_id,submission_round,submission_note,submitted_at,asset_count";

export const TASK_REVIEW_SUBMISSION_MAX_FILES = 10;
export const TASK_REVIEW_SUBMISSION_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const TASK_REVIEW_SUBMISSION_MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;

const TASK_REVIEW_ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "text/"];
const TASK_REVIEW_ALLOWED_MIME_TYPES = new Set([
  "application/json",
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/x-zip-compressed",
  "application/zip",
]);
const TASK_REVIEW_ALLOWED_EXTENSIONS = new Set([
  "7z",
  "avi",
  "csv",
  "doc",
  "docx",
  "gif",
  "jpeg",
  "jpg",
  "json",
  "m4a",
  "mkv",
  "mov",
  "mp3",
  "mp4",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "rar",
  "txt",
  "wav",
  "webm",
  "webp",
  "xls",
  "xlsx",
  "zip",
]);

export type TaskReviewSubmissionStatus = "draft" | "pending" | "approved" | "rejected";

export type TaskReviewSubmissionRow = {
  id: string;
  task_id: string;
  submitted_by_user_id: string;
  round_index: number;
  submission_note: string | null;
  status: TaskReviewSubmissionStatus;
  reviewer_user_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string | null;
};

export type TaskReviewSubmissionAsset = {
  id: string;
  submission_id: string;
  task_attachment_storage_path: string;
  file_size_bytes: number;
  original_name: string;
  bucket_name: string;
  mime_type: string;
  uploaded_by_user_id: string;
  created_at: string | null;
};

export type PendingTaskReviewRow = {
  task_id: string;
  task_name: string;
  task_intro: string | null;
  task_type_code: string;
  task_type_name: string | null;
  commission_amount_rmb: number;
  scope: "public" | "team";
  team_id: string | null;
  team_name: string | null;
  accepted_by_user_id: string;
  accepted_by_name: string | null;
  accepted_by_email: string | null;
  submission_id: string;
  submission_round: number;
  submission_note: string | null;
  submitted_at: string | null;
  asset_count: number;
};

export type PendingTaskReviewWithAssets = PendingTaskReviewRow & {
  assets: TaskReviewSubmissionAsset[];
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

type PendingTaskReviewRecord = {
  task_id: string | null;
  task_name: string | null;
  task_intro: string | null;
  task_type_code: string | null;
  task_type_name: string | null;
  commission_amount_rmb: number | string | null;
  scope: "public" | "team" | null;
  team_id: string | null;
  team_name: string | null;
  accepted_by_user_id: string | null;
  accepted_by_name: string | null;
  accepted_by_email: string | null;
  submission_id: string | null;
  submission_round: number | string | null;
  submission_note: string | null;
  submitted_at: string | null;
  asset_count: number | string | null;
};

export async function createTaskReviewSubmissionDraft(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    submissionNote?: string | null;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("create_task_review_submission", {
      p_task_id: options.taskId,
      p_submission_note: normalizeOptionalString(options.submissionNote),
    }),
  );

  if (error) {
    throw error;
  }

  const submission = normalizeTaskReviewSubmissionRecord(data);

  if (!submission) {
    throw new Error("任务审核提交草稿创建成功，但返回数据不完整。");
  }

  return submission;
}

export async function cancelTaskReviewSubmissionDraft(
  supabase: SupabaseClient,
  submissionId: string,
) {
  const { error } = await withRequestTimeout(
    supabase.rpc("cancel_task_review_submission", {
      p_submission_id: submissionId,
    }),
  );

  if (error) {
    throw error;
  }
}

export async function submitTaskReview(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    submissionId: string;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("submit_task_review", {
      p_task_id: options.taskId,
      p_submission_id: options.submissionId,
    }),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function approveTaskReview(
  supabase: SupabaseClient,
  taskId: string,
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("approve_task_review", {
      p_task_id: taskId,
    }),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectTaskReview(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    reason?: string | null;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("reject_task_review", {
      p_task_id: options.taskId,
      p_reason: normalizeOptionalString(options.reason),
    }),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadTaskReviewSubmissionAssets(
  supabase: SupabaseClient,
  options: {
    submissionId: string;
    uploadedByUserId: string;
    files: File[];
  },
) {
  if (options.files.length === 0) {
    return [];
  }

  validateTaskReviewSubmissionFiles(options.files);

  const uploadedObjects: Array<Pick<TaskReviewSubmissionAsset, "bucket_name" | "task_attachment_storage_path">> = [];

  try {
    for (const [index, file] of options.files.entries()) {
      const storagePath = buildTaskReviewStoragePath(
        options.uploadedByUserId,
        options.submissionId,
        file.name,
        index,
      );

      const { error } = await withRequestTimeout(
        supabase.storage.from(TASK_REVIEW_BUCKET).upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        }),
        {
          timeoutMs: 60_000,
          message: "任务审核附件上传超时，请稍后重试。",
        },
      );

      if (error) {
        throw error;
      }

      uploadedObjects.push({
        bucket_name: TASK_REVIEW_BUCKET,
        task_attachment_storage_path: storagePath,
      });
    }

    const metadataRows = options.files.map((file, index) => ({
      submission_id: options.submissionId,
      task_attachment_storage_path: uploadedObjects[index]?.task_attachment_storage_path ?? "",
      file_size_bytes: file.size,
      original_name: file.name,
      bucket_name: TASK_REVIEW_BUCKET,
      mime_type: file.type || "application/octet-stream",
      uploaded_by_user_id: options.uploadedByUserId,
    }));

    const { data, error } = await withRequestTimeout(
      supabase
        .from("task_review_submission_assets")
        .insert(metadataRows)
        .select(TASK_REVIEW_ASSET_SELECT)
        .returns<TaskReviewSubmissionAssetRecord[]>(),
    );

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((item) => normalizeTaskReviewSubmissionAssetRecord(item))
      .filter((item): item is TaskReviewSubmissionAsset => item !== null);
  } catch (error) {
    await removeStoredTaskReviewSubmissionAssets(supabase, uploadedObjects);
    throw error;
  }
}

export async function removeStoredTaskReviewSubmissionAssets(
  supabase: SupabaseClient,
  assets: Pick<TaskReviewSubmissionAsset, "bucket_name" | "task_attachment_storage_path">[],
) {
  if (assets.length === 0) {
    return;
  }

  const pathsByBucket = new Map<string, string[]>();

  assets.forEach((asset) => {
    const bucketName = normalizeOptionalString(asset.bucket_name) ?? TASK_REVIEW_BUCKET;
    const storagePath = normalizeOptionalString(asset.task_attachment_storage_path);

    if (!storagePath) {
      return;
    }

    const paths = pathsByBucket.get(bucketName);

    if (paths) {
      paths.push(storagePath);
      return;
    }

    pathsByBucket.set(bucketName, [storagePath]);
  });

  for (const [bucketName, storagePaths] of pathsByBucket.entries()) {
    if (storagePaths.length === 0) {
      continue;
    }

    const { error } = await withRequestTimeout(
      supabase.storage.from(bucketName).remove(storagePaths),
      {
        timeoutMs: 60_000,
        message: "任务审核附件删除超时，请稍后重试。",
      },
    );

    if (error) {
      throw error;
    }
  }
}

export async function getPendingTaskReviews(
  supabase: SupabaseClient,
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("pending_task_reviews")
      .select(PENDING_TASK_REVIEW_SELECT)
      .order("submitted_at", { ascending: false })
      .returns<PendingTaskReviewRecord[]>(),
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? [])
    .map((item) => normalizePendingTaskReviewRecord(item))
    .filter((item): item is PendingTaskReviewRow => item !== null);

  if (rows.length === 0) {
    return [];
  }

  const submissionIds = rows.map((row) => row.submission_id);
  const assets = await getTaskReviewSubmissionAssets(supabase, submissionIds);
  const assetsBySubmissionId = new Map<string, TaskReviewSubmissionAsset[]>();

  assets.forEach((asset) => {
    const bucket = assetsBySubmissionId.get(asset.submission_id);

    if (bucket) {
      bucket.push(asset);
      return;
    }

    assetsBySubmissionId.set(asset.submission_id, [asset]);
  });

  return rows.map((row) => ({
    ...row,
    assets: assetsBySubmissionId.get(row.submission_id) ?? [],
  }));
}

export async function getTaskReviewSubmissionAssetSignedUrl(
  supabase: SupabaseClient,
  asset: Pick<TaskReviewSubmissionAsset, "bucket_name" | "task_attachment_storage_path">,
  expiresIn = 60 * 10,
) {
  const { data, error } = await withRequestTimeout(
    supabase.storage
      .from(asset.bucket_name)
      .createSignedUrl(asset.task_attachment_storage_path, expiresIn),
  );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function validateTaskReviewSubmissionFiles(files: File[]) {
  if (files.length === 0) {
    throw new Error("task_review_submission_files_required");
  }

  if (files.length > TASK_REVIEW_SUBMISSION_MAX_FILES) {
    throw new Error("task_review_submission_attachments_count_exceeded");
  }

  let totalSizeBytes = 0;

  for (const file of files) {
    totalSizeBytes += file.size;

    if (file.size <= 0) {
      throw new Error("task_review_submission_attachment_empty");
    }

    if (file.size > TASK_REVIEW_SUBMISSION_MAX_FILE_SIZE_BYTES) {
      throw new Error("task_review_submission_attachment_too_large");
    }

    if (!isAllowedTaskReviewFile(file)) {
      throw new Error("task_review_submission_attachment_type_not_allowed");
    }
  }

  if (totalSizeBytes > TASK_REVIEW_SUBMISSION_MAX_TOTAL_SIZE_BYTES) {
    throw new Error("task_review_submission_attachments_total_too_large");
  }
}

async function getTaskReviewSubmissionAssets(
  supabase: SupabaseClient,
  submissionIds: string[],
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_review_submission_assets")
      .select(TASK_REVIEW_ASSET_SELECT)
      .in("submission_id", submissionIds)
      .order("created_at", { ascending: true })
      .returns<TaskReviewSubmissionAssetRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskReviewSubmissionAssetRecord(item))
    .filter((item): item is TaskReviewSubmissionAsset => item !== null);
}

function buildTaskReviewStoragePath(
  uploadedByUserId: string,
  submissionId: string,
  originalName: string,
  index: number,
) {
  const safeName = sanitizeFileName(originalName) || `submission-${index + 1}`;
  const uniqueKey =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${index + 1}`;

  return `${uploadedByUserId}/${submissionId}/${uniqueKey}-${safeName}`;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");
}

function isAllowedTaskReviewFile(file: File) {
  const normalizedType = file.type.trim().toLowerCase();

  if (normalizedType) {
    if (
      TASK_REVIEW_ALLOWED_MIME_PREFIXES.some((prefix) =>
        normalizedType.startsWith(prefix),
      )
    ) {
      return true;
    }

    if (TASK_REVIEW_ALLOWED_MIME_TYPES.has(normalizedType)) {
      return true;
    }
  }

  const extension = getFileExtension(file.name);
  return extension ? TASK_REVIEW_ALLOWED_EXTENSIONS.has(extension) : false;
}

function getFileExtension(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();
  const extensionIndex = normalizedName.lastIndexOf(".");

  if (extensionIndex < 0 || extensionIndex === normalizedName.length - 1) {
    return null;
  }

  return normalizedName.slice(extensionIndex + 1);
}

function normalizeTaskReviewSubmissionRecord(
  value: unknown,
): TaskReviewSubmissionRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeOptionalString(value.id) : null;
  const taskId = "task_id" in value ? normalizeOptionalString(value.task_id) : null;
  const submittedByUserId =
    "submitted_by_user_id" in value
      ? normalizeOptionalString(value.submitted_by_user_id)
      : null;
  const roundIndex =
    "round_index" in value ? normalizeInteger(value.round_index) : null;
  const status =
    "status" in value ? normalizeTaskReviewSubmissionStatus(value.status) : null;

  if (!id || !taskId || !submittedByUserId || !roundIndex || !status) {
    return null;
  }

  return {
    id,
    task_id: taskId,
    submitted_by_user_id: submittedByUserId,
    round_index: roundIndex,
    submission_note:
      "submission_note" in value ? normalizeOptionalString(value.submission_note) : null,
    status,
    reviewer_user_id:
      "reviewer_user_id" in value ? normalizeOptionalString(value.reviewer_user_id) : null,
    submitted_at: "submitted_at" in value ? normalizeOptionalString(value.submitted_at) : null,
    reviewed_at: "reviewed_at" in value ? normalizeOptionalString(value.reviewed_at) : null,
    reject_reason:
      "reject_reason" in value ? normalizeOptionalString(value.reject_reason) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
  };
}

function normalizeTaskReviewSubmissionAssetRecord(
  value: unknown,
): TaskReviewSubmissionAsset | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeOptionalString(value.id) : null;
  const submissionId =
    "submission_id" in value ? normalizeOptionalString(value.submission_id) : null;
  const storagePath =
    "task_attachment_storage_path" in value
      ? normalizeOptionalString(value.task_attachment_storage_path)
      : null;
  const originalName =
    "original_name" in value ? normalizeOptionalString(value.original_name) : null;
  const bucketName = "bucket_name" in value ? normalizeOptionalString(value.bucket_name) : null;
  const mimeType = "mime_type" in value ? normalizeOptionalString(value.mime_type) : null;
  const uploadedByUserId =
    "uploaded_by_user_id" in value
      ? normalizeOptionalString(value.uploaded_by_user_id)
      : null;

  if (!id || !submissionId || !storagePath || !originalName || !bucketName || !mimeType) {
    return null;
  }

  return {
    id,
    submission_id: submissionId,
    task_attachment_storage_path: storagePath,
    file_size_bytes:
      "file_size_bytes" in value ? normalizeInteger(value.file_size_bytes) : 0,
    original_name: originalName,
    bucket_name: bucketName,
    mime_type: mimeType,
    uploaded_by_user_id: uploadedByUserId ?? "",
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
  };
}

function normalizePendingTaskReviewRecord(
  value: unknown,
): PendingTaskReviewRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const taskId = "task_id" in value ? normalizeOptionalString(value.task_id) : null;
  const taskName = "task_name" in value ? normalizeOptionalString(value.task_name) : null;
  const taskTypeCode =
    "task_type_code" in value ? normalizeOptionalString(value.task_type_code) : null;
  const acceptedByUserId =
    "accepted_by_user_id" in value
      ? normalizeOptionalString(value.accepted_by_user_id)
      : null;
  const submissionId =
    "submission_id" in value ? normalizeOptionalString(value.submission_id) : null;
  const submissionRound =
    "submission_round" in value ? normalizeInteger(value.submission_round) : null;
  const scope = "scope" in value ? normalizeTaskScope(value.scope) : null;

  if (
    !taskId
    || !taskName
    || !taskTypeCode
    || !acceptedByUserId
    || !submissionId
    || !submissionRound
    || !scope
  ) {
    return null;
  }

  return {
    task_id: taskId,
    task_name: taskName,
    task_intro: "task_intro" in value ? normalizeOptionalString(value.task_intro) : null,
    task_type_code: taskTypeCode,
    task_type_name:
      "task_type_name" in value ? normalizeOptionalString(value.task_type_name) : null,
    commission_amount_rmb:
      "commission_amount_rmb" in value
        ? normalizeNumericValue(value.commission_amount_rmb) ?? 0
        : 0,
    scope,
    team_id: "team_id" in value ? normalizeOptionalString(value.team_id) : null,
    team_name: "team_name" in value ? normalizeOptionalString(value.team_name) : null,
    accepted_by_user_id: acceptedByUserId,
    accepted_by_name:
      "accepted_by_name" in value ? normalizeOptionalString(value.accepted_by_name) : null,
    accepted_by_email:
      "accepted_by_email" in value ? normalizeOptionalString(value.accepted_by_email) : null,
    submission_id: submissionId,
    submission_round: submissionRound,
    submission_note:
      "submission_note" in value ? normalizeOptionalString(value.submission_note) : null,
    submitted_at: "submitted_at" in value ? normalizeOptionalString(value.submitted_at) : null,
    asset_count: "asset_count" in value ? normalizeInteger(value.asset_count) : 0,
  };
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeTaskReviewSubmissionStatus(
  value: unknown,
): TaskReviewSubmissionStatus | null {
  if (
    value === "draft"
    || value === "pending"
    || value === "approved"
    || value === "rejected"
  ) {
    return value;
  }

  return null;
}

function normalizeTaskScope(value: unknown): "public" | "team" | null {
  return value === "public" || value === "team" ? value : null;
}
