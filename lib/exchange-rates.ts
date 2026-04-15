import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";

const EXCHANGE_RATE_SELECT =
  "id,original_currency,target_currency,daily_exchange_rate,created_at";

const READABLE_EXCHANGE_RATE_ROLES = new Set<AppRole>([
  "administrator",
  "operator",
  "manager",
  "salesman",
  "finance",
  "client",
]);

export type ExchangeRateRow = {
  id: string;
  original_currency: string | null;
  target_currency: string | null;
  daily_exchange_rate: number | string | null;
  created_at: string | null;
};

export type ExchangeRateLatestRow = ExchangeRateRow & {
  historyCount: number;
  pairKey: string;
  pairLabel: string;
};

export type ExchangeRateFormInput = {
  originalCurrency: string;
  targetCurrency: string;
  dailyExchangeRate: number;
};

export type ExchangeRateViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export async function getCurrentExchangeRateViewerContext(
  supabase: SupabaseClient,
): Promise<ExchangeRateViewerContext | null> {
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

export function canReadExchangeRatesByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return role === "administrator" || (!!role && READABLE_EXCHANGE_RATE_ROLES.has(role) && status === "active");
}

export function canManageExchangeRatesByRole(role: AppRole | null) {
  return role === "administrator";
}

export async function getExchangeRates(
  supabase: SupabaseClient,
  limit = MAX_DASHBOARD_QUERY_ROWS,
): Promise<ExchangeRateRow[]> {
  const { from, to } = getDashboardQueryRange(limit);
  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate")
      .select(EXCHANGE_RATE_SELECT)
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<ExchangeRateRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createExchangeRate(
  supabase: SupabaseClient,
  input: ExchangeRateFormInput,
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate")
      .insert(toExchangeRatePayload(input))
      .select(EXCHANGE_RATE_SELECT)
      .maybeSingle<ExchangeRateRow>(),
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("创建汇率记录失败，请稍后重试。");
  }

  return data;
}

export async function updateExchangeRate(
  supabase: SupabaseClient,
  rateId: string,
  input: ExchangeRateFormInput,
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate")
      .update(toExchangeRatePayload(input))
      .eq("id", rateId)
      .select(EXCHANGE_RATE_SELECT)
      .maybeSingle<ExchangeRateRow>(),
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("未找到需要更新的汇率记录。");
  }

  return data;
}

export async function deleteExchangeRate(
  supabase: SupabaseClient,
  rateId: string,
) {
  const { error } = await withRequestTimeout(
    supabase.from("exchange_rate").delete().eq("id", rateId),
  );

  if (error) {
    throw error;
  }
}

export function buildExchangeRateLatestRows(rows: ExchangeRateRow[]) {
  const groupedRows = new Map<
    string,
    {
      historyCount: number;
      latestRow: ExchangeRateRow;
    }
  >();

  for (const row of sortExchangeRateRows(rows)) {
    const pairKey = getExchangeRatePairKey(row.original_currency, row.target_currency);
    const groupedRow = groupedRows.get(pairKey);

    if (groupedRow) {
      groupedRow.historyCount += 1;
      continue;
    }

    groupedRows.set(pairKey, {
      historyCount: 1,
      latestRow: row,
    });
  }

  return Array.from(groupedRows.entries()).map(([pairKey, value]) => ({
    ...value.latestRow,
    historyCount: value.historyCount,
    pairKey,
    pairLabel: getExchangeRatePairLabel(
      value.latestRow.original_currency,
      value.latestRow.target_currency,
    ),
  })) satisfies ExchangeRateLatestRow[];
}

export function sortExchangeRateRows(rows: ExchangeRateRow[]) {
  return [...rows].sort((left, right) => {
    return toComparableTimestamp(right.created_at) - toComparableTimestamp(left.created_at);
  });
}

export function normalizeCurrencyCode(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

export function getExchangeRatePairKey(
  originalCurrency: string | null | undefined,
  targetCurrency: string | null | undefined,
) {
  return `${normalizeCurrencyCode(originalCurrency)}:${normalizeCurrencyCode(targetCurrency)}`;
}

export function getExchangeRatePairLabel(
  originalCurrency: string | null | undefined,
  targetCurrency: string | null | undefined,
) {
  const original = normalizeCurrencyCode(originalCurrency) || "未知货币";
  const target = normalizeCurrencyCode(targetCurrency) || "未知货币";

  return `${original}/${target}`;
}

function toExchangeRatePayload(input: ExchangeRateFormInput) {
  return {
    original_currency: normalizeCurrencyCode(input.originalCurrency),
    target_currency: normalizeCurrencyCode(input.targetCurrency),
    daily_exchange_rate: input.dailyExchangeRate,
  };
}

function toComparableTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
