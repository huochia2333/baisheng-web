import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";

const ADMIN_TASK_SELECT =
  "id,task_name,task_intro,created_by_user_id,accepted_by_user_id,scope,team_id,status,created_at,accepted_at,completed_at";
const TASK_ATTACHMENT_BUCKET = "task-attachments";

export type TaskScope = "public" | "team";
export type TaskStatus = "to_be_accepted" | "accepted" | "completed";

export type AdminTaskViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type TaskProfileSummary = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
};

export type TaskTeamSummary = {
  id: string;
  team_name: string | null;
};

export type AdminTaskAttachment = {
  id: string;
  task_id: string;
  task_attachment_storage_path: string;
  file_size_bytes: number;
  original_name: string;
  bucket_name: string;
  mime_type: string;
  uploaded_by_user_id: string;
  created_at: string | null;
};

export type AdminTaskMainRow = {
  id: string;
  task_name: string;
  task_intro: string | null;
  created_by_user_id: string;
  accepted_by_user_id: string | null;
  scope: TaskScope;
  team_id: string | null;
  status: TaskStatus;
  created_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
};

export type AdminTaskRow = AdminTaskMainRow & {
  creator: TaskProfileSummary | null;
  accepted_by: TaskProfileSummary | null;
  team: TaskTeamSummary | null;
  attachments: AdminTaskAttachment[];
};

export type CreateAdminTaskInput = {
  taskName: string;
  taskIntro?: string | null;
  createdByUserId: string;
  scope: TaskScope;
  teamId?: string | null;
};

export type UpdateAdminTaskAssignmentInput = {
  taskId: string;
  scope: TaskScope;
  teamId?: string | null;
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

type UserProfileRecord = {
  user_id: string | null;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
};

type TeamProfileRecord = {
  id: string | null;
  team_name: string | null;
};

export async function getCurrentTaskViewerContext(
  supabase: SupabaseClient,
): Promise<AdminTaskViewerContext | null> {
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

export async function getAdminTasks(
  supabase: SupabaseClient,
): Promise<AdminTaskRow[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select(ADMIN_TASK_SELECT)
      .order("created_at", { ascending: false })
      .returns<TaskMainRecord[]>(),
  );

  if (error) {
    throw error;
  }

  const taskRows = (data ?? [])
    .map((item) => normalizeTaskMainRecord(item))
    .filter((item): item is AdminTaskMainRow => item !== null);

  if (taskRows.length === 0) {
    return [];
  }

  const taskIds = taskRows.map((task) => task.id);
  const userIds = Array.from(
    new Set(
      taskRows.flatMap((task) =>
        [task.created_by_user_id, task.accepted_by_user_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  );
  const teamIds = Array.from(
    new Set(
      taskRows
        .map((task) => task.team_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [attachments, profiles, teams] = await Promise.all([
    getTaskAttachmentsByTaskIds(supabase, taskIds),
    getTaskProfilesByUserIds(supabase, userIds),
    getTaskTeamsByIds(supabase, teamIds),
  ]);

  const attachmentsByTaskId = new Map<string, AdminTaskAttachment[]>();
  attachments.forEach((attachment) => {
    const bucket = attachmentsByTaskId.get(attachment.task_id);
    if (bucket) {
      bucket.push(attachment);
      return;
    }

    attachmentsByTaskId.set(attachment.task_id, [attachment]);
  });

  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return taskRows.map((task) => ({
    ...task,
    creator: profileByUserId.get(task.created_by_user_id) ?? null,
    accepted_by: task.accepted_by_user_id
      ? profileByUserId.get(task.accepted_by_user_id) ?? null
      : null,
    team: task.team_id ? teamById.get(task.team_id) ?? null : null,
    attachments: attachmentsByTaskId.get(task.id) ?? [],
  }));
}

export async function createAdminTask(
  supabase: SupabaseClient,
  input: CreateAdminTaskInput,
): Promise<AdminTaskMainRow> {
  const payload = {
    task_name: input.taskName.trim(),
    task_intro: normalizeNullableString(input.taskIntro),
    created_by_user_id: input.createdByUserId,
    scope: input.scope,
    team_id: input.scope === "team" ? input.teamId ?? null : null,
  };

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .insert(payload)
      .select(ADMIN_TASK_SELECT)
      .single()
      .returns<TaskMainRecord>(),
  );

  if (error) {
    throw error;
  }

  const task = normalizeTaskMainRecord(data);

  if (!task) {
    throw new Error("任务创建成功，但返回数据不完整。");
  }

  return task;
}

export async function updateAdminTaskAssignment(
  supabase: SupabaseClient,
  input: UpdateAdminTaskAssignmentInput,
): Promise<AdminTaskMainRow> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .update({
        scope: input.scope,
        team_id: input.scope === "team" ? input.teamId ?? null : null,
      })
      .eq("id", input.taskId)
      .select(ADMIN_TASK_SELECT)
      .single()
      .returns<TaskMainRecord>(),
  );

  if (error) {
    throw error;
  }

  const task = normalizeTaskMainRecord(data);

  if (!task) {
    throw new Error("任务改派成功，但返回数据不完整。");
  }

  return task;
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
        id: "",
        task_id: options.taskId,
        task_attachment_storage_path: item.task_attachment_storage_path,
        file_size_bytes: 0,
        original_name: item.task_attachment_storage_path.split("/").pop() ?? "附件",
        bucket_name: item.bucket_name,
        mime_type: "application/octet-stream",
        uploaded_by_user_id: options.uploadedByUserId,
        created_at: null,
      })),
    );

    throw error;
  }
}

export async function deleteAdminTask(
  supabase: SupabaseClient,
  task: Pick<AdminTaskRow, "id" | "attachments">,
) {
  await removeStoredTaskAttachments(supabase, task.attachments);

  const { error } = await withRequestTimeout(
    supabase.from("task_main").delete().eq("id", task.id),
  );

  if (error) {
    throw error;
  }
}

async function getTaskAttachmentsByTaskIds(
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

async function getTaskProfilesByUserIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<TaskProfileSummary[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_profiles")
      .select("user_id,name,email,status")
      .in("user_id", userIds)
      .returns<UserProfileRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskProfile(item))
    .filter((item): item is TaskProfileSummary => item !== null);
}

async function getTaskTeamsByIds(
  supabase: SupabaseClient,
  teamIds: string[],
): Promise<TaskTeamSummary[]> {
  if (teamIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("team_profiles")
      .select("id,team_name")
      .in("id", teamIds)
      .returns<TeamProfileRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskTeam(item))
    .filter((item): item is TaskTeamSummary => item !== null);
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

function normalizeTaskMainRecord(value: unknown): AdminTaskMainRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeNullableString(value.id) : null;
  const taskName = "task_name" in value ? normalizeNullableString(value.task_name) : null;
  const createdByUserId =
    "created_by_user_id" in value ? normalizeNullableString(value.created_by_user_id) : null;
  const scope = "scope" in value ? normalizeTaskScope(value.scope) : null;
  const status = "status" in value ? normalizeTaskStatus(value.status) : null;

  if (!id || !taskName || !createdByUserId || !scope || !status) {
    return null;
  }

  return {
    id,
    task_name: taskName,
    task_intro: "task_intro" in value ? normalizeNullableString(value.task_intro) : null,
    created_by_user_id: createdByUserId,
    accepted_by_user_id:
      "accepted_by_user_id" in value ? normalizeNullableString(value.accepted_by_user_id) : null,
    scope,
    team_id: "team_id" in value ? normalizeNullableString(value.team_id) : null,
    status,
    created_at: "created_at" in value ? normalizeNullableString(value.created_at) : null,
    accepted_at: "accepted_at" in value ? normalizeNullableString(value.accepted_at) : null,
    completed_at: "completed_at" in value ? normalizeNullableString(value.completed_at) : null,
  };
}

function normalizeTaskAttachment(value: unknown): AdminTaskAttachment | null {
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

function normalizeTaskProfile(value: unknown): TaskProfileSummary | null {
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

function normalizeTaskTeam(value: unknown): TaskTeamSummary | null {
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

function normalizeNullableString(value: unknown) {
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

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "inactive" || value === "active" || value === "suspended") {
    return value;
  }

  return null;
}
