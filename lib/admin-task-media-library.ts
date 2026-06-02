import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeTaskProfile,
  normalizeTaskScope,
} from "./admin-task-normalizers";
import { getTaskTypesByCodes } from "./admin-task-type-management";
import type {
  TaskProfileSummary,
  TaskScope,
  TaskTypeOption,
  UserProfileRecord,
} from "./admin-tasks-types";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";
import { withRequestTimeout } from "./request-timeout";
import {
  downloadTaskReviewSubmissionAssetBlob,
  getTaskReviewSubmissionAssets,
  getTaskReviewSubmissionAssetSignedUrl,
  type TaskReviewSubmissionAsset,
} from "./task-review-assets";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  normalizeNumericValue,
  normalizeOptionalInteger,
  normalizeOptionalString,
} from "./value-normalizers";

const APPROVED_TASK_REVIEW_SUBMISSION_SELECT =
  "id,acceptance_id,task_id,submitted_by_user_id,round_index,submission_note,status,reviewer_user_id,submitted_at,reviewed_at,created_at";

const TASK_MEDIA_LIBRARY_TASK_SELECT =
  "id,task_name,task_type_code,commission_amount_rmb,scope,team_id,created_at";

export type AdminTaskMediaLibraryKind = "image" | "video" | "pdf" | "file";

export type AdminTaskMediaLibraryItem = {
  id: string;
  submission_id: string;
  acceptance_id: string;
  task_id: string;
  task_name: string;
  task_type_code: string;
  task_type_name: string | null;
  commission_amount_rmb: number;
  scope: TaskScope | null;
  submitted_by_user_id: string;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  reviewer_user_id: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
  submission_round: number;
  submission_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  task_attachment_storage_path: string;
  file_size_bytes: number;
  original_name: string;
  bucket_name: string;
  mime_type: string;
  uploaded_by_user_id: string;
  created_at: string | null;
  kind: AdminTaskMediaLibraryKind;
};

export type AdminTaskMediaLibraryData = {
  canView: boolean;
  items: AdminTaskMediaLibraryItem[];
};

type ApprovedTaskReviewSubmissionRecord = {
  id: string | null;
  acceptance_id: string | null;
  task_id: string | null;
  submitted_by_user_id: string | null;
  round_index: number | string | null;
  submission_note: string | null;
  status: string | null;
  reviewer_user_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string | null;
};

type ApprovedTaskReviewSubmission = {
  id: string;
  acceptance_id: string;
  task_id: string;
  submitted_by_user_id: string;
  round_index: number;
  submission_note: string | null;
  reviewer_user_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string | null;
};

type TaskMediaLibraryTaskRecord = {
  id: string | null;
  task_name: string | null;
  task_type_code: string | null;
  commission_amount_rmb: number | string | null;
  scope: string | null;
  team_id: string | null;
  created_at: string | null;
};

type TaskMediaLibraryTask = {
  id: string;
  task_name: string;
  task_type_code: string;
  commission_amount_rmb: number;
  scope: TaskScope | null;
};

export function canViewAdminTaskMediaLibrary(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return role === "administrator" && (status === null || status === "active");
}

export async function getAdminTaskMediaLibraryData(
  supabase: SupabaseClient,
): Promise<AdminTaskMediaLibraryData> {
  const { role, status, user } = await getCurrentSessionContext(supabase);

  if (!user || !canViewAdminTaskMediaLibrary(role, status)) {
    return {
      canView: false,
      items: [],
    };
  }

  return {
    canView: true,
    items: await getAdminTaskMediaLibraryItems(supabase),
  };
}

export async function getAdminTaskMediaLibraryItems(
  supabase: SupabaseClient,
  limit = MAX_DASHBOARD_QUERY_ROWS,
): Promise<AdminTaskMediaLibraryItem[]> {
  const { from, to } = getDashboardQueryRange(limit);
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_review_submissions")
      .select(APPROVED_TASK_REVIEW_SUBMISSION_SELECT)
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .range(from, to)
      .returns<ApprovedTaskReviewSubmissionRecord[]>(),
  );

  if (error) {
    throw error;
  }

  const submissions = (data ?? [])
    .map((item) => normalizeApprovedTaskReviewSubmissionRecord(item))
    .filter((item): item is ApprovedTaskReviewSubmission => item !== null);

  if (submissions.length === 0) {
    return [];
  }

  const submissionIds = submissions.map((submission) => submission.id);
  const taskIds = Array.from(new Set(submissions.map((submission) => submission.task_id)));
  const userIds = Array.from(
    new Set(
      submissions.flatMap((submission) => [
        submission.submitted_by_user_id,
        submission.reviewer_user_id,
      ]),
    ),
  ).filter((userId): userId is string => Boolean(userId));

  const [assets, tasks, profiles] = await Promise.all([
    getTaskReviewSubmissionAssets(supabase, submissionIds),
    getTaskMediaLibraryTasksByIds(supabase, taskIds),
    getTaskMediaLibraryProfilesByUserIds(supabase, userIds),
  ]);

  if (assets.length === 0) {
    return [];
  }

  const taskTypeCodes = Array.from(new Set(tasks.map((task) => task.task_type_code)));
  const taskTypes = await getTaskTypesByCodes(supabase, taskTypeCodes);
  const submissionById = new Map(submissions.map((submission) => [submission.id, submission]));
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const taskTypeByCode = new Map(taskTypes.map((taskType) => [taskType.code, taskType]));
  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));

  return assets
    .map((asset) =>
      toAdminTaskMediaLibraryItem({
        asset,
        profileByUserId,
        submissionById,
        taskById,
        taskTypeByCode,
      }),
    )
    .filter((item): item is AdminTaskMediaLibraryItem => item !== null)
    .sort((left, right) => getItemTime(right) - getItemTime(left));
}

export async function getAdminTaskMediaLibraryItemSignedUrl(
  supabase: SupabaseClient,
  item: Pick<AdminTaskMediaLibraryItem, "bucket_name" | "task_attachment_storage_path">,
  expiresIn = 60 * 10,
) {
  return getTaskReviewSubmissionAssetSignedUrl(supabase, item, expiresIn);
}

export async function downloadAdminTaskMediaLibraryItemBlob(
  supabase: SupabaseClient,
  item: Pick<AdminTaskMediaLibraryItem, "bucket_name" | "task_attachment_storage_path">,
) {
  return downloadTaskReviewSubmissionAssetBlob(supabase, item);
}

export function getAdminTaskMediaLibraryKind(
  mimeType: string | null,
  fileName?: string | null,
): AdminTaskMediaLibraryKind {
  const normalizedMimeType = (mimeType ?? "").trim().toLowerCase();
  const normalizedName = (fileName ?? "").trim().toLowerCase();

  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("video/")) {
    return "video";
  }

  if (normalizedMimeType === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  return "file";
}

function toAdminTaskMediaLibraryItem({
  asset,
  profileByUserId,
  submissionById,
  taskById,
  taskTypeByCode,
}: {
  asset: TaskReviewSubmissionAsset;
  profileByUserId: Map<string, TaskProfileSummary>;
  submissionById: Map<string, ApprovedTaskReviewSubmission>;
  taskById: Map<string, TaskMediaLibraryTask>;
  taskTypeByCode: Map<string, TaskTypeOption>;
}): AdminTaskMediaLibraryItem | null {
  const submission = submissionById.get(asset.submission_id);

  if (!submission) {
    return null;
  }

  const task = taskById.get(submission.task_id);

  if (!task) {
    return null;
  }

  const submitter = profileByUserId.get(submission.submitted_by_user_id) ?? null;
  const reviewer = submission.reviewer_user_id
    ? profileByUserId.get(submission.reviewer_user_id) ?? null
    : null;
  const taskTypeName =
    taskTypeByCode.get(task.task_type_code)?.displayName ?? task.task_type_code;

  return {
    id: asset.id,
    submission_id: submission.id,
    acceptance_id: submission.acceptance_id,
    task_id: task.id,
    task_name: task.task_name,
    task_type_code: task.task_type_code,
    task_type_name: taskTypeName,
    commission_amount_rmb: task.commission_amount_rmb,
    scope: task.scope,
    submitted_by_user_id: submission.submitted_by_user_id,
    submitted_by_name: submitter?.name ?? null,
    submitted_by_email: submitter?.email ?? null,
    reviewer_user_id: submission.reviewer_user_id,
    reviewer_name: reviewer?.name ?? null,
    reviewer_email: reviewer?.email ?? null,
    submission_round: submission.round_index,
    submission_note: submission.submission_note,
    submitted_at: submission.submitted_at,
    reviewed_at: submission.reviewed_at,
    task_attachment_storage_path: asset.task_attachment_storage_path,
    file_size_bytes: asset.file_size_bytes,
    original_name: asset.original_name,
    bucket_name: asset.bucket_name,
    mime_type: asset.mime_type,
    uploaded_by_user_id: asset.uploaded_by_user_id,
    created_at: asset.created_at,
    kind: getAdminTaskMediaLibraryKind(asset.mime_type, asset.original_name),
  };
}

async function getTaskMediaLibraryTasksByIds(
  supabase: SupabaseClient,
  taskIds: string[],
) {
  const normalizedTaskIds = Array.from(
    new Set(taskIds.map((id) => normalizeOptionalString(id)).filter(Boolean)),
  ) as string[];

  if (normalizedTaskIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select(TASK_MEDIA_LIBRARY_TASK_SELECT)
      .in("id", normalizedTaskIds)
      .returns<TaskMediaLibraryTaskRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskMediaLibraryTaskRecord(item))
    .filter((item): item is TaskMediaLibraryTask => item !== null);
}

async function getTaskMediaLibraryProfilesByUserIds(
  supabase: SupabaseClient,
  userIds: string[],
) {
  const normalizedUserIds = Array.from(
    new Set(userIds.map((id) => normalizeOptionalString(id)).filter(Boolean)),
  ) as string[];

  if (normalizedUserIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_profiles")
      .select("user_id,name,email,status")
      .in("user_id", normalizedUserIds)
      .returns<UserProfileRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskProfile(item))
    .filter((item): item is TaskProfileSummary => item !== null);
}

function normalizeApprovedTaskReviewSubmissionRecord(
  value: ApprovedTaskReviewSubmissionRecord,
): ApprovedTaskReviewSubmission | null {
  const id = normalizeOptionalString(value.id);
  const acceptanceId = normalizeOptionalString(value.acceptance_id);
  const taskId = normalizeOptionalString(value.task_id);
  const submittedByUserId = normalizeOptionalString(value.submitted_by_user_id);
  const roundIndex = normalizeOptionalInteger(value.round_index);

  if (
    !id ||
    !acceptanceId ||
    !taskId ||
    !submittedByUserId ||
    roundIndex === null ||
    value.status !== "approved"
  ) {
    return null;
  }

  return {
    id,
    acceptance_id: acceptanceId,
    task_id: taskId,
    submitted_by_user_id: submittedByUserId,
    round_index: roundIndex,
    submission_note: normalizeOptionalString(value.submission_note),
    reviewer_user_id: normalizeOptionalString(value.reviewer_user_id),
    submitted_at: normalizeOptionalString(value.submitted_at),
    reviewed_at: normalizeOptionalString(value.reviewed_at),
    created_at: normalizeOptionalString(value.created_at),
  };
}

function normalizeTaskMediaLibraryTaskRecord(
  value: TaskMediaLibraryTaskRecord,
): TaskMediaLibraryTask | null {
  const id = normalizeOptionalString(value.id);
  const taskName = normalizeOptionalString(value.task_name);
  const taskTypeCode = normalizeOptionalString(value.task_type_code);

  if (!id || !taskName || !taskTypeCode) {
    return null;
  }

  return {
    id,
    task_name: taskName,
    task_type_code: taskTypeCode,
    commission_amount_rmb: normalizeNumericValue(value.commission_amount_rmb) ?? 0,
    scope: normalizeTaskScope(value.scope),
  };
}

function getItemTime(item: AdminTaskMediaLibraryItem) {
  const rawTime = item.reviewed_at ?? item.created_at ?? item.submitted_at;
  const timestamp = rawTime ? Date.parse(rawTime) : 0;

  return Number.isFinite(timestamp) ? timestamp : 0;
}
