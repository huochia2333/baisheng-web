import { type OrderUserOption } from "@/lib/admin-orders";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

import { normalizeOptionalString } from "../dashboard-shared-ui";

import {
  type OrdersUiCopy,
  PURCHASE_SUBTYPE_KEYS,
  SERVICE_SUBTYPE_KEYS,
} from "./admin-orders-copy";

const SERVICE_SUBTYPE_COST_PRESETS: Record<string, string> = {
  tour_escort: "400",
  medical_escort: "600",
  digital_survival: "300",
};

function getPurchaseSubtypeLabel(
  value: keyof typeof PURCHASE_SUBTYPE_KEYS,
  copy: OrdersUiCopy,
) {
  return copy.subtypes.purchase[value];
}

function getServiceSubtypeLabel(
  value: keyof typeof SERVICE_SUBTYPE_KEYS,
  copy: OrdersUiCopy,
) {
  return copy.subtypes.service[value];
}

export function formatEditableNumericValue(
  value: number | string | null | undefined,
) {
  if (typeof value === "number") {
    return String(value);
  }

  return normalizeOptionalString(value) ?? "";
}

export function getOrderUserOptionLabel(option: OrderUserOption) {
  const normalizedName = normalizeOptionalString(option.name);
  const normalizedEmail = normalizeOptionalString(option.email);

  if (normalizedName && normalizedEmail) {
    return `${normalizedName} / ${normalizedEmail}`;
  }

  return normalizedName ?? normalizedEmail ?? option.user_id;
}

export function resolveOrderUserLabel(
  value: string | null,
  userLabelById: Map<string, string>,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "-";
  }

  return userLabelById.get(normalizedValue) ?? normalizedValue;
}

export function getOrderTypeMetaFromCategory(
  category: string | null | undefined,
  copy: OrdersUiCopy,
) {
  const normalizedCategory = normalizeOptionalString(category);

  if (normalizedCategory === "purchase") {
    return { label: copy.categories.purchase, tone: "blue" as const };
  }

  if (normalizedCategory === "dropshipping") {
    return { label: copy.categories.dropshipping, tone: "gold" as const };
  }

  if (normalizedCategory === "service") {
    return { label: copy.categories.service, tone: "green" as const };
  }

  return {
    label: normalizedCategory ?? copy.fallback.notProvided,
    tone: "default" as const,
  };
}

export function resolveOrderTypeMeta(
  value: string | null,
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>,
  copy: OrdersUiCopy,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return getOrderTypeMetaFromCategory(null, copy);
  }

  return (
    orderTypeMetaById.get(normalizedValue) ??
    getOrderTypeMetaFromCategory(normalizedValue, copy)
  );
}

export function formatPurchaseOrderSubtype(
  value: string | null | undefined,
  copy: OrdersUiCopy,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return copy.fallback.notProvided;
  }

  const matchedKey =
    PURCHASE_SUBTYPE_KEYS[normalizedValue as keyof typeof PURCHASE_SUBTYPE_KEYS];

  return matchedKey
    ? getPurchaseSubtypeLabel(
        normalizedValue as keyof typeof PURCHASE_SUBTYPE_KEYS,
        copy,
      )
    : normalizedValue;
}

export function formatServiceOrderSubtype(
  value: string | null | undefined,
  copy: OrdersUiCopy,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return copy.fallback.notProvided;
  }

  const matchedKey =
    SERVICE_SUBTYPE_KEYS[normalizedValue as keyof typeof SERVICE_SUBTYPE_KEYS];

  return matchedKey
    ? getServiceSubtypeLabel(
        normalizedValue as keyof typeof SERVICE_SUBTYPE_KEYS,
        copy,
      )
    : normalizedValue;
}

export function getServiceSubtypeCostPreset(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  return SERVICE_SUBTYPE_COST_PRESETS[normalizedValue] ?? null;
}

export function formatDiscountRatioValue(
  value: number | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
  copy?: OrdersUiCopy,
) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return copy?.fallback.notProvided ?? "-";
  }

  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(parsed);
}

export function getStatusLabel(
  status: string | null | undefined,
  copy: OrdersUiCopy,
) {
  const normalizedStatus = normalizeOptionalString(status);

  if (!normalizedStatus) {
    return copy.fallback.notProvided;
  }

  if (normalizedStatus === "pending") return copy.status.pending;
  if (normalizedStatus === "in_progress") return copy.status.inProgress;
  if (normalizedStatus === "settled") return copy.status.settled;
  if (normalizedStatus === "completed") return copy.status.completed;
  if (normalizedStatus === "cancelled") return copy.status.cancelled;
  if (normalizedStatus === "refunding") return copy.status.refunding;

  return normalizedStatus;
}

export function formatCurrencyCode(value: string | null | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : "-";
}

export function formatMoneyValue(
  value: number | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
  }).format(parsed);
}

export function formatRateValue(
  value: number | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  }).format(parsed);
}

export function parseNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
