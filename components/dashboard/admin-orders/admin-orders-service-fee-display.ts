import type { ServiceFeeScope, ServiceFeeTypeOption } from "@/lib/service-fee-types";

import { formatDiscountRatioValue } from "./admin-orders-display";

type DiscountLocale = Parameters<typeof formatDiscountRatioValue>[1];

export function sortServiceFeeRows(rows: ServiceFeeTypeOption[]) {
  return [...rows].sort((left, right) => {
    const leftOrder = Number.isFinite(left.sort_order) ? left.sort_order : 999;
    const rightOrder = Number.isFinite(right.sort_order) ? right.sort_order : 999;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.display_name.localeCompare(right.display_name, "zh-CN");
  });
}

export function getServiceFeeRowsByScope(
  rows: ServiceFeeTypeOption[],
  scope: ServiceFeeScope,
) {
  return sortServiceFeeRows(rows).filter((row) => row.fee_scope === scope);
}

export function formatServiceFeeTypeLabel(
  option: ServiceFeeTypeOption,
  locale: DiscountLocale,
) {
  const rate = formatDiscountRatioValue(option.fee_ratio, locale);
  return `${option.display_name}（${rate}）`;
}
