import type {
  ExchangeRateFormInput,
  ExchangeRateRow,
} from "@/lib/exchange-rates";

import { normalizeCurrencyCode } from "@/lib/exchange-rates";
import {
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/locale";

import {
  getRawErrorMessage,
  toErrorMessage,
} from "../dashboard-shared-ui";

export type ExchangeRateFormState = {
  dailyExchangeRate: string;
  originalCurrency: string;
  targetCurrency: string;
};

type ExchangeRateTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type ExchangeRateCopy = {
  dialogs: {
    dailyExchangeRateLabel: string;
  };
  errors: {
    duplicateKey: string;
    permission: string;
    positiveRate: string;
  };
  summary: {
    noRecord: string;
  };
  validation: {
    greaterThanZero: (label: string) => string;
    inputPrompt: (label: string) => string;
    invalidFormat: (label: string) => string;
    originalCurrencyRequired: string;
    targetCurrencyRequired: string;
  };
};

export function createExchangeRateCopy(
  t: ExchangeRateTranslator,
): ExchangeRateCopy {
  return {
    dialogs: {
      dailyExchangeRateLabel: t("dialogs.fields.dailyExchangeRate"),
    },
    errors: {
      duplicateKey: t("errors.duplicateKey"),
      permission: t("errors.permission"),
      positiveRate: t("errors.positiveRate"),
    },
    summary: {
      noRecord: t("summary.noRecord"),
    },
    validation: {
      greaterThanZero: (label) => t("validation.greaterThanZero", { label }),
      inputPrompt: (label) => t("validation.inputPrompt", { label }),
      invalidFormat: (label) => t("validation.invalidFormat", { label }),
      originalCurrencyRequired: t("validation.originalCurrencyRequired"),
      targetCurrencyRequired: t("validation.targetCurrencyRequired"),
    },
  };
}

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
  copy: ExchangeRateCopy,
):
  | { ok: true; payload: ExchangeRateFormInput }
  | { ok: false; message: string } {
  const originalCurrency = normalizeCurrencyCode(formState.originalCurrency);
  const targetCurrency = normalizeCurrencyCode(formState.targetCurrency);

  if (!originalCurrency) {
    return {
      ok: false,
      message: copy.validation.originalCurrencyRequired,
    };
  }

  if (!targetCurrency) {
    return {
      ok: false,
      message: copy.validation.targetCurrencyRequired,
    };
  }

  const dailyExchangeRate = parsePositiveNumber(
    formState.dailyExchangeRate,
    copy.dialogs.dailyExchangeRateLabel,
    copy,
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

export function formatExchangeRateValue(
  value: number | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
  noRecordLabel = "",
) {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return noRecordLabel;
  }

  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
  }).format(numericValue);
}

export function toExchangeRateErrorMessage(
  error: unknown,
  copy: ExchangeRateCopy,
) {
  const rawMessage = getRawErrorMessage(error);
  const message = toErrorMessage(error);

  if (rawMessage.includes("duplicate key")) {
    return copy.errors.duplicateKey;
  }

  if (rawMessage.includes("exchange_rate_daily_exchange_rate_positive")) {
    return copy.errors.positiveRate;
  }

  if (rawMessage.includes("row-level security")) {
    return copy.errors.permission;
  }

  return message;
}

export function isExchangeRatePermissionMessage(
  message: string,
  permissionMessage: string,
) {
  return (
    message.includes("row-level security") ||
    message.includes("permission to view or manage FX rate data") ||
    message.includes(permissionMessage)
  );
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

function parsePositiveNumber(
  value: string,
  label: string,
  copy: ExchangeRateCopy,
) {
  const normalized = value.trim();

  if (!normalized) {
    return copy.validation.inputPrompt(label);
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return copy.validation.invalidFormat(label);
  }

  if (parsed <= 0) {
    return copy.validation.greaterThanZero(label);
  }

  return parsed;
}
