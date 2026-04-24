import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getTaskReviewSubmissionAssetsForTask,
  removeStoredTaskReviewSubmissionAssets,
} from "./task-reviews";

const TASK_ATTACHMENT_BUCKET = "task-attachments";

type TaskStorageAsset = {
  bucket_name: string | null;
  task_attachment_storage_path: string | null;
};

export async function removeStoredTaskAttachments(
  supabase: SupabaseClient,
  attachments: TaskStorageAsset[],
) {
  if (attachments.length === 0) {
    return;
  }

  const pathsByBucket = new Map<string, string[]>();

  attachments.forEach((attachment) => {
    const bucketName = normalizeOptionalString(attachment.bucket_name) ?? TASK_ATTACHMENT_BUCKET;
    const storagePath = normalizeOptionalString(attachment.task_attachment_storage_path);

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

export async function prepareDeletedTaskStorageCleanup(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    taskAttachments: TaskStorageAsset[];
  },
) {
  const reviewSubmissionAssets = await getTaskReviewSubmissionAssetsForTask(
    supabase,
    options.taskId,
  );

  return async function runDeletedTaskStorageCleanup() {
    const cleanupResults = await Promise.allSettled([
      removeStoredTaskAttachments(supabase, options.taskAttachments),
      removeStoredTaskReviewSubmissionAssets(supabase, reviewSubmissionAssets),
    ]);

    return cleanupResults.some((result) => result.status === "rejected");
  };
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
