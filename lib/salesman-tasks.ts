import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type {
  AdminTaskAttachment,
  AdminTaskMainRow,
  TaskScope,
  TaskStatus,
} from "./admin-tasks";
import { getCurrentSessionContext, type AppRole, type UserStatus } from "./user-self-service";

const TASK_SELECT =
  "id,task_name,task_intro,created_by_user_id,accepted_by_user_id,scope,team_id,status,created_at,accepted_at,completed_at";
const TASK_ATTACHMENT_SELECT =
  "id,task_id,task_attachment_storage_path,file_size_bytes,original_name,bucket_name,mime_type,uploaded_by_user_id,created_at";

export type SalesmanTaskViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type SalesmanTaskRow = AdminTaskMainRow & {
  attachments: AdminTaskAttachment[];
};

type TaskMainRecord = {
  id: string;
  task_name: string | null;
  task_intro: string | null;
  created_by_user_id: string | null;
  accepted_by_user_id: string | null;
  scope: TaskScope | null;
  team_id: string | null;
  status: TaskStatus | null;
  created_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
};

type TaskAttachmentRecord = {
  id: string;
  task_id: string | null;
  task_attachment_storage_path: string | null;
  file_size_bytes: number | string | null;
  original_name: string | null;
  bucket_name: string | null;
  mime_type: string | null;
  uploaded_by_user_id: string | null;
  created_at: string | null;
};

export async function getCurrentSalesmanTaskViewerContext(
  supabase: SupabaseClient,
): Promise<SalesmanTaskViewerContext | null> {
  const { user, role, status } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return {
    user,
    role,
    status,
  };
}

export async function getVisibleSalesmanTasks(
  supabase: SupabaseClient,
): Promise<SalesmanTaskRow[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select(TASK_SELECT)
      .order("created_at", { ascending: false })
      .returns<TaskMainRecord[]>(),
  );

  if (error) {
    throw error;
  }

  const tasks = (data ?? [])
    .map((item) => normalizeTaskMainRecord(item))
    .filter((item): item is AdminTaskMainRow => item !== null);

  if (tasks.length === 0) {
    return [];
  }

  const taskIds = tasks.map((task) => task.id);
  const attachments = await getVisibleTaskAttachments(supabase, taskIds);
  const attachmentByTaskId = new Map<string, AdminTaskAttachment[]>();

  attachments.forEach((attachment) => {
    const bucket = attachmentByTaskId.get(attachment.task_id);

    if (bucket) {
      bucket.push(attachment);
      return;
    }

    attachmentByTaskId.set(attachment.task_id, [attachment]);
  });

  return tasks.map((task) => ({
    ...task,
    attachments: attachmentByTaskId.get(task.id) ?? [],
  }));
}

export async function acceptSalesmanTask(supabase: SupabaseClient, taskId: string) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("accept_task", {
      p_task_id: taskId,
    }),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function completeSalesmanTask(supabase: SupabaseClient, taskId: string) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("complete_task", {
      p_task_id: taskId,
    }),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getTaskAttachmentSignedUrl(
  supabase: SupabaseClient,
  attachment: Pick<AdminTaskAttachment, "bucket_name" | "task_attachment_storage_path">,
  expiresIn = 60 * 10,
) {
  const { data, error } = await withRequestTimeout(
    supabase.storage
      .from(attachment.bucket_name)
      .createSignedUrl(attachment.task_attachment_storage_path, expiresIn),
  );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function getVisibleTaskAttachments(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<AdminTaskAttachment[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_sub")
      .select(TASK_ATTACHMENT_SELECT)
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

function normalizeTaskMainRecord(value: unknown): AdminTaskMainRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeOptionalString(value.id) : null;
  const taskName = "task_name" in value ? normalizeOptionalString(value.task_name) : null;
  const createdByUserId =
    "created_by_user_id" in value ? normalizeOptionalString(value.created_by_user_id) : null;
  const scope = "scope" in value ? normalizeTaskScope(value.scope) : null;
  const status = "status" in value ? normalizeTaskStatus(value.status) : null;

  if (!id || !taskName || !createdByUserId || !scope || !status) {
    return null;
  }

  return {
    id,
    task_name: taskName,
    task_intro: "task_intro" in value ? normalizeOptionalString(value.task_intro) : null,
    created_by_user_id: createdByUserId,
    accepted_by_user_id:
      "accepted_by_user_id" in value ? normalizeOptionalString(value.accepted_by_user_id) : null,
    scope,
    team_id: "team_id" in value ? normalizeOptionalString(value.team_id) : null,
    status,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    accepted_at: "accepted_at" in value ? normalizeOptionalString(value.accepted_at) : null,
    completed_at: "completed_at" in value ? normalizeOptionalString(value.completed_at) : null,
  };
}

function normalizeTaskAttachment(value: unknown): AdminTaskAttachment | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeOptionalString(value.id) : null;
  const taskId = "task_id" in value ? normalizeOptionalString(value.task_id) : null;
  const storagePath =
    "task_attachment_storage_path" in value
      ? normalizeOptionalString(value.task_attachment_storage_path)
      : null;
  const originalName =
    "original_name" in value ? normalizeOptionalString(value.original_name) : null;
  const bucketName = "bucket_name" in value ? normalizeOptionalString(value.bucket_name) : null;
  const mimeType = "mime_type" in value ? normalizeOptionalString(value.mime_type) : null;

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
    uploaded_by_user_id:
      "uploaded_by_user_id" in value ? normalizeOptionalString(value.uploaded_by_user_id) ?? "" : "",
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
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

function normalizeTaskScope(value: unknown): TaskScope | null {
  if (value === "public" || value === "team") {
    return value;
  }

  return null;
}

function normalizeTaskStatus(value: unknown): TaskStatus | null {
  if (value === "to_be_accepted" || value === "accepted" || value === "completed") {
    return value;
  }

  return null;
}
