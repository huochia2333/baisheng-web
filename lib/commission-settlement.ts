import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import { normalizeOptionalString } from "./value-normalizers";

export async function markCommissionRecordAsPaid(
  supabase: SupabaseClient,
  options: {
    commissionRecordId: string;
    settlementNote?: string | null;
  },
) {
  const commissionRecordId = normalizeOptionalString(options.commissionRecordId);

  if (!commissionRecordId) {
    throw new Error("Commission record id is required.");
  }

  const { data, error } = await withRequestTimeout(
    supabase.rpc("update_commission_settlement", {
      p_commission_record_id: commissionRecordId,
      p_settlement_status: "paid",
      p_settled_at: null,
      p_settlement_note: normalizeOptionalString(options.settlementNote),
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeOptionalString(data) ?? commissionRecordId;
}

export async function markTaskCommissionRecordAsPaid(
  supabase: SupabaseClient,
  options: {
    taskCommissionRecordId: string;
    settlementNote?: string | null;
  },
) {
  const taskCommissionRecordId = normalizeOptionalString(
    options.taskCommissionRecordId,
  );

  if (!taskCommissionRecordId) {
    throw new Error("Task commission record id is required.");
  }

  const { data, error } = await withRequestTimeout(
    supabase.rpc("update_task_commission_settlement", {
      p_task_commission_record_id: taskCommissionRecordId,
      p_settlement_status: "paid",
      p_settled_at: null,
      p_settlement_note: normalizeOptionalString(options.settlementNote),
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeOptionalString(data) ?? taskCommissionRecordId;
}
