import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import { prepareDeletedTaskStorageCleanup } from "./task-storage-cleanup";
import { getVisibleTeamOverviews, type TeamOverview } from "./team-management";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";

const ADMIN_TASK_SELECT =
  "id,task_name,task_intro,task_type_code,commission_amount_rmb,created_by_user_id,accepted_by_user_id,scope,team_id,status,created_at,accepted_at,submitted_at,reviewed_at,reviewed_by_user_id,review_reject_reason,completed_at";
const TASK_ATTACHMENT_BUCKET = "task-attachments";
export const ADMIN_TASK_ATTACHMENT_MAX_FILES = 10;
export const ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
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

export type TaskScope = "public" | "team";
export type TaskStatus =
  | "to_be_accepted"
  | "accepted"
  | "reviewing"
  | "rejected"
  | "completed";
export type AdminTaskStatusFilter = "all" | TaskStatus;
export type AdminTaskScopeFilter = "all" | TaskScope;

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

export type TaskTypeOption = {
  code: string;
  displayName: string;
  description: string | null;
  defaultCommissionAmountRmb: number;
  isActive: boolean;
  sortOrder: number;
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
  task_type_code: string;
  task_type_label: string | null;
  commission_amount_rmb: number;
  created_by_user_id: string;
  accepted_by_user_id: string | null;
  scope: TaskScope;
  team_id: string | null;
  status: TaskStatus;
  created_at: string | null;
  accepted_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  review_reject_reason: string | null;
  completed_at: string | null;
};

export type AdminTaskRow = AdminTaskMainRow & {
  creator: TaskProfileSummary | null;
  accepted_by: TaskProfileSummary | null;
  team: TaskTeamSummary | null;
  attachments: AdminTaskAttachment[];
};

export type AdminTasksPageData = {
  viewerId: string | null;
  viewerRole: AppRole | null;
  viewerStatus: UserStatus | null;
  canView: boolean;
  tasks: AdminTaskRow[];
  teamOptions: TeamOverview[];
  taskTypeOptions: TaskTypeOption[];
};

export type AdminTasksFilters = {
  searchText: string;
  scope: AdminTaskScopeFilter;
  status: AdminTaskStatusFilter;
  teamId: string;
};

export type AdminTasksSearchParams = {
  filters: AdminTasksFilters;
  page: number;
};

export type CreateAdminTaskInput = {
  taskName: string;
  taskIntro?: string | null;
  taskTypeCode: string;
  commissionAmountRmb: number;
  createdByUserId: string;
  scope: TaskScope;
  teamId?: string | null;
};

export type UpdateAdminTaskInput = {
  taskId: string;
  taskName: string;
  taskIntro?: string | null;
  taskTypeCode: string;
  commissionAmountRmb: number;
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
  task_type_code: string | null;
  commission_amount_rmb: number | string | null;
  created_by_user_id: string | null;
  accepted_by_user_id: string | null;
  scope: TaskScope | null;
  team_id: string | null;
  status: TaskStatus | null;
  created_at: string | null;
  accepted_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  review_reject_reason: string | null;
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

type TaskTypeCatalogRecord = {
  code: string | null;
  display_name: string | null;
  description: string | null;
  default_commission_amount_rmb: number | string | null;
  is_active: boolean | null;
  sort_order: number | string | null;
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

export function canViewAdminTaskBoard(role: AppRole | null, status: UserStatus | null) {
  return role === "administrator" && (status === null || status === "active");
}

export function normalizeAdminTasksFilters(
  filters?: Partial<AdminTasksFilters> | null,
): AdminTasksFilters {
  return {
    searchText: normalizeNullableString(filters?.searchText) ?? "",
    scope: normalizeAdminTaskScopeFilter(filters?.scope),
    status: normalizeAdminTaskStatusFilter(filters?.status),
    teamId: normalizeNullableString(filters?.teamId) ?? "all",
  };
}

export function parseAdminTasksSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminTasksSearchParams {
  return {
    filters: normalizeAdminTasksFilters({
      searchText: getSingleSearchParam(searchParams.searchText),
      scope: normalizeAdminTaskScopeFilter(getSingleSearchParam(searchParams.scope)),
      status: normalizeAdminTaskStatusFilter(getSingleSearchParam(searchParams.status)),
      teamId: getSingleSearchParam(searchParams.teamId),
    }),
    page: normalizePositiveInteger(getSingleSearchParam(searchParams.page), 1),
  };
}

export async function getAdminTasksPageData(
  supabase: SupabaseClient,
): Promise<AdminTasksPageData> {
  const viewer = await getCurrentTaskViewerContext(supabase);

  if (!viewer) {
    return createEmptyAdminTasksPageData({
      viewerId: null,
      viewerRole: null,
      viewerStatus: null,
    });
  }

  if (!canViewAdminTaskBoard(viewer.role, viewer.status)) {
    return createEmptyAdminTasksPageData({
      viewerId: viewer.user.id,
      viewerRole: viewer.role,
      viewerStatus: viewer.status,
    });
  }

  const [tasks, teamOptions, taskTypeOptions] = await Promise.all([
    getAdminTasks(supabase),
    getVisibleTeamOverviews(supabase),
    getVisibleTaskTypeOptions(supabase),
  ]);

  return {
    viewerId: viewer.user.id,
    viewerRole: viewer.role,
    viewerStatus: viewer.status,
    canView: true,
    tasks,
    teamOptions,
    taskTypeOptions,
  };
}

export async function getAdminTasks(
  supabase: SupabaseClient,
  limit = MAX_DASHBOARD_QUERY_ROWS,
): Promise<AdminTaskRow[]> {
  const { from, to } = getDashboardQueryRange(limit);
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select(ADMIN_TASK_SELECT)
      .order("created_at", { ascending: false })
      .range(from, to)
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
  const taskTypeCodes = Array.from(new Set(taskRows.map((task) => task.task_type_code)));

  const [attachments, profiles, teams, taskTypes] = await Promise.all([
    getTaskAttachmentsByTaskIds(supabase, taskIds),
    getTaskProfilesByUserIds(supabase, userIds),
    getTaskTeamsByIds(supabase, teamIds),
    getTaskTypesByCodes(supabase, taskTypeCodes),
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
  const taskTypeByCode = new Map(taskTypes.map((taskType) => [taskType.code, taskType]));

  return taskRows.map((task) => ({
    ...task,
    task_type_label:
      taskTypeByCode.get(task.task_type_code)?.displayName ?? task.task_type_label,
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
    task_type_code: input.taskTypeCode,
    commission_amount_rmb: input.commissionAmountRmb,
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

export async function updateAdminTask(
  supabase: SupabaseClient,
  input: UpdateAdminTaskInput,
): Promise<{
  commissionSyncFailed: boolean;
  task: AdminTaskMainRow;
}> {
  const payload = {
    task_name: input.taskName.trim(),
    task_intro: normalizeNullableString(input.taskIntro),
    task_type_code: input.taskTypeCode,
    commission_amount_rmb: input.commissionAmountRmb,
    scope: input.scope,
    team_id: input.scope === "team" ? input.teamId ?? null : null,
  };

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_main")
      .update(payload)
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
    throw new Error("任务更新成功，但返回数据不完整。");
  }

  if (task.status !== "completed") {
    return {
      commissionSyncFailed: false,
      task,
    };
  }

  try {
    await syncTaskCommission(supabase, task.id);
    return {
      commissionSyncFailed: false,
      task,
    };
  } catch {
    return {
      commissionSyncFailed: true,
      task,
    };
  }
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

async function syncTaskCommission(
  supabase: SupabaseClient,
  taskId: string,
) {
  const { error } = await withRequestTimeout(
    supabase.rpc("sync_task_commission", {
      p_task_id: taskId,
    }),
  );

  if (error) {
    throw error;
  }
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
  const runDeletedTaskStorageCleanup = await prepareDeletedTaskStorageCleanup(
    supabase,
    {
      taskId: task.id,
      taskAttachments: task.attachments,
    },
  );

  const { error } = await withRequestTimeout(
    supabase.from("task_main").delete().eq("id", task.id),
  );

  if (error) {
    throw error;
  }

  const storageCleanupFailed = await runDeletedTaskStorageCleanup();

  return {
    storageCleanupFailed,
  };
}

function createEmptyAdminTasksPageData(options: {
  viewerId: string | null;
  viewerRole: AppRole | null;
  viewerStatus: UserStatus | null;
}): AdminTasksPageData {
  return {
    viewerId: options.viewerId,
    viewerRole: options.viewerRole,
    viewerStatus: options.viewerStatus,
    canView: canViewAdminTaskBoard(options.viewerRole, options.viewerStatus),
    tasks: [],
    teamOptions: [],
    taskTypeOptions: [],
  };
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePositiveInteger(value: string | null | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeAdminTaskScopeFilter(value: unknown): AdminTaskScopeFilter {
  return value === "public" || value === "team" ? value : "all";
}

function normalizeAdminTaskStatusFilter(value: unknown): AdminTaskStatusFilter {
  return value === "to_be_accepted"
    || value === "accepted"
    || value === "reviewing"
    || value === "rejected"
    || value === "completed"
    ? value
    : "all";
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

async function getVisibleTaskTypeOptions(
  supabase: SupabaseClient,
): Promise<TaskTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_type_catalog")
      .select("code,display_name,description,default_commission_amount_rmb,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true })
      .returns<TaskTypeCatalogRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskTypeOption(item))
    .filter((item): item is TaskTypeOption => item !== null);
}

async function getTaskTypesByCodes(
  supabase: SupabaseClient,
  codes: string[],
): Promise<TaskTypeOption[]> {
  if (codes.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_type_catalog")
      .select("code,display_name,description,default_commission_amount_rmb,is_active,sort_order")
      .in("code", codes)
      .returns<TaskTypeCatalogRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => normalizeTaskTypeOption(item))
    .filter((item): item is TaskTypeOption => item !== null);
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

    if (file.size > ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
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

function normalizeTaskMainRecord(value: unknown): AdminTaskMainRow | null {
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

function normalizeTaskTypeOption(value: unknown): TaskTypeOption | null {
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
