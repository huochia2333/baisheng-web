import {
  type AdminOrderDetailValue,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type CreateAdminOrderInput,
} from "@/lib/admin-orders";
import {
  findTodayCnyExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";

import { normalizeOptionalString } from "../dashboard-shared-ui";

import { type OrdersUiCopy } from "./admin-orders-copy";
import {
  formatCurrencyCode,
  formatEditableNumericValue,
  parseNumericValue,
} from "./admin-orders-display";

export type OrderFormState = {
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

export function createOrderFormState(defaults?: {
  originalCurrency?: string;
  orderEntryUser?: string;
  orderType?: string;
}): OrderFormState {
  return {
    originalCurrency: defaults?.originalCurrency ?? "USD",
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

export function createOrderFormStateFromOrder(
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

export function applyOrderFormDefaults(
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

export function applyTodayExchangeRateToOrderForm(
  formState: OrderFormState,
  todayExchangeRates: ExchangeRateRow[],
) {
  const rate = findTodayCnyExchangeRate(
    todayExchangeRates,
    formState.originalCurrency,
  );
  const dailyExchangeRate = formatEditableNumericValue(rate?.daily_exchange_rate);

  return {
    ...formState,
    dailyExchangeRate,
    transactionRate: deriveTransactionRateValue(dailyExchangeRate),
  };
}

export function deriveTransactionRateValue(
  value: number | string | null | undefined,
) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "";
  }

  const derived = (parsed * 0.99).toFixed(6);
  return derived.replace(/\.?0+$/, "");
}

export function parseCreateOrderForm(
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

  if (isPurchaseDetailsCategory(orderCategory)) {
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

  if (typeof amount === "string") {
    return { ok: false, message: amount };
  }

  if (typeof dailyExchangeRate === "string") {
    return { ok: false, message: dailyExchangeRate };
  }

  if (typeof transactionRate === "string") {
    return { ok: false, message: transactionRate };
  }

  if (typeof rmbAmount === "string") {
    return { ok: false, message: rmbAmount };
  }

  if (typeof costAmount === "string") {
    return { ok: false, message: costAmount };
  }

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

export function isPurchaseDetailsCategory(category: string | null | undefined) {
  return category === "purchase" || category === "dropshipping";
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

      if (!key || !rawValue) {
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
