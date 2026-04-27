import type { UserStatus } from "./user-self-service";
import type {
  AdminTaskAttachment,
  AdminTaskMainRow,
  TaskProfileSummary,
  TaskScope,
  TaskStatus,
  TaskTeamSummary,
  TaskTypeOption,
} from "./admin-tasks-types";

export function normalizeTaskMainRecord(value: unknown): AdminTaskMainRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeNullableString(value.id) : null;
  const taskName = "task_name" in value ? normalizeNullableString(value.task_name) : null;
  const taskTypeCode =
    "task_type_code" in value ? normalizeNullableString(value.task_type_code) : null;
  const createdByUserId =
    "created_by_user_id" in value ? normalizeNullableString(value.created_by_user_id) : null;
  const scope = "scope" in value ? normalizeTaskScope(value.scope) : null;
  const status = "status" in value ? normalizeTaskStatus(value.status) : null;

  if (!id || !taskName || !taskTypeCode || !createdByUserId || !scope || !status) {
    return null;
  }

  return {
    id,
    task_name: taskName,
    task_intro: "task_intro" in value ? normalizeNullableString(value.task_intro) : null,
    task_type_code: taskTypeCode,
    task_type_label: null,
    commission_amount_rmb:
      "commission_amount_rmb" in value
        ? normalizeNumericValue(value.commission_amount_rmb) ?? 0
        : 0,
    created_by_user_id: createdByUserId,
    accepted_by_user_id:
      "accepted_by_user_id" in value ? normalizeNullableString(value.accepted_by_user_id) : null,
    scope,
    team_id: "team_id" in value ? normalizeNullableString(value.team_id) : null,
    status,
    created_at: "created_at" in value ? normalizeNullableString(value.created_at) : null,
    accepted_at: "accepted_at" in value ? normalizeNullableString(value.accepted_at) : null,
    submitted_at: "submitted_at" in value ? normalizeNullableString(value.submitted_at) : null,
    reviewed_at: "reviewed_at" in value ? normalizeNullableString(value.reviewed_at) : null,
    reviewed_by_user_id:
      "reviewed_by_user_id" in value
        ? normalizeNullableString(value.reviewed_by_user_id)
        : null,
    review_reject_reason:
      "review_reject_reason" in value
        ? normalizeNullableString(value.review_reject_reason)
        : null,
    completed_at: "completed_at" in value ? normalizeNullableString(value.completed_at) : null,
  };
}

export function normalizeTaskAttachment(value: unknown): AdminTaskAttachment | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeNullableString(value.id) : null;
  const taskId = "task_id" in value ? normalizeNullableString(value.task_id) : null;
  const storagePath =
    "task_attachment_storage_path" in value
      ? normalizeNullableString(value.task_attachment_storage_path)
      : null;
  const originalName =
    "original_name" in value ? normalizeNullableString(value.original_name) : null;
  const bucketName = "bucket_name" in value ? normalizeNullableString(value.bucket_name) : null;
  const mimeType = "mime_type" in value ? normalizeNullableString(value.mime_type) : null;
  const uploadedByUserId =
    "uploaded_by_user_id" in value ? normalizeNullableString(value.uploaded_by_user_id) : null;

  if (!id || !taskId || !storagePath || !originalName || !bucketName || !mimeType) {
    return null;
  }

  return {
    id,
    task_id: taskId,
    task_attachment_storage_path: storagePath,
    file_size_bytes:
      "file_size_bytes" in value ? normalizeInteger(value.file_size_bytes) : 0,
    original_name: originalName,
    bucket_name: bucketName,
    mime_type: mimeType,
    uploaded_by_user_id: uploadedByUserId ?? "",
    created_at: "created_at" in value ? normalizeNullableString(value.created_at) : null,
  };
}

export function normalizeTaskProfile(value: unknown): TaskProfileSummary | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const userId = "user_id" in value ? normalizeNullableString(value.user_id) : null;

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    name: "name" in value ? normalizeNullableString(value.name) : null,
    email: "email" in value ? normalizeNullableString(value.email) : null,
    status: "status" in value ? normalizeUserStatus(value.status) : null,
  };
}

export function normalizeTaskTeam(value: unknown): TaskTeamSummary | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeNullableString(value.id) : null;

  if (!id) {
    return null;
  }

  return {
    id,
    team_name: "team_name" in value ? normalizeNullableString(value.team_name) : null,
  };
}

export function normalizeTaskTypeOption(value: unknown): TaskTypeOption | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const code = "code" in value ? normalizeNullableString(value.code) : null;
  const displayName = "display_name" in value ? normalizeNullableString(value.display_name) : null;

  if (!code || !displayName) {
    return null;
  }

  return {
    code,
    displayName,
    description: "description" in value ? normalizeNullableString(value.description) : null,
    defaultCommissionAmountRmb:
      "default_commission_amount_rmb" in value
        ? normalizeNumericValue(value.default_commission_amount_rmb) ?? 0
        : 0,
    isActive: "is_active" in value ? value.is_active === true : false,
    sortOrder: "sort_order" in value ? normalizeInteger(value.sort_order) : 100,
  };
}

export function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function normalizeNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeTaskScope(value: unknown): TaskScope | null {
  if (value === "public" || value === "team") {
    return value;
  }

  return null;
}

function normalizeTaskStatus(value: unknown): TaskStatus | null {
  if (
    value === "to_be_accepted"
    || value === "accepted"
    || value === "reviewing"
    || value === "rejected"
    || value === "completed"
  ) {
    return value;
  }

  return null;
}

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "inactive" || value === "active" || value === "suspended") {
    return value;
  }

  return null;
}
