import {
  type AdminOrderDetailValue,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type CreateAdminOrderInput,
  type OrderUserOption,
} from "@/lib/admin-orders";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import {
  type DashboardSharedCopy,
  normalizeOptionalString,
  toErrorMessage,
} from "../dashboard-shared-ui";

type TranslationValues = Record<string, string | number>;
type OrdersUiTranslator = (key: string, values?: TranslationValues) => string;

const PURCHASE_SUBTYPE_KEYS = {
  dropshipping: "subtypes.purchase.dropshipping",
  group_buying: "subtypes.purchase.groupBuying",
  sourcing: "subtypes.purchase.sourcing",
  tourist_shopping: "subtypes.purchase.touristShopping",
} as const;

const SERVICE_SUBTYPE_KEYS = {
  airport_transfer: "subtypes.service.airportTransfer",
  car_service: "subtypes.service.carService",
  digital_survival: "subtypes.service.digitalSurvival",
  medical_escort: "subtypes.service.medicalEscort",
  tour_escort: "subtypes.service.tourEscort",
  vip_recharge: "subtypes.service.vipRecharge",
} as const;

type OrderFieldKey =
  | "amount"
  | "costAmount"
  | "dailyExchangeRate"
  | "orderEntryUser"
  | "orderStatus"
  | "orderType"
  | "orderingUser"
  | "originalCurrency"
  | "purchaseDetails"
  | "purchaseSubtype"
  | "rmbAmount"
  | "serviceDetails"
  | "serviceDiscount"
  | "serviceSubtype"
  | "transactionRate";

export type OrdersUiCopy = {
  categories: {
    purchase: string;
    service: string;
  };
  errors: {
    cannotCreate: string;
    cannotDelete: string;
    cannotUpdate: string;
    duplicateOrderNumber: string;
    inactiveOrderNumber: string;
    invalidForeignKeys: string;
    orderNotFound: string;
    updatedScopeNotAllowed: string;
  };
  fallback: {
    formContent: string;
    item: (index: number) => string;
    no: string;
    notProvided: string;
    yes: string;
  };
  fields: Record<OrderFieldKey, string>;
  status: {
    cancelled: string;
    completed: string;
    inProgress: string;
    notProvided: string;
    pending: string;
    refunding: string;
    settled: string;
  };
  subtypes: {
    purchase: Record<keyof typeof PURCHASE_SUBTYPE_KEYS, string>;
    service: Record<keyof typeof SERVICE_SUBTYPE_KEYS, string>;
  };
  validation: {
    inputPrompt: (label: string) => string;
    invalidDetails: (label: string) => string;
    invalidFormat: (label: string) => string;
    minZero: (label: string) => string;
    selectPrompt: (label: string) => string;
  };
};

export function createOrdersUiCopy(t: OrdersUiTranslator): OrdersUiCopy {
  return {
    categories: {
      purchase: t("categories.purchase"),
      service: t("categories.service"),
    },
    errors: {
      cannotCreate: t("errors.cannotCreate"),
      cannotDelete: t("errors.cannotDelete"),
      cannotUpdate: t("errors.cannotUpdate"),
      duplicateOrderNumber: t("errors.duplicateOrderNumber"),
      inactiveOrderNumber: t("errors.inactiveOrderNumber"),
      invalidForeignKeys: t("errors.invalidForeignKeys"),
      orderNotFound: t("errors.orderNotFound"),
      updatedScopeNotAllowed: t("errors.updatedScopeNotAllowed"),
    },
    fallback: {
      formContent: t("fallback.formContent"),
      item: (index) => t("fallback.item", { index }),
      no: t("fallback.no"),
      notProvided: t("status.notProvided"),
      yes: t("fallback.yes"),
    },
    fields: {
      amount: t("fields.amount"),
      costAmount: t("fields.costAmount"),
      dailyExchangeRate: t("fields.dailyExchangeRate"),
      orderEntryUser: t("fields.orderEntryUser"),
      orderStatus: t("fields.orderStatus"),
      orderType: t("fields.orderType"),
      orderingUser: t("fields.orderingUser"),
      originalCurrency: t("fields.originalCurrency"),
      purchaseDetails: t("fields.purchaseDetails"),
      purchaseSubtype: t("fields.purchaseSubtype"),
      rmbAmount: t("fields.rmbAmount"),
      serviceDetails: t("fields.serviceDetails"),
      serviceDiscount: t("fields.serviceDiscount"),
      serviceSubtype: t("fields.serviceSubtype"),
      transactionRate: t("fields.transactionRate"),
    },
    status: {
      cancelled: t("status.cancelled"),
      completed: t("status.completed"),
      inProgress: t("status.inProgress"),
      notProvided: t("status.notProvided"),
      pending: t("status.pending"),
      refunding: t("status.refunding"),
      settled: t("status.settled"),
    },
    subtypes: {
      purchase: {
        dropshipping: t("subtypes.purchase.dropshipping"),
        group_buying: t("subtypes.purchase.groupBuying"),
        sourcing: t("subtypes.purchase.sourcing"),
        tourist_shopping: t("subtypes.purchase.touristShopping"),
      },
      service: {
        airport_transfer: t("subtypes.service.airportTransfer"),
        car_service: t("subtypes.service.carService"),
        digital_survival: t("subtypes.service.digitalSurvival"),
        medical_escort: t("subtypes.service.medicalEscort"),
        tour_escort: t("subtypes.service.tourEscort"),
        vip_recharge: t("subtypes.service.vipRecharge"),
      },
    },
    validation: {
      inputPrompt: (label) => t("validation.inputPrompt", { label }),
      invalidDetails: (label) => t("validation.invalidDetails", { label }),
      invalidFormat: (label) => t("validation.invalidFormat", { label }),
      minZero: (label) => t("validation.minZero", { label }),
      selectPrompt: (label) => t("validation.selectPrompt", { label }),
    },
  };
}

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
  copy: OrdersUiCopy,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const originalCurrency = formState.originalCurrency.trim().toUpperCase();
  const orderEntryUser = formState.orderEntryUser.trim();
  const orderingUser = formState.orderingUser.trim();
  const orderStatus = formState.orderStatus.trim();
  const orderType = formState.orderType.trim();

  if (!originalCurrency) {
    return {
      ok: false,
      message: copy.validation.inputPrompt(copy.fields.originalCurrency),
    };
  }
  if (!orderEntryUser) {
    return {
      ok: false,
      message: copy.validation.selectPrompt(copy.fields.orderEntryUser),
    };
  }
  if (!orderingUser) {
    return {
      ok: false,
      message: copy.validation.selectPrompt(copy.fields.orderingUser),
    };
  }
  if (!orderStatus) {
    return {
      ok: false,
      message: copy.validation.selectPrompt(copy.fields.orderStatus),
    };
  }
  if (!orderType) {
    return {
      ok: false,
      message: copy.validation.selectPrompt(copy.fields.orderType),
    };
  }

  const amount = parseRequiredNumber(formState.amount, copy.fields.amount, copy);
  const dailyExchangeRate = parseRequiredNumber(
    formState.dailyExchangeRate,
    copy.fields.dailyExchangeRate,
    copy,
  );
  const transactionRate = parseRequiredNumber(
    deriveTransactionRateValue(formState.dailyExchangeRate) || formState.transactionRate,
    copy.fields.transactionRate,
    copy,
  );
  const rmbAmount = parseRequiredNumber(formState.rmbAmount, copy.fields.rmbAmount, copy);
  const costAmount = parseOptionalNumber(formState.costAmount, copy.fields.costAmount, copy);

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
  copy: OrdersUiCopy,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const baseParsed = parseBaseOrderForm(formState, copy);

  if (!baseParsed.ok) {
    return baseParsed;
  }

  const orderCategory = orderCategoryByTypeId.get(formState.orderType.trim()) ?? null;

  if (orderCategory === "purchase") {
    const purchaseSubtype = formState.purchaseSubtype.trim();

    if (!purchaseSubtype) {
      return {
        ok: false,
        message: copy.validation.selectPrompt(copy.fields.purchaseSubtype),
      };
    }

    const purchaseDetails = parseFlexibleOrderDetails(
      formState.purchaseDetails,
      copy.fields.purchaseDetails,
      copy,
    );

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
      return {
        ok: false,
        message: copy.validation.selectPrompt(copy.fields.serviceSubtype),
      };
    }

    if (!serviceDiscount) {
      return {
        ok: false,
        message: copy.validation.selectPrompt(copy.fields.serviceDiscount),
      };
    }

    const serviceDetails = parseFlexibleOrderDetails(
      formState.serviceDetails,
      copy.fields.serviceDetails,
      copy,
    );

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
  copy: OrdersUiCopy,
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
      return copy.validation.invalidDetails(label);
    }

    return Object.fromEntries(detailEntries as Array<readonly [string, string]>);
  }
}

function parseRequiredNumber(
  value: string,
  label: string,
  copy: OrdersUiCopy,
) {
  const normalized = value.trim();

  if (!normalized) {
    return copy.validation.inputPrompt(label);
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return copy.validation.invalidFormat(label);
  }

  return parsed;
}

function parseOptionalNumber(
  value: string,
  label: string,
  copy: OrdersUiCopy,
) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return copy.validation.invalidFormat(label);
  }

  if (parsed < 0) {
    return copy.validation.minZero(label);
  }

  return parsed;
}

function formatEditableNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return String(value);
  }

  return normalizeOptionalString(value) ?? "";
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

function getOrderTypeMetaFromCategory(
  category: string | null | undefined,
  copy: OrdersUiCopy,
) {
  const normalizedCategory = normalizeOptionalString(category);

  if (normalizedCategory === "purchase") {
    return { label: copy.categories.purchase, tone: "blue" as const };
  }

  if (normalizedCategory === "service") {
    return { label: copy.categories.service, tone: "green" as const };
  }

  return {
    label: normalizedCategory ?? copy.fallback.notProvided,
    tone: "default" as const,
  };
}

function resolveOrderTypeMeta(
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

function formatPurchaseOrderSubtype(
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

function formatServiceOrderSubtype(
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

function getServiceSubtypeCostPreset(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  return SERVICE_SUBTYPE_COST_PRESETS[normalizedValue] ?? null;
}

function formatDiscountRatioValue(
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

type FlattenedOrderDetailItem = {
  label: string;
  value: string;
};

function flattenOrderDetailItems(
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
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
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

function getStatusLabel(
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

function formatCurrencyCode(value: string | null | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : "-";
}

function formatMoneyValue(
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

function formatRateValue(
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

function toOrderErrorMessage(
  error: unknown,
  copy: OrdersUiCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const baseMessage = toErrorMessage(error, sharedCopy);

  if (baseMessage.includes("duplicate key value")) {
    return copy.errors.duplicateOrderNumber;
  }

  if (baseMessage.includes("violates foreign key constraint")) {
    return copy.errors.invalidForeignKeys;
  }

  if (baseMessage.includes("current user cannot create this order")) {
    return copy.errors.cannotCreate;
  }

  if (baseMessage.includes("current user cannot update this order")) {
    return copy.errors.cannotUpdate;
  }

  if (baseMessage.includes("updated order scope is not allowed for current user")) {
    return copy.errors.updatedScopeNotAllowed;
  }

  if (baseMessage.includes("current user cannot delete this order")) {
    return copy.errors.cannotDelete;
  }

  if (baseMessage.includes("only active users can generate order numbers")) {
    return copy.errors.inactiveOrderNumber;
  }

  if (baseMessage.includes("order not found")) {
    return copy.errors.orderNotFound;
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
  parseCreateOrderForm,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
};
