import type {
  WholesaleCustomer,
  WholesaleProfile,
} from "@/lib/wholesale";
import type { WholesaleLogisticsStatusKind } from "@/lib/wholesale-logistics-statuses";

export const WHOLESALE_STATUS_LABELS = {
  cancelled: "已取消",
  pending: "待结算",
  registered_account: "已注册账号",
  sales_created: "业务员登记",
  settled: "已结算",
} as const;

export const WHOLESALE_ORDER_STATUS_LABELS = {
  settled: "已结汇",
  unsettled: "未结汇",
} as const;

export const WHOLESALE_LOGISTICS_STATUS_LABELS: Record<
  WholesaleLogisticsStatusKind,
  string
> = {
  checking: "核对中",
  delivered: "已送达",
  exception: "异常",
  stopped: "已停止",
};

export function formatCurrency(value: number | null | undefined, currency = "CNY") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("zh-CN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatOptionalCurrency(
  value: number | null | undefined,
  fallback = "结汇后计算",
  currency = "CNY",
) {
  return value === null || value === undefined
    ? fallback
    : formatCurrency(value, currency);
}

export function formatOptionalNumber(
  value: number | null | undefined,
  fallback = "未记录",
) {
  return value === null || value === undefined ? fallback : formatNumber(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "未产生";
  }

  return `${(value * 100).toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getCustomerName(
  customersById: Map<string, WholesaleCustomer>,
  customerId: string | null | undefined,
) {
  if (!customerId) {
    return "未归属客户";
  }

  return customersById.get(customerId)?.unique_name ?? "未归属客户";
}

export function getProfileName(
  profilesById: Map<string, WholesaleProfile>,
  userId: string | null | undefined,
) {
  if (!userId) {
    return "未分配";
  }

  const profile = profilesById.get(userId);

  return profile?.name || profile?.email || "未分配";
}
