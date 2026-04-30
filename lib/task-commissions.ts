import type { SupabaseClient } from "@supabase/supabase-js";

import { getOrderUserOptions, type OrderUserOption } from "./admin-orders";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";
import { withRequestTimeout } from "./request-timeout";
import type { AppRole, UserStatus } from "./user-self-service";
import { normalizeOptionalString } from "./value-normalizers";

const TASK_COMMISSION_SELECT =
  "id,task_id,review_submission_id,beneficiary_user_id,approved_by_user_id,task_type_code,task_name_snapshot,task_scope,team_id,commission_amount_rmb,calculation_snapshot,settlement_status,settled_at,settlement_note,created_at,updated_at";

export type TaskCommissionSettlementStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "reversed";

export type TaskCommissionActor = {
  userId: string | null;
  label: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
  status: UserStatus | null;
};

export type TaskCommissionRow = {
  id: string;
  taskId: string;
  reviewSubmissionId: string | null;
  taskTypeCode: string;
  taskTypeName: string | null;
  taskName: string;
  taskScope: "public" | "team";
  teamId: string | null;
  teamName: string | null;
  beneficiary: TaskCommissionActor;
  approvedBy: TaskCommissionActor | null;
  commissionAmountRmb: number;
  settlementStatus: TaskCommissionSettlementStatus;
  settlementNote: string | null;
  settledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  calculationSnapshot: unknown;
};

type TaskCommissionRecord = {
  id: string;
  task_id: string;
  review_submission_id: string | null;
  beneficiary_user_id: string;
  approved_by_user_id: string | null;
  task_type_code: string;
  task_name_snapshot: string;
  task_scope: "public" | "team";
  team_id: string | null;
  commission_amount_rmb: number | string | null;
  calculation_snapshot: unknown;
  settlement_status: TaskCommissionSettlementStatus;
  settled_at: string | null;
  settlement_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TaskTypeRecord = {
  code: string | null;
  display_name: string | null;
};

type TeamRecord = {
  id: string | null;
  team_name: string | null;
};

export async function getTaskCommissions(
  supabase: SupabaseClient,
  options?: {
    beneficiaryUserId?: string | null;
    limit?: number;
  },
): Promise<TaskCommissionRow[]> {
  const [commissionRows, userOptions] = await Promise.all([
    getTaskCommissionRows(supabase, options),
    getOrderUserOptions(supabase),
  ]);

  if (commissionRows.length === 0) {
    return [];
  }

  const taskTypeCodes = Array.from(
    new Set(commissionRows.map((row) => row.task_type_code)),
  );
  const teamIds = Array.from(
    new Set(
      commissionRows
        .map((row) => row.team_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [taskTypes, teams] = await Promise.all([
    getTaskTypeRecords(supabase, taskTypeCodes),
    getTeamRecords(supabase, teamIds),
  ]);

  const userById = new Map(userOptions.map((option) => [option.user_id, option]));
  const taskTypeByCode = new Map(taskTypes.map((taskType) => [taskType.code, taskType]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return commissionRows.map((row) =>
    normalizeTaskCommissionRow(row, userById, taskTypeByCode, teamById),
  );
}

async function getTaskCommissionRows(
  supabase: SupabaseClient,
  options?: {
    beneficiaryUserId?: string | null;
    limit?: number;
  },
): Promise<TaskCommissionRecord[]> {
  const { from, to } = getDashboardQueryRange(
    options?.limit ?? MAX_DASHBOARD_QUERY_ROWS,
  );
  let commissionQuery = supabase
    .from("task_commission_record")
    .select(TASK_COMMISSION_SELECT);

  if (options?.beneficiaryUserId) {
    commissionQuery = commissionQuery.eq(
      "beneficiary_user_id",
      options.beneficiaryUserId,
    );
  }

  const { data, error } = await withRequestTimeout(
    commissionQuery
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<TaskCommissionRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => normalizeTaskCommissionRecord(row))
    .filter((row): row is TaskCommissionRecord => row !== null);
}

async function getTaskTypeRecords(
  supabase: SupabaseClient,
  taskTypeCodes: string[],
): Promise<Array<{ code: string; display_name: string | null }>> {
  if (taskTypeCodes.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("task_type_catalog")
      .select("code,display_name")
      .in("code", taskTypeCodes)
      .returns<TaskTypeRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const code = normalizeOptionalString(row.code);

      if (!code) {
        return null;
      }

      return {
        code,
        display_name: normalizeOptionalString(row.display_name),
      };
    })
    .filter(
      (
        row,
      ): row is {
        code: string;
        display_name: string | null;
      } => row !== null,
    );
}

async function getTeamRecords(
  supabase: SupabaseClient,
  teamIds: string[],
): Promise<Array<{ id: string; team_name: string | null }>> {
  if (teamIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("team_profiles")
      .select("id,team_name")
      .in("id", teamIds)
      .returns<TeamRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const id = normalizeOptionalString(row.id);

      if (!id) {
        return null;
      }

      return {
        id,
        team_name: normalizeOptionalString(row.team_name),
      };
    })
    .filter(
      (
        row,
      ): row is {
        id: string;
        team_name: string | null;
      } => row !== null,
    );
}

function normalizeTaskCommissionRow(
  row: TaskCommissionRecord,
  userById: Map<string, OrderUserOption>,
  taskTypeByCode: Map<string, { code: string; display_name: string | null }>,
  teamById: Map<string, { id: string; team_name: string | null }>,
): TaskCommissionRow {
  const taskTypeName = taskTypeByCode.get(row.task_type_code)?.display_name ?? null;
  const teamName = row.team_id ? teamById.get(row.team_id)?.team_name ?? null : null;

  return {
    id: row.id,
    taskId: row.task_id,
    reviewSubmissionId: normalizeOptionalString(row.review_submission_id),
    taskTypeCode: row.task_type_code,
    taskTypeName,
    taskName: row.task_name_snapshot,
    taskScope: row.task_scope,
    teamId: normalizeOptionalString(row.team_id),
    teamName,
    beneficiary: buildActor(row.beneficiary_user_id, userById),
    approvedBy: buildOptionalActor(row.approved_by_user_id, userById),
    commissionAmountRmb: parseNumericValue(row.commission_amount_rmb) ?? 0,
    settlementStatus: row.settlement_status,
    settlementNote: normalizeOptionalString(row.settlement_note),
    settledAt: normalizeOptionalString(row.settled_at),
    createdAt: normalizeOptionalString(row.created_at),
    updatedAt: normalizeOptionalString(row.updated_at),
    calculationSnapshot: row.calculation_snapshot,
  };
}

function normalizeTaskCommissionRecord(
  value: unknown,
): TaskCommissionRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const id = "id" in value ? normalizeOptionalString(value.id) : null;
  const taskId = "task_id" in value ? normalizeOptionalString(value.task_id) : null;
  const beneficiaryUserId =
    "beneficiary_user_id" in value
      ? normalizeOptionalString(value.beneficiary_user_id)
      : null;
  const taskTypeCode =
    "task_type_code" in value ? normalizeOptionalString(value.task_type_code) : null;
  const taskName =
    "task_name_snapshot" in value
      ? normalizeOptionalString(value.task_name_snapshot)
      : null;
  const taskScope =
    "task_scope" in value && (value.task_scope === "public" || value.task_scope === "team")
      ? value.task_scope
      : null;
  const settlementStatus =
    "settlement_status" in value && isTaskCommissionSettlementStatus(value.settlement_status)
      ? value.settlement_status
      : null;

  if (!id || !taskId || !beneficiaryUserId || !taskTypeCode || !taskName || !taskScope || !settlementStatus) {
    return null;
  }

  return {
    id,
    task_id: taskId,
    review_submission_id:
      "review_submission_id" in value
        ? normalizeOptionalString(value.review_submission_id)
        : null,
    beneficiary_user_id: beneficiaryUserId,
    approved_by_user_id:
      "approved_by_user_id" in value
        ? normalizeOptionalString(value.approved_by_user_id)
        : null,
    task_type_code: taskTypeCode,
    task_name_snapshot: taskName,
    task_scope: taskScope,
    team_id: "team_id" in value ? normalizeOptionalString(value.team_id) : null,
    commission_amount_rmb:
      "commission_amount_rmb" in value
        && (typeof value.commission_amount_rmb === "number"
          || typeof value.commission_amount_rmb === "string")
        ? value.commission_amount_rmb
        : null,
    calculation_snapshot:
      "calculation_snapshot" in value ? value.calculation_snapshot : null,
    settlement_status: settlementStatus,
    settled_at: "settled_at" in value ? normalizeOptionalString(value.settled_at) : null,
    settlement_note:
      "settlement_note" in value ? normalizeOptionalString(value.settlement_note) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    updated_at: "updated_at" in value ? normalizeOptionalString(value.updated_at) : null,
  };
}

function buildOptionalActor(
  userId: string | null,
  userById: Map<string, OrderUserOption>,
) {
  const normalizedUserId = normalizeOptionalString(userId);

  if (!normalizedUserId) {
    return null;
  }

  return buildActor(normalizedUserId, userById);
}

function buildActor(
  userId: string | null,
  userById: Map<string, OrderUserOption>,
): TaskCommissionActor {
  const normalizedUserId = normalizeOptionalString(userId);
  const profile = normalizedUserId ? userById.get(normalizedUserId) : undefined;
  const name = normalizeOptionalString(profile?.name);
  const email = normalizeOptionalString(profile?.email);

  return {
    userId: normalizedUserId,
    label:
      name
      ?? email
      ?? (normalizedUserId ? getFallbackUserLabel(normalizedUserId) : "用户"),
    name,
    email,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
  };
}

function parseNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isTaskCommissionSettlementStatus(
  value: unknown,
): value is TaskCommissionSettlementStatus {
  return (
    value === "pending"
    || value === "paid"
    || value === "cancelled"
    || value === "reversed"
  );
}

function getFallbackUserLabel(userId: string) {
  return `用户 ${userId.slice(0, 8)}`;
}
