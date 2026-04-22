import { type AdminOrderDetailValue } from "@/lib/admin-orders";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

import { type OrdersUiCopy } from "./admin-orders-copy";

type FlattenedOrderDetailItem = {
  label: string;
  value: string;
};

export function flattenOrderDetailItems(
  value: AdminOrderDetailValue,
  locale: Locale = DEFAULT_LOCALE,
  copy: OrdersUiCopy,
): FlattenedOrderDetailItem[] {
  return flattenOrderDetailValue(value, undefined, locale, copy);
}

function flattenOrderDetailValue(
  value: AdminOrderDetailValue,
  parentLabel?: string,
  locale: Locale = DEFAULT_LOCALE,
  copy?: OrdersUiCopy,
): FlattenedOrderDetailItem[] {
  const safeCopy = copy;

  if (!safeCopy) {
    throw new Error("OrdersUiCopy is required when flattening order detail items.");
  }

  if (value === null) {
    return parentLabel ? [{ label: parentLabel, value: "-" }] : [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [
      {
        label: parentLabel ?? safeCopy.fallback.formContent,
        value: formatOrderDetailPrimitive(value, locale, safeCopy),
      },
    ];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return parentLabel ? [{ label: parentLabel, value: "-" }] : [];
    }

    if (value.every(isOrderDetailPrimitive)) {
      return [
        {
          label: parentLabel ?? safeCopy.fallback.formContent,
          value: value
            .map((item) => formatOrderDetailPrimitive(item, locale, safeCopy))
            .join(locale === "en" ? ", " : "、"),
        },
      ];
    }

    return value.flatMap((item, index) =>
      flattenOrderDetailValue(
        item,
        parentLabel
          ? `${parentLabel} / ${safeCopy.fallback.item(index + 1)}`
          : safeCopy.fallback.item(index + 1),
        locale,
        safeCopy,
      ),
    );
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return parentLabel ? [{ label: parentLabel, value: "-" }] : [];
  }

  return entries.flatMap(([key, childValue]) =>
    flattenOrderDetailValue(
      childValue,
      parentLabel ? `${parentLabel} / ${formatOrderDetailKey(key)}` : formatOrderDetailKey(key),
      locale,
      safeCopy,
    ),
  );
}

function isOrderDetailPrimitive(
  value: AdminOrderDetailValue,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function formatOrderDetailPrimitive(
  value: string | number | boolean | null,
  locale: Locale = DEFAULT_LOCALE,
  copy?: OrdersUiCopy,
) {
  const safeCopy = copy;

  if (!safeCopy) {
    throw new Error("OrdersUiCopy is required when formatting order detail values.");
  }

  if (value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? safeCopy.fallback.yes : safeCopy.fallback.no;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
      maximumFractionDigits: 6,
    }).format(value);
  }

  const normalizedValue = value.trim();
  return normalizedValue || "-";
}

function formatOrderDetailKey(key: string) {
  const normalizedKey = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!normalizedKey) {
    return key;
  }

  return normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
}
