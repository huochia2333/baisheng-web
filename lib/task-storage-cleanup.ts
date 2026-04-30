import type { SupabaseClient } from "@supabase/supabase-js";

import { removeTaskStorageObjects } from "./task-attachment-policy";
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
