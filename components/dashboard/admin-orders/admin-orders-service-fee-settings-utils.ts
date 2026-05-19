import type { ServiceFeeTypeOption } from "@/lib/service-fee-types";

export type ServiceFeeValidationKey =
  | "settings.serviceFees.validation.invalid"
  | "settings.serviceFees.validation.range";

export type ServiceFeeErrorKey =
  | "settings.serviceFees.errors.duplicate"
  | "settings.serviceFees.errors.inUse"
  | "settings.serviceFees.errors.permission"
  | "settings.serviceFees.errors.unknown";

type ServiceFeeErrorTranslator = (key: ServiceFeeErrorKey) => string;

export function sortServiceFeeRows(rows: ServiceFeeTypeOption[]) {
  return [...rows].sort((left, right) => {
    const leftValue = parseRatio(left.fee_ratio) ?? 0;
    const rightValue = parseRatio(right.fee_ratio) ?? 0;

    return rightValue - leftValue;
  });
}

export function parseServiceFeeInput(
  value: string,
): { ok: true; value: number } | { ok: false; messageKey: ServiceFeeValidationKey } {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return { ok: false, messageKey: "settings.serviceFees.validation.invalid" };
  }

  const ratio = parsed > 1 ? parsed / 100 : parsed;

  if (ratio <= 0 || ratio > 1) {
    return { ok: false, messageKey: "settings.serviceFees.validation.range" };
  }

  return { ok: true, value: Math.round(ratio * 10000) / 10000 };
}

export function formatRatioForInput(value: number | string | null | undefined) {
  const ratio = parseRatio(value);

  if (ratio === null) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
    useGrouping: false,
  }).format(ratio * 100);
}

export function toServiceFeeErrorMessage(
  error: unknown,
  t: ServiceFeeErrorTranslator,
) {
  const errorLike = error as { code?: string; message?: string };
  const code = errorLike?.code ?? "";
  const message = errorLike?.message?.toLowerCase() ?? "";

  if (code === "23505" || message.includes("duplicate")) {
    return t("settings.serviceFees.errors.duplicate");
  }

  if (code === "23503" || message.includes("foreign key")) {
    return t("settings.serviceFees.errors.inUse");
  }

  if (message.includes("permission") || message.includes("policy")) {
    return t("settings.serviceFees.errors.permission");
  }

  return t("settings.serviceFees.errors.unknown");
}

function parseRatio(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}
