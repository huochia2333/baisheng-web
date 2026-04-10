import {
  type AdminOrderDetailValue,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type CreateAdminOrderInput,
  type OrderUserOption,
} from "@/lib/admin-orders";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import { normalizeOptionalString, toErrorMessage } from "../dashboard-shared-ui";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "待处理" },
  { value: "in_progress", label: "处理中" },
  { value: "settled", label: "已结算" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
  { value: "refunding", label: "退款中" },
] as const;

const SERVICE_SUBTYPE_COST_PRESETS: Record<string, string> = {
  tour_escort: "400",
  medical_escort: "600",
  digital_survival: "300",
};

type OrderFormState = {
  originalCurrency: string;
  amount: string;
  dailyExchangeRate: string;
  transactionRate: string;
  rmbAmount: string;
  costAmount: string;
  orderEntryUser: string;
  orderingUser: string;
  orderStatus: string;
  orderType: string;
  purchaseSubtype: string;
  purchaseDetails: string;
  serviceSubtype: string;
  serviceDiscount: string;
  serviceDetails: string;
};

function createOrderFormState(defaults?: {
  orderEntryUser?: string;
  orderType?: string;
}): OrderFormState {
  return {
    originalCurrency: "",
    amount: "",
    dailyExchangeRate: "",
    transactionRate: "",
    rmbAmount: "",
    costAmount: "",
    orderEntryUser: defaults?.orderEntryUser ?? "",
    orderingUser: "",
    orderStatus: "pending",
    orderType: defaults?.orderType ?? "",
    purchaseSubtype: "",
    purchaseDetails: "",
    serviceSubtype: "",
    serviceDiscount: "",
    serviceDetails: "",
  };
}

function createOrderFormStateFromOrder(
  order: AdminOrderRow,
  supplementaryDetail?: AdminOrderSupplementaryDetail | null,
): OrderFormState {
  return {
    originalCurrency: formatCurrencyCode(order.original_currency),
    amount: formatEditableNumericValue(order.amount),
    dailyExchangeRate: formatEditableNumericValue(order.daily_exchange_rate),
    transactionRate:
      formatEditableNumericValue(order.transaction_rate) ||
      deriveTransactionRateValue(order.daily_exchange_rate),
    rmbAmount: formatEditableNumericValue(order.rmb_amount),
    costAmount: formatEditableNumericValue(order.cost_amount),
    orderEntryUser: normalizeOptionalString(order.order_entry_user) ?? "",
    orderingUser: normalizeOptionalString(order.ordering_user) ?? "",
    orderStatus: normalizeOptionalString(order.order_status) ?? "pending",
    orderType: normalizeOptionalString(order.order_type) ?? "",
    purchaseSubtype:
      supplementaryDetail?.kind === "purchase" ? supplementaryDetail.subtypeId : "",
    purchaseDetails:
      supplementaryDetail?.kind === "purchase"
        ? stringifyOrderDetailsForTextarea(supplementaryDetail.details)
        : "",
    serviceSubtype:
      supplementaryDetail?.kind === "service" ? supplementaryDetail.subtypeId : "",
    serviceDiscount:
      supplementaryDetail?.kind === "service" ? supplementaryDetail.discountId : "",
    serviceDetails:
      supplementaryDetail?.kind === "service"
        ? stringifyOrderDetailsForTextarea(supplementaryDetail.details)
        : "",
  };
}

function applyOrderFormDefaults(
  formState: OrderFormState,
  defaults: {
    orderEntryUser: string;
    orderType: string;
  },
) {
  return {
    ...formState,
    orderEntryUser: formState.orderEntryUser || defaults.orderEntryUser,
    orderType: formState.orderType || defaults.orderType,
  };
}

function parseBaseOrderForm(
  formState: OrderFormState,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const originalCurrency = formState.originalCurrency.trim().toUpperCase();
  const orderEntryUser = formState.orderEntryUser.trim();
  const orderingUser = formState.orderingUser.trim();
  const orderStatus = formState.orderStatus.trim();
  const orderType = formState.orderType.trim();

  if (!originalCurrency) return { ok: false, message: "请输入原始货币。" };
  if (!orderEntryUser) return { ok: false, message: "请选择订单录入员。" };
  if (!orderingUser) return { ok: false, message: "请选择订单客户。" };
  if (!orderStatus) return { ok: false, message: "请选择订单状态。" };
  if (!orderType) return { ok: false, message: "请选择订单类型。" };

  const amount = parseRequiredNumber(formState.amount, "金额总计");
  const dailyExchangeRate = parseRequiredNumber(formState.dailyExchangeRate, "当日汇率");
  const transactionRate = parseRequiredNumber(
    deriveTransactionRateValue(formState.dailyExchangeRate) || formState.transactionRate,
    "公司成交汇率",
  );
  const rmbAmount = parseRequiredNumber(formState.rmbAmount, "人民币总计");
  const costAmount = parseOptionalNumber(formState.costAmount, "订单成本");

  if (typeof amount === "string") return { ok: false, message: amount };
  if (typeof dailyExchangeRate === "string") {
    return { ok: false, message: dailyExchangeRate };
  }
  if (typeof transactionRate === "string") {
    return { ok: false, message: transactionRate };
  }
  if (typeof rmbAmount === "string") return { ok: false, message: rmbAmount };
  if (typeof costAmount === "string") return { ok: false, message: costAmount };

  return {
    ok: true,
    payload: {
      originalCurrency,
      amount,
      dailyExchangeRate,
      transactionRate,
      rmbAmount,
      costAmount,
      orderEntryUser,
      orderingUser,
      orderStatus,
      orderType,
    },
  };
}

function deriveTransactionRateValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "";
  }

  const derived = (parsed * 0.99).toFixed(6);
  return derived.replace(/\.?0+$/, "");
}

function parseCreateOrderForm(
  formState: OrderFormState,
  orderCategoryByTypeId: Map<string, string | null>,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const baseParsed = parseBaseOrderForm(formState);

  if (!baseParsed.ok) {
    return baseParsed;
  }

  const orderCategory = orderCategoryByTypeId.get(formState.orderType.trim()) ?? null;

  if (orderCategory === "purchase") {
    const purchaseSubtype = formState.purchaseSubtype.trim();

    if (!purchaseSubtype) {
      return { ok: false, message: "请选择采购小类。" };
    }

    const purchaseDetails = parseFlexibleOrderDetails(formState.purchaseDetails, "采购订单明细");

    if (typeof purchaseDetails === "string") {
      return { ok: false, message: purchaseDetails };
    }

    return {
      ok: true,
      payload: {
        ...baseParsed.payload,
        supplementary: {
          kind: "purchase",
          subtypeId: purchaseSubtype,
          details: purchaseDetails,
        },
      },
    };
  }

  if (orderCategory === "service") {
    const serviceSubtype = formState.serviceSubtype.trim();
    const serviceDiscount = formState.serviceDiscount.trim();

    if (!serviceSubtype) {
      return { ok: false, message: "请选择服务小类。" };
    }

    if (!serviceDiscount) {
      return { ok: false, message: "请选择订单折扣。" };
    }

    const serviceDetails = parseFlexibleOrderDetails(formState.serviceDetails, "服务订单明细");

    if (typeof serviceDetails === "string") {
      return { ok: false, message: serviceDetails };
    }

    return {
      ok: true,
      payload: {
        ...baseParsed.payload,
        supplementary: {
          kind: "service",
          subtypeId: serviceSubtype,
          discountId: serviceDiscount,
          details: serviceDetails,
        },
      },
    };
  }

  return baseParsed;
}

function stringifyOrderDetailsForTextarea(value: AdminOrderDetailValue) {
  if (value === null) {
    return "";
  }

  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
    return "";
  }

  if (Array.isArray(value) && value.length === 0) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function parseFlexibleOrderDetails(
  value: string,
  label: string,
): AdminOrderDetailValue | string {
  const normalized = value.trim();

  if (!normalized) {
    return {};
  }

  try {
    return JSON.parse(normalized) as AdminOrderDetailValue;
  } catch {
    const lines = normalized
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const detailEntries = lines.map((line) => {
      const chineseSeparatorIndex = line.indexOf("：");
      const separatorIndex =
        chineseSeparatorIndex >= 0 ? chineseSeparatorIndex : line.indexOf(":");

      if (separatorIndex <= 0) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();

      if (!key) {
        return null;
      }

      return [key, rawValue] as const;
    });

    if (detailEntries.some((entry) => entry === null)) {
      return `${label}格式不正确，请填写 JSON，或按“字段: 内容”逐行输入。`;
    }

    return Object.fromEntries(detailEntries as Array<readonly [string, string]>);
  }
}

function parseRequiredNumber(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return `请填写${label}。`;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return `${label}格式不正确。`;
  }

  return parsed;
}

function parseOptionalNumber(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return `${label}格式不正确。`;
  }

  if (parsed < 0) {
    return `${label}不能小于 0。`;
  }

  return parsed;
}

function formatEditableNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return String(value);
  }

  return normalizeOptionalString(value) ?? "";
}

function normalizeSearchText(value: string | null | undefined) {
  return (normalizeOptionalString(value) ?? "").toLowerCase().replace(/\s+/g, " ");
}

function getOrderUserOptionLabel(option: OrderUserOption) {
  const normalizedName = normalizeOptionalString(option.name);
  const normalizedEmail = normalizeOptionalString(option.email);

  if (normalizedName && normalizedEmail) {
    return `${normalizedName} / ${normalizedEmail}`;
  }

  return normalizedName ?? normalizedEmail ?? option.user_id;
}

function resolveOrderUserLabel(value: string | null, userLabelById: Map<string, string>) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "-";
  }

  return userLabelById.get(normalizedValue) ?? normalizedValue;
}

function getOrderTypeMetaFromCategory(category: string | null | undefined) {
  const normalizedCategory = normalizeOptionalString(category);

  if (normalizedCategory === "purchase") {
    return { label: "采购订单", tone: "blue" as const };
  }

  if (normalizedCategory === "service") {
    return { label: "服务订单", tone: "green" as const };
  }

  return {
    label: normalizedCategory ?? "待补充",
    tone: "default" as const,
  };
}

function resolveOrderTypeMeta(
  value: string | null,
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return getOrderTypeMetaFromCategory(null);
  }

  return orderTypeMetaById.get(normalizedValue) ?? getOrderTypeMetaFromCategory(normalizedValue);
}

function formatPurchaseOrderSubtype(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "待补充";
  }

  return (
    {
      sourcing: "货源采购",
      dropshipping: "一件代发",
      tourist_shopping: "旅游购物",
      group_buying: "团购",
    } satisfies Record<string, string>
  )[normalizedValue] ?? normalizedValue;
}

function formatServiceOrderSubtype(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "待补充";
  }

  return (
    {
      tour_escort: "旅游陪同",
      medical_escort: "医疗陪同",
      digital_survival: "数字化生存",
      airport_transfer: "机场接送",
      car_service: "用车服务",
      vip_recharge: "VIP 充值",
    } satisfies Record<string, string>
  )[normalizedValue] ?? normalizedValue;
}

function getServiceSubtypeCostPreset(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  return SERVICE_SUBTYPE_COST_PRESETS[normalizedValue] ?? null;
}

function formatDiscountRatioValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "待补充";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(parsed);
}

type FlattenedOrderDetailItem = {
  label: string;
  value: string;
};

function flattenOrderDetailItems(value: AdminOrderDetailValue): FlattenedOrderDetailItem[] {
  return flattenOrderDetailValue(value);
}

function flattenOrderDetailValue(
  value: AdminOrderDetailValue,
  parentLabel?: string,
): FlattenedOrderDetailItem[] {
  if (value === null) {
    return parentLabel ? [{ label: parentLabel, value: "-" }] : [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [
      {
        label: parentLabel ?? "表单内容",
        value: formatOrderDetailPrimitive(value),
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
          label: parentLabel ?? "表单内容",
          value: value.map((item) => formatOrderDetailPrimitive(item)).join("、"),
        },
      ];
    }

    return value.flatMap((item, index) =>
      flattenOrderDetailValue(
        item,
        parentLabel ? `${parentLabel} / 第 ${index + 1} 项` : `第 ${index + 1} 项`,
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
    ),
  );
}

function isOrderDetailPrimitive(
  value: AdminOrderDetailValue,
): value is string | number | boolean | null {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function formatOrderDetailPrimitive(value: string | number | boolean | null) {
  if (value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("zh-CN", {
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

function getStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeOptionalString(status);

  if (!normalizedStatus) {
    return "待补充";
  }

  const matchedStatus = ORDER_STATUS_OPTIONS.find((option) => option.value === normalizedStatus);
  return matchedStatus?.label ?? normalizedStatus;
}

function formatCurrencyCode(value: string | null | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : "-";
}

function formatMoneyValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
  }).format(parsed);
}

function formatRateValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  }).format(parsed);
}

function parseNumericValue(value: number | string | null | undefined) {
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

function toOrderErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("duplicate key value")) {
    return "订单编号生成冲突，请稍后重试。";
  }

  if (baseMessage.includes("violates foreign key constraint")) {
    return "请选择有效的订单录入员、订单客户、订单类型，以及对应的采购/服务子表选项。";
  }

  if (baseMessage.includes("current user cannot create this order")) {
    return "You do not have permission to create this order.";
  }

  if (baseMessage.includes("current user cannot update this order")) {
    return "You do not have permission to update this order.";
  }

  if (baseMessage.includes("updated order scope is not allowed for current user")) {
    return "The updated order scope is outside your allowed range.";
  }

  if (baseMessage.includes("current user cannot delete this order")) {
    return "You do not have permission to delete this order.";
  }

  if (baseMessage.includes("only active users can generate order numbers")) {
    return "Only active users can create new order numbers.";
  }

  if (baseMessage.includes("order not found")) {
    return "The order could not be found.";
  }

  return baseMessage;
}

function canReadOrderByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman" ||
    role === "client"
  );
}

function canReadOrderCostByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman"
  );
}

function canCreateOrderByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return role === "administrator" || role === "manager" || role === "salesman";
}

function canUpdateOrderByRole(role: AppRole | null, status: UserStatus | null) {
  return canCreateOrderByRole(role, status);
}

function canDeleteOrderByRole(role: AppRole | null, status: UserStatus | null) {
  return status === "active" && role === "administrator";
}

export type { OrderFormState };

export {
  applyOrderFormDefaults,
  canCreateOrderByRole,
  canDeleteOrderByRole,
  canReadOrderByRole,
  canReadOrderCostByRole,
  canUpdateOrderByRole,
  createOrderFormState,
  createOrderFormStateFromOrder,
  flattenOrderDetailItems,
  formatCurrencyCode,
  formatDiscountRatioValue,
  formatEditableNumericValue,
  formatMoneyValue,
  formatPurchaseOrderSubtype,
  formatRateValue,
  formatServiceOrderSubtype,
  deriveTransactionRateValue,
  getServiceSubtypeCostPreset,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getStatusLabel,
  normalizeSearchText,
  parseCreateOrderForm,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
};
