import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeNullableString,
  normalizeTaskAttachment,
} from "./admin-task-normalizers";
import type {
  AdminTaskAttachment,
  TaskAttachmentRecord,
} from "./admin-tasks-types";
import { withRequestTimeout } from "./request-timeout";
import { exceedsUploadFileSizeLimit } from "./upload-file-size-limits";

const TASK_ATTACHMENT_BUCKET = "task-attachments";

export const ADMIN_TASK_ATTACHMENT_MAX_FILES = 10;
export const ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;

const ADMIN_TASK_ATTACHMENT_ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "text/",
];
const ADMIN_TASK_ATTACHMENT_ALLOWED_MIME_TYPES = new Set([
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
const ADMIN_TASK_ATTACHMENT_ALLOWED_EXTENSIONS = new Set([
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

export async function getTaskAttachmentsByTaskIds(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<AdminTaskAttachment[]> {
  if (taskIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_sub")
      .select(
        "id,task_id,task_attachment_storage_path,file_size_bytes,original_name,bucket_name,mime_type,uploaded_by_user_id,created_at",
      )
      .in("task_id", taskIds)
      .order("created_at", { ascending: true })
      .returns<TaskAttachmentRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskAttachment(item))
    .filter((item): item is AdminTaskAttachment => item !== null);
}

export async function uploadAdminTaskAttachments(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    uploadedByUserId: string;
    files: File[];
  },
): Promise<AdminTaskAttachment[]> {
  if (options.files.length === 0) {
    return [];
  }

  validateAdminTaskAttachments(options.files);

  const uploadedObjects: Array<{
    bucket_name: string;
    task_attachment_storage_path: string;
  }> = [];

  try {
    for (const [index, file] of options.files.entries()) {
      const storagePath = buildTaskAttachmentStoragePath(
        options.uploadedByUserId,
        options.taskId,
        file.name,
        index,
      );

      const { error } = await withRequestTimeout(
        supabase.storage.from(TASK_ATTACHMENT_BUCKET).upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        }),
        {
          timeoutMs: 60_000,
          message: "任务附件上传超时，请稍后重试。",
        },
      );

      if (error) {
        throw error;
      }

      uploadedObjects.push({
        bucket_name: TASK_ATTACHMENT_BUCKET,
        task_attachment_storage_path: storagePath,
      });
    }

    const metadataRows = options.files.map((file, index) => ({
      task_id: options.taskId,
      task_attachment_storage_path: uploadedObjects[index]?.task_attachment_storage_path ?? "",
      file_size_bytes: file.size,
      original_name: file.name,
      bucket_name: TASK_ATTACHMENT_BUCKET,
      mime_type: file.type || "application/octet-stream",
      uploaded_by_user_id: options.uploadedByUserId,
    }));

    const { data, error } = await withRequestTimeout(
      supabase
        .from("task_sub")
        .insert(metadataRows)
        .select(
          "id,task_id,task_attachment_storage_path,file_size_bytes,original_name,bucket_name,mime_type,uploaded_by_user_id,created_at",
        )
        .returns<TaskAttachmentRecord[]>(),
    );

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((item) => normalizeTaskAttachment(item))
      .filter((item): item is AdminTaskAttachment => item !== null);
  } catch (error) {
    await removeStoredTaskAttachments(
      supabase,
      uploadedObjects.map((item) => ({
        bucket_name: item.bucket_name,
        task_attachment_storage_path: item.task_attachment_storage_path,
      })),
    );

    throw error;
  }
}

export function validateAdminTaskAttachments(files: File[]) {
  if (files.length > ADMIN_TASK_ATTACHMENT_MAX_FILES) {
    throw new Error("admin_task_attachments_count_exceeded");
  }

  let totalSizeBytes = 0;

  for (const file of files) {
    totalSizeBytes += file.size;

    if (file.size <= 0) {
      throw new Error("admin_task_attachment_empty");
    }

    if (exceedsUploadFileSizeLimit(file)) {
      throw new Error("admin_task_attachment_too_large");
    }

    if (!isAllowedAdminTaskAttachment(file)) {
      throw new Error("admin_task_attachment_type_not_allowed");
    }
  }

  if (totalSizeBytes > ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES) {
    throw new Error("admin_task_attachments_total_too_large");
  }
}

async function removeStoredTaskAttachments(
  supabase: SupabaseClient,
  attachments: Pick<AdminTaskAttachment, "bucket_name" | "task_attachment_storage_path">[],
) {
  if (attachments.length === 0) {
    return;
  }

  const pathsByBucket = new Map<string, string[]>();

  attachments.forEach((attachment) => {
    const bucketName = normalizeNullableString(attachment.bucket_name) ?? TASK_ATTACHMENT_BUCKET;
    const storagePath = normalizeNullableString(attachment.task_attachment_storage_path);

    if (!storagePath) {
      return;
    }

    const bucketPaths = pathsByBucket.get(bucketName);

    if (bucketPaths) {
      bucketPaths.push(storagePath);
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
        message: "任务附件删除超时，请稍后重试。",
      },
    );

    if (error) {
      throw error;
    }
  }
}

function buildTaskAttachmentStoragePath(
  uploadedByUserId: string,
  taskId: string,
  originalName: string,
  index: number,
) {
  const safeName = sanitizeFileName(originalName) || `attachment-${index + 1}`;
  const uniqueKey =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${index + 1}`;

  return `${uploadedByUserId}/${taskId}/${uniqueKey}-${safeName}`;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");
}

function isAllowedAdminTaskAttachment(file: File) {
  const normalizedType = file.type.trim().toLowerCase();

  if (normalizedType) {
    if (
      ADMIN_TASK_ATTACHMENT_ALLOWED_MIME_PREFIXES.some((prefix) =>
        normalizedType.startsWith(prefix),
      )
    ) {
      return true;
    }

    if (ADMIN_TASK_ATTACHMENT_ALLOWED_MIME_TYPES.has(normalizedType)) {
      return true;
    }
  }

  const extension = getFileExtension(file.name);
  return extension ? ADMIN_TASK_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension) : false;
}

function getFileExtension(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();
  const extensionIndex = normalizedName.lastIndexOf(".");

  if (extensionIndex < 0 || extensionIndex === normalizedName.length - 1) {
    return null;
  }

  return normalizedName.slice(extensionIndex + 1);
}
