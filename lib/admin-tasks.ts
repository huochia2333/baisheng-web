import type { SupabaseClient } from "@supabase/supabase-js";

import { getTaskAttachmentsByTaskIds } from "./admin-task-attachments";
import {
  normalizeNullableString,
  normalizeTaskMainRecord,
  normalizeTaskProfile,
  normalizeTaskTargetRole,
} from "./admin-task-normalizers";
import {
  getTaskTypeOptions,
  getTaskTypesByCodes,
} from "./admin-task-type-management";
export {
  ADMIN_TASK_ATTACHMENT_MAX_FILES,
  ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  uploadAdminTaskAttachments,
  validateAdminTaskAttachments,
} from "./admin-task-attachments";
export {
  createTaskType,
  deactivateTaskType,
  updateTaskType,
} from "./admin-task-type-management";
export { TASK_TARGET_ROLES } from "./admin-tasks-types";
export type {
  AdminTaskAttachment,
  AdminTaskTargetRoleFilter,
  AdminTaskMainRow,
  AdminTaskRow,
  AdminTasksFilters,
  AdminTasksPageData,
  AdminTasksSearchParams,
  AdminTaskStatusFilter,
  AdminTaskViewerContext,
  CreateAdminTaskInput,
  TaskMainRecord,
  TaskProfileSummary,
  TaskScope,
  TaskStatus,
  TaskTargetRole,
  TaskTargetRoleOption,
  TaskTargetRoleRecord,
  TaskTypeMutationInput,
  TaskTypeOption,
  UpdateAdminTaskAssignmentInput,
  UpdateAdminTaskInput,
  UserProfileRecord,
} from "./admin-tasks-types";
import type {
  AdminTaskAttachment,
  AdminTaskTargetRoleFilter,
  AdminTaskMainRow,
  AdminTaskRow,
  AdminTasksFilters,
  AdminTasksPageData,
  AdminTasksSearchParams,
  AdminTaskStatusFilter,
  AdminTaskViewerContext,
  CreateAdminTaskInput,
  TaskMainRecord,
  TaskProfileSummary,
  TaskTargetRole,
  TaskTargetRoleOption,
  TaskTargetRoleRecord,
  UpdateAdminTaskAssignmentInput,
  UpdateAdminTaskInput,
  UserProfileRecord,
} from "./admin-tasks-types";
import { TASK_TARGET_ROLES } from "./admin-tasks-types";
import { withRequestTimeout } from "./request-timeout";
import { prepareDeletedTaskStorageCleanup } from "./task-storage-cleanup";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";
import { getTaskAcceptanceSummaryByTaskId } from "./task-acceptance-summary";

const ADMIN_TASK_SELECT =
  "id,parent_task_id,task_name,task_intro,task_type_code,commission_amount_rmb,acceptance_limit,acceptance_unlimited,created_by_user_id,accepted_by_user_id,scope,team_id,status,created_at,accepted_at,submitted_at,reviewed_at,reviewed_by_user_id,review_reject_reason,completed_at";

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
    targetRole: normalizeAdminTaskTargetRoleFilter(filters?.targetRole),
    status: normalizeAdminTaskStatusFilter(filters?.status),
  };
}

export function parseAdminTasksSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminTasksSearchParams {
  return {
    filters: normalizeAdminTasksFilters({
      searchText: getSingleSearchParam(searchParams.searchText),
      targetRole: normalizeAdminTaskTargetRoleFilter(
        getSingleSearchParam(searchParams.targetRole),
      ),
      status: normalizeAdminTaskStatusFilter(getSingleSearchParam(searchParams.status)),
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

  const [tasks, taskTypeOptions] = await Promise.all([
    getAdminTasks(supabase),
    getTaskTypeOptions(supabase),
  ]);

  return {
    viewerId: viewer.user.id,
    viewerRole: viewer.role,
    viewerStatus: viewer.status,
    canView: true,
    tasks,
    targetRoleOptions: getTaskTargetRoleOptions(),
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
  const attachmentSourceTaskIds = Array.from(
    new Set(taskRows.flatMap((task) => [task.id, task.parent_task_id].filter(Boolean))),
  ) as string[];
  const userIds = Array.from(
    new Set(
      taskRows.flatMap((task) =>
        [task.created_by_user_id, task.accepted_by_user_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  );
  const taskTypeCodes = Array.from(new Set(taskRows.map((task) => task.task_type_code)));

  const [attachments, profiles, taskTypes, targetRoles, acceptanceSummaryByTaskId] = await Promise.all([
    getTaskAttachmentsByTaskIds(supabase, attachmentSourceTaskIds),
    getTaskProfilesByUserIds(supabase, userIds),
    getTaskTypesByCodes(supabase, taskTypeCodes),
    getTaskTargetRolesByTaskIds(supabase, taskIds),
    getTaskAcceptanceSummaryByTaskId(supabase, taskIds),
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
  const taskTypeByCode = new Map(taskTypes.map((taskType) => [taskType.code, taskType]));
  const targetRolesByTaskId = new Map<string, TaskTargetRole[]>();

  targetRoles.forEach((targetRole) => {
    const bucket = targetRolesByTaskId.get(targetRole.taskId);

    if (bucket) {
      bucket.push(targetRole.role);
      return;
    }

    targetRolesByTaskId.set(targetRole.taskId, [targetRole.role]);
  });

  return taskRows.map((task) => {
    const acceptanceSummary = acceptanceSummaryByTaskId.get(task.id);
    const attachmentSourceTaskId = task.parent_task_id ?? task.id;

    return {
      ...task,
      task_type_label:
        taskTypeByCode.get(task.task_type_code)?.displayName ?? task.task_type_label,
      creator: profileByUserId.get(task.created_by_user_id) ?? null,
      accepted_by: task.accepted_by_user_id
        ? profileByUserId.get(task.accepted_by_user_id) ?? null
        : null,
      team: null,
      target_roles: targetRolesByTaskId.get(task.id) ?? [],
      accepted_count: acceptanceSummary?.acceptedCount ?? task.accepted_count,
      completed_count: acceptanceSummary?.completedCount ?? task.completed_count,
      attachments: attachmentsByTaskId.get(attachmentSourceTaskId) ?? [],
    };
  });
}

export async function createAdminTask(
  supabase: SupabaseClient,
  input: CreateAdminTaskInput,
): Promise<AdminTaskMainRow> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("create_role_targeted_task", {
      p_task_name: input.taskName.trim(),
      p_task_intro: normalizeNullableString(input.taskIntro),
      p_task_type_code: input.taskTypeCode,
      p_commission_amount_rmb: input.commissionAmountRmb,
      p_target_roles: input.targetRoles,
      p_acceptance_limit: input.acceptanceLimit,
      p_acceptance_unlimited: input.acceptanceUnlimited,
    }).returns<TaskMainRecord>(),
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
  const { data, error } = await withRequestTimeout(
    supabase.rpc("update_role_targeted_task", {
      p_task_id: input.taskId,
      p_task_name: input.taskName.trim(),
      p_task_intro: normalizeNullableString(input.taskIntro),
      p_task_type_code: input.taskTypeCode,
      p_commission_amount_rmb: input.commissionAmountRmb,
      p_target_roles: input.targetRoles,
      p_acceptance_limit: input.acceptanceLimit,
      p_acceptance_unlimited: input.acceptanceUnlimited,
    }).returns<TaskMainRecord>(),
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
  const { error } = await withRequestTimeout(
    supabase.rpc("set_task_target_roles", {
      p_task_id: input.taskId,
      p_target_roles: input.targetRoles,
    }),
  );

  if (error) {
    throw error;
  }

  const { data: taskData, error: taskError } = await withRequestTimeout(
    supabase
      .from("task_main")
      .select(ADMIN_TASK_SELECT)
      .eq("id", input.taskId)
      .single()
      .returns<TaskMainRecord>(),
  );

  if (taskError) {
    throw taskError;
  }

  const task = normalizeTaskMainRecord(taskData);

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
    targetRoleOptions: [],
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

function normalizeAdminTaskTargetRoleFilter(value: unknown): AdminTaskTargetRoleFilter {
  const role = normalizeTaskTargetRole(value);

  return role ?? "all";
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

function getTaskTargetRoleOptions(): TaskTargetRoleOption[] {
  return TASK_TARGET_ROLES.map((role) => ({ role }));
}

async function getTaskTargetRolesByTaskIds(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<Array<{ taskId: string; role: TaskTargetRole }>> {
  if (taskIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_target_roles")
      .select("task_id,target_role")
      .in("task_id", taskIds)
      .returns<TaskTargetRoleRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => {
      const taskId = normalizeNullableString(item.task_id);
      const role = normalizeTaskTargetRole(item.target_role);

      return taskId && role ? { taskId, role } : null;
    })
    .filter((item): item is { taskId: string; role: TaskTargetRole } => item !== null);
}
