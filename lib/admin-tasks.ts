import type { SupabaseClient } from "@supabase/supabase-js";

import { getTaskAttachmentsByTaskIds } from "./admin-task-attachments";
import {
  normalizeNullableString,
  normalizeTaskMainRecord,
  normalizeTaskProfile,
  normalizeTaskTeam,
  normalizeTaskTypeOption,
} from "./admin-task-normalizers";
export {
  ADMIN_TASK_ATTACHMENT_MAX_FILES,
  ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  uploadAdminTaskAttachments,
  validateAdminTaskAttachments,
} from "./admin-task-attachments";
export type {
  AdminTaskAttachment,
  AdminTaskMainRow,
  AdminTaskRow,
  AdminTaskScopeFilter,
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
  TaskTeamSummary,
  TaskTypeCatalogRecord,
  TaskTypeOption,
  TeamProfileRecord,
  UpdateAdminTaskAssignmentInput,
  UpdateAdminTaskInput,
  UserProfileRecord,
} from "./admin-tasks-types";
import type {
  AdminTaskAttachment,
  AdminTaskMainRow,
  AdminTaskRow,
  AdminTaskScopeFilter,
  AdminTasksFilters,
  AdminTasksPageData,
  AdminTasksSearchParams,
  AdminTaskStatusFilter,
  AdminTaskViewerContext,
  CreateAdminTaskInput,
  TaskMainRecord,
  TaskProfileSummary,
  TaskTeamSummary,
  TaskTypeCatalogRecord,
  TaskTypeOption,
  TeamProfileRecord,
  UpdateAdminTaskAssignmentInput,
  UpdateAdminTaskInput,
  UserProfileRecord,
} from "./admin-tasks-types";
import { withRequestTimeout } from "./request-timeout";
import { prepareDeletedTaskStorageCleanup } from "./task-storage-cleanup";
import { getVisibleTeamOverviews } from "./team-management";
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
