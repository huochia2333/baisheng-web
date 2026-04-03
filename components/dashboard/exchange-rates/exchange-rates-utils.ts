import type {
  ExchangeRateFormInput,
  ExchangeRateRow,
} from "@/lib/exchange-rates";

import { normalizeCurrencyCode } from "@/lib/exchange-rates";

import { toErrorMessage } from "../dashboard-shared-ui";

export type ExchangeRateFormState = {
  dailyExchangeRate: string;
  originalCurrency: string;
  targetCurrency: string;
};

export function createExchangeRateFormState(
  defaults?: Partial<ExchangeRateFormState>,
): ExchangeRateFormState {
  return {
    dailyExchangeRate: defaults?.dailyExchangeRate ?? "",
    originalCurrency: defaults?.originalCurrency ?? "",
    targetCurrency: defaults?.targetCurrency ?? "",
  };
}

export function createExchangeRateFormStateFromRow(
  row: ExchangeRateRow,
): ExchangeRateFormState {
  return {
    dailyExchangeRate: formatEditableExchangeRateValue(row.daily_exchange_rate),
    originalCurrency: normalizeCurrencyCode(row.original_currency),
    targetCurrency: normalizeCurrencyCode(row.target_currency),
  };
}

export function parseExchangeRateForm(
  formState: ExchangeRateFormState,
):
  | { ok: true; payload: ExchangeRateFormInput }
  | { ok: false; message: string } {
  const originalCurrency = normalizeCurrencyCode(formState.originalCurrency);
  const targetCurrency = normalizeCurrencyCode(formState.targetCurrency);

  if (!originalCurrency) {
    return { ok: false, message: "请输入原始货币代码。" };
  }

  if (!targetCurrency) {
    return { ok: false, message: "请输入目标货币代码。" };
  }

  const dailyExchangeRate = parsePositiveNumber(
    formState.dailyExchangeRate,
    "汇率值",
  );

  if (typeof dailyExchangeRate === "string") {
    return { ok: false, message: dailyExchangeRate };
  }

  return {
    ok: true,
    payload: {
      dailyExchangeRate,
      originalCurrency,
      targetCurrency,
    },
  };
}

export function formatExchangeRateValue(value: number | string | null | undefined) {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return "暂无记录";
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 6,
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
  }).format(numericValue);
}

export function toExchangeRateErrorMessage(error: unknown) {
  const message = toErrorMessage(error);

  if (message.includes("duplicate key")) {
    return "当前汇率记录保存失败，请检查是否存在重复主键后重试。";
  }

  if (message.includes("exchange_rate_daily_exchange_rate_positive")) {
    return "汇率值必须大于 0。";
  }

  if (message.includes("row-level security")) {
    return "当前账号没有查看或操作汇率数据的权限。";
  }

  return message;
}

function formatEditableExchangeRateValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function parsePositiveNumber(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return `请输入${label}。`;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return `${label}格式不正确。`;
  }

  if (parsed <= 0) {
    return `${label}必须大于 0。`;
  }

  return parsed;
}
