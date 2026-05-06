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
  "id,original_currency,target_currency,daily_exchange_rate,created_at,rate_date,source,fetched_at,provider_updated_at";

const EXCHANGE_RATE_SYNC_TIMEOUT_MS = 30_000;

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
  rate_date: string | null;
  source: string | null;
  fetched_at: string | null;
  provider_updated_at: string | null;
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

export type ExchangeRatesPageMode = "manage" | "readonly";

export type ExchangeRateSyncSettingsRow = {
  id: boolean;
  is_enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

export type ExchangeRateSyncPairRow = {
  id: string;
  base_currency: string;
  target_currency: "CNY";
  is_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
};

export type ExchangeRateSyncState = {
  settings: ExchangeRateSyncSettingsRow;
  pairs: ExchangeRateSyncPairRow[];
};

export type ManualExchangeRateFetchItem = {
  baseCurrency: string;
  targetCurrency: "CNY";
  ok: boolean;
  rate?: number;
  rateDate?: string;
  message?: string;
};

export type ManualExchangeRateFetchResult = {
  results: ManualExchangeRateFetchItem[];
  successCount: number;
};

export type ExchangeRatesPageData = {
  hasPermission: boolean;
  rates: ExchangeRateRow[];
  syncState: ExchangeRateSyncState | null;
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

export function canViewExchangeRatesPage(
  mode: ExchangeRatesPageMode,
  role: AppRole | null,
  status: UserStatus | null,
) {
  return mode === "manage"
    ? canManageExchangeRatesByRole(role)
    : canReadExchangeRatesByRole(role, status);
}

export async function getExchangeRatesPageData(
  supabase: SupabaseClient,
  mode: ExchangeRatesPageMode,
): Promise<ExchangeRatesPageData> {
  const viewer = await getCurrentExchangeRateViewerContext(supabase);

  if (!viewer || !canViewExchangeRatesPage(mode, viewer.role, viewer.status)) {
    return {
      hasPermission: false,
      rates: [],
      syncState: null,
    };
  }

  const [rates, syncState] = await Promise.all([
    getExchangeRates(supabase),
    mode === "manage" ? getExchangeRateSyncState(supabase) : Promise.resolve(null),
  ]);

  return {
    hasPermission: true,
    rates,
    syncState,
  };
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

export async function getTodayCnyExchangeRates(
  supabase: SupabaseClient,
): Promise<ExchangeRateRow[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate")
      .select(EXCHANGE_RATE_SELECT)
      .eq("target_currency", "CNY")
      .eq("rate_date", getBeijingDateString())
      .order("fetched_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<ExchangeRateRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getExchangeRateSyncState(
  supabase: SupabaseClient,
): Promise<ExchangeRateSyncState> {
  const [settingsResult, pairsResult] = await Promise.all([
    withRequestTimeout(
      supabase
        .from("exchange_rate_sync_settings")
        .select("id,is_enabled,updated_at,updated_by")
        .eq("id", true)
        .maybeSingle<ExchangeRateSyncSettingsRow>(),
    ),
    withRequestTimeout(
      supabase
        .from("exchange_rate_sync_pairs")
        .select("id,base_currency,target_currency,is_enabled,created_at,updated_at,created_by")
        .order("created_at", { ascending: true })
        .returns<ExchangeRateSyncPairRow[]>(),
    ),
  ]);

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  if (pairsResult.error) {
    throw pairsResult.error;
  }

  return {
    settings:
      settingsResult.data ?? {
        id: true,
        is_enabled: false,
        updated_at: null,
        updated_by: null,
      },
    pairs: pairsResult.data ?? [],
  };
}

export async function setExchangeRateAutoSyncEnabled(
  supabase: SupabaseClient,
  enabled: boolean,
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate_sync_settings")
      .upsert({ id: true, is_enabled: enabled }, { onConflict: "id" })
      .select("id,is_enabled,updated_at,updated_by")
      .maybeSingle<ExchangeRateSyncSettingsRow>(),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function addExchangeRateSyncPair(
  supabase: SupabaseClient,
  baseCurrency: string,
) {
  const normalizedBaseCurrency = normalizeCurrencyCode(baseCurrency);

  if (!/^[A-Z]{3}$/.test(normalizedBaseCurrency)) {
    throw new Error("请输入 3 位货币代码，例如 USD。");
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("exchange_rate_sync_pairs")
      .upsert(
        {
          base_currency: normalizedBaseCurrency,
          target_currency: "CNY",
          is_enabled: true,
        },
        { onConflict: "base_currency,target_currency" },
      )
      .select("id,base_currency,target_currency,is_enabled,created_at,updated_at,created_by")
      .maybeSingle<ExchangeRateSyncPairRow>(),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function removeExchangeRateSyncPair(
  supabase: SupabaseClient,
  pairId: string,
) {
  const { error } = await withRequestTimeout(
    supabase.from("exchange_rate_sync_pairs").delete().eq("id", pairId),
  );

  if (error) {
    throw error;
  }
}

export async function triggerManualExchangeRateFetch(
  supabase: SupabaseClient,
  baseCurrencies: string[],
): Promise<ManualExchangeRateFetchResult> {
  const normalizedBaseCurrencies = normalizeCurrencyList(baseCurrencies);

  if (normalizedBaseCurrencies.length === 0) {
    throw new Error("请至少填写一个要获取的币种。");
  }

  const { data, error } = await withRequestTimeout(
    supabase.functions.invoke("exchange-rate-sync", {
      body: {
        trigger: "manual",
        baseCurrencies: normalizedBaseCurrencies,
      },
    }),
    {
      timeoutMs: EXCHANGE_RATE_SYNC_TIMEOUT_MS,
      message: "今天的汇率暂时获取失败，请稍后重试或联系管理员。",
    },
  );

  if (error) {
    throw await toExchangeRateFunctionError(error);
  }

  const payload = data as Partial<ManualExchangeRateFetchResult> | null;

  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
    successCount:
      typeof payload?.successCount === "number"
        ? payload.successCount
        : Array.isArray(payload?.results)
          ? payload.results.filter((item) => item.ok).length
          : 0,
  };
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
    return toExchangeRateComparableTimestamp(right) - toExchangeRateComparableTimestamp(left);
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

export function getBeijingDateString(value = new Date()) {
  return new Date(value.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function findTodayCnyExchangeRate(
  rows: ExchangeRateRow[],
  baseCurrency: string,
) {
  const normalizedBaseCurrency = normalizeCurrencyCode(baseCurrency);
  const today = getBeijingDateString();

  if (normalizedBaseCurrency === "CNY") {
    return {
      id: "cny-cny-today",
      original_currency: "CNY",
      target_currency: "CNY",
      daily_exchange_rate: 1,
      created_at: null,
      rate_date: today,
      source: "system",
      fetched_at: null,
      provider_updated_at: null,
    } satisfies ExchangeRateRow;
  }

  return sortExchangeRateRows(rows).find(
    (row) =>
      normalizeCurrencyCode(row.original_currency) === normalizedBaseCurrency &&
      normalizeCurrencyCode(row.target_currency) === "CNY" &&
      row.rate_date === today,
  ) ?? null;
}

export function normalizeCurrencyList(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeCurrencyCode(value))
        .filter((value) => /^[A-Z]{3}$/.test(value)),
    ),
  );
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

function toExchangeRateComparableTimestamp(row: ExchangeRateRow) {
  return (
    toComparableTimestamp(row.fetched_at) ||
    toComparableTimestamp(row.provider_updated_at) ||
    toComparableTimestamp(row.created_at)
  );
}

async function toExchangeRateFunctionError(error: unknown) {
  const response = getFunctionErrorResponse(error);

  if (response) {
    try {
      const payload = (await response.clone().json()) as {
        error?: string;
        message?: string;
      };
      const message =
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message.trim()
          : typeof payload.error === "string" && payload.error.trim()
            ? payload.error.trim()
            : null;

      if (message) {
        return new Error(message);
      }
    } catch {
      // Fall through to the original function client error.
    }
  }

  return error instanceof Error
    ? error
    : new Error("今天的汇率暂时获取失败，请稍后重试或联系管理员。");
}

function getFunctionErrorResponse(error: unknown) {
  if (typeof error !== "object" || error === null || !("context" in error)) {
    return null;
  }

  const { context } = error as { context?: unknown };
  return context instanceof Response ? context : null;
}
