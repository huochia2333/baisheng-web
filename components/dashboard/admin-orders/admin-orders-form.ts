import {
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type CreateAdminOrderInput,
  type ServiceFeeTypeOption,
} from "@/lib/admin-orders";

import { normalizeOptionalString } from "../dashboard-shared-ui";

import { type OrdersUiCopy } from "./admin-orders-copy";
import {
  deriveRmbAmountValue,
  deriveTransactionRateValue,
} from "./admin-orders-currency";
import {
  formatCurrencyCode,
  formatEditableNumericValue,
} from "./admin-orders-display";
import {
  parseFlexibleOrderDetails,
  parseOptionalNumber,
  parseRequiredNumber,
  stringifyOrderDetailsForTextarea,
} from "./admin-orders-form-parsing";

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
  serviceFeeType: string;
  serviceDetails: string;
};

export function createOrderFormState(defaults?: {
  originalCurrency?: string;
  orderEntryUser?: string;
  orderType?: string;
  serviceFeeType?: string;
}): OrderFormState {
  return {
    originalCurrency: defaults?.originalCurrency ?? "",
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
    serviceFeeType: defaults?.serviceFeeType ?? "",
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
    serviceFeeType:
      supplementaryDetail?.kind === "service"
        ? (supplementaryDetail.serviceFeeTypeId ?? "")
        : "",
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
    const serviceFeeType = formState.serviceFeeType.trim();

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

    if (!serviceFeeType) {
      return {
        ok: false,
        message: copy.validation.selectPrompt(copy.fields.serviceFeeType),
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
          serviceFeeTypeId: serviceFeeType,
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
      message: copy.validation.selectPrompt(copy.fields.originalCurrency),
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

  if (typeof costAmount === "string") {
    return { ok: false, message: costAmount };
  }

  const rmbAmount = parseRequiredNumber(
    deriveRmbAmountValue(amount, dailyExchangeRate),
    copy.fields.rmbAmount,
    copy,
  );

  if (typeof rmbAmount === "string") {
    return { ok: false, message: rmbAmount };
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

export function getDefaultServiceFeeTypeId(options: ServiceFeeTypeOption[]) {
  return options[0]?.id ?? "";
}
