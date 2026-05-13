import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import { removeTaskStorageObjects } from "./task-attachment-policy";
import {
  getTaskReviewSubmissionAssetsForTask,
  removeStoredTaskReviewSubmissionAssets,
} from "./task-reviews";
import { normalizeOptionalString } from "./value-normalizers";

const TASK_ATTACHMENT_BUCKET = "task-attachments";

type TaskStorageAsset = {
  bucket_name: string | null;
  task_attachment_storage_path: string | null;
};

export async function removeStoredTaskAttachments(
  supabase: SupabaseClient,
  attachments: TaskStorageAsset[],
) {
  await removeTaskStorageObjects(supabase, attachments, {
    defaultBucket: TASK_ATTACHMENT_BUCKET,
    timeoutMessage: "任务附件删除超时，请稍后重试。",
  });
}

export async function prepareDeletedTaskStorageCleanup(
  supabase: SupabaseClient,
  options: {
    taskId: string;
    taskAttachments: TaskStorageAsset[];
  },
) {
  const taskIds = await getDeletedTaskIds(supabase, options.taskId);
  const [taskAttachments, reviewSubmissionAssets] = await Promise.all([
    getTaskAttachmentsForTasks(supabase, taskIds, options.taskAttachments),
    getTaskReviewSubmissionAssetsForTasks(supabase, taskIds),
  ]);

  return async function runDeletedTaskStorageCleanup() {
    const cleanupResults = await Promise.allSettled([
      removeStoredTaskAttachments(supabase, taskAttachments),
      removeStoredTaskReviewSubmissionAssets(supabase, reviewSubmissionAssets),
    ]);

    return cleanupResults.some((result) => result.status === "rejected");
  };
}

async function getDeletedTaskIds(supabase: SupabaseClient, taskId: string) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select("id")
      .or(`id.eq.${taskId},parent_task_id.eq.${taskId}`)
      .returns<Array<{ id: string | null }>>(),
  );

  if (error) {
    throw error;
  }

  const ids = (data ?? [])
    .map((row) => normalizeOptionalString(row.id))
    .filter((id): id is string => id !== null);

  return ids.length > 0 ? ids : [taskId];
}

async function getTaskAttachmentsForTasks(
  supabase: SupabaseClient,
  taskIds: string[],
  fallbackAttachments: TaskStorageAsset[],
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_sub")
      .select("bucket_name,task_attachment_storage_path")
      .in("task_id", taskIds)
      .returns<TaskStorageAsset[]>(),
  );

  if (error) {
    throw error;
  }

  return dedupeStorageAssets([...(data ?? []), ...fallbackAttachments]);
}

async function getTaskReviewSubmissionAssetsForTasks(
  supabase: SupabaseClient,
  taskIds: string[],
) {
  const result = await Promise.all(
    taskIds.map((taskId) => getTaskReviewSubmissionAssetsForTask(supabase, taskId)),
  );

  return dedupeStorageAssets(result.flat());
}

function dedupeStorageAssets<T extends TaskStorageAsset>(assets: T[]) {
  const seenKeys = new Set<string>();

  return assets.filter((asset) => {
    const bucketName = normalizeOptionalString(asset.bucket_name);
    const storagePath = normalizeOptionalString(asset.task_attachment_storage_path);

    if (!storagePath) {
      return false;
    }

    const key = `${bucketName ?? TASK_ATTACHMENT_BUCKET}:${storagePath}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}
