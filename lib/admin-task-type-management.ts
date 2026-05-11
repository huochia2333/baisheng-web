import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeNullableString,
  normalizeTaskTypeOption,
} from "./admin-task-normalizers";
import type {
  TaskTypeCatalogRecord,
  TaskTypeMutationInput,
  TaskTypeOption,
} from "./admin-tasks-types";
import { withRequestTimeout } from "./request-timeout";

export async function createTaskType(
  supabase: SupabaseClient,
  input: TaskTypeMutationInput,
): Promise<TaskTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("create_task_type", {
      p_display_name: input.displayName,
      p_description: normalizeNullableString(input.description),
      p_default_commission_amount_rmb: input.defaultCommissionAmountRmb,
    }).returns<TaskTypeCatalogRecord>(),
  );

  if (error) {
    throw error;
  }

  const taskType = normalizeTaskTypeOption(data);

  if (!taskType) {
    throw new Error("任务类型已保存，但返回内容不完整。");
  }

  return taskType;
}

export async function updateTaskType(
  supabase: SupabaseClient,
  input: TaskTypeMutationInput & { code: string },
): Promise<TaskTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("update_task_type", {
      p_code: input.code,
      p_display_name: input.displayName,
      p_description: normalizeNullableString(input.description),
      p_default_commission_amount_rmb: input.defaultCommissionAmountRmb,
    }).returns<TaskTypeCatalogRecord>(),
  );

  if (error) {
    throw error;
  }

  const taskType = normalizeTaskTypeOption(data);

  if (!taskType) {
    throw new Error("任务类型已保存，但返回内容不完整。");
  }

  return taskType;
}

export async function deactivateTaskType(
  supabase: SupabaseClient,
  code: string,
): Promise<TaskTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("deactivate_task_type", {
      p_code: code,
    }).returns<TaskTypeCatalogRecord>(),
  );

  if (error) {
    throw error;
  }

  const taskType = normalizeTaskTypeOption(data);

  if (!taskType) {
    throw new Error("任务类型已停用，但返回内容不完整。");
  }

  return taskType;
}

export async function getTaskTypeOptions(
  supabase: SupabaseClient,
): Promise<TaskTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_type_catalog")
      .select("code,display_name,description,default_commission_amount_rmb,is_active,sort_order")
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

export async function getTaskTypesByCodes(
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
