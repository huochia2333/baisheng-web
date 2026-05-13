import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  normalizeInteger,
  normalizeOptionalString,
} from "./value-normalizers";

export type TaskAcceptanceSummary = {
  taskId: string;
  acceptedCount: number;
  completedCount: number;
};

type TaskAcceptanceSummaryRecord = {
  task_id: string | null;
  accepted_count: number | string | null;
  completed_count: number | string | null;
};

export async function getTaskAcceptanceSummaryByTaskId(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<Map<string, TaskAcceptanceSummary>> {
  const normalizedTaskIds = Array.from(
    new Set(taskIds.map((taskId) => normalizeOptionalString(taskId)).filter(Boolean)),
  ) as string[];

  if (normalizedTaskIds.length === 0) {
    return new Map<string, TaskAcceptanceSummary>();
  }

  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_task_acceptance_summaries", {
      p_task_ids: normalizedTaskIds,
    }).returns<TaskAcceptanceSummaryRecord[]>(),
  );

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data as TaskAcceptanceSummaryRecord[] : [];

  return new Map<string, TaskAcceptanceSummary>(
    rows
      .map((row) => normalizeTaskAcceptanceSummary(row))
      .filter((row): row is TaskAcceptanceSummary => row !== null)
      .map((row) => [row.taskId, row]),
  );
}

function normalizeTaskAcceptanceSummary(
  value: TaskAcceptanceSummaryRecord,
): TaskAcceptanceSummary | null {
  const taskId = normalizeOptionalString(value.task_id);

  if (!taskId) {
    return null;
  }

  return {
    taskId,
    acceptedCount: normalizeInteger(value.accepted_count),
    completedCount: normalizeInteger(value.completed_count),
  };
}
