import {
  getRawErrorMessage,
  type DashboardSharedCopy,
  toErrorMessage,
} from "../dashboard-shared-ui";

import { type OrdersUiCopy } from "./admin-orders-copy";

export function toOrderErrorMessage(
  error: unknown,
  copy: OrdersUiCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error, sharedCopy);

  if (rawMessage.includes("duplicate key value")) {
    return copy.errors.duplicateOrderNumber;
  }

  if (rawMessage.includes("violates foreign key constraint")) {
    return copy.errors.invalidForeignKeys;
  }

  if (
    rawMessage.includes("today exchange rate is not ready") ||
    rawMessage.includes("exchange rate is not ready")
  ) {
    return copy.errors.exchangeRateMissing;
  }

  if (rawMessage.includes("current user cannot create this order")) {
    return copy.errors.cannotCreate;
  }

  if (rawMessage.includes("current user cannot update this order")) {
    return copy.errors.cannotUpdate;
  }

  if (rawMessage.includes("updated order scope is not allowed for current user")) {
    return copy.errors.updatedScopeNotAllowed;
  }

  if (rawMessage.includes("salesman_order_board_forbidden")) {
    return copy.errors.updatedScopeNotAllowed;
  }

  if (rawMessage.includes("current user cannot delete this order")) {
    return copy.errors.cannotDelete;
  }

  if (rawMessage.includes("only active users can generate order numbers")) {
    return copy.errors.inactiveOrderNumber;
  }

  if (rawMessage.includes("order not found")) {
    return copy.errors.orderNotFound;
  }

  if (rawMessage.includes("VIP recharge orders must use USD")) {
    return copy.errors.vipAmountInvalid;
  }

  if (rawMessage.includes("VIP recharge amount must be 200 USD")) {
    return copy.errors.vipAmountInvalid;
  }

  if (
    rawMessage.includes("service_orders_use_usd") ||
    rawMessage.includes("service_price_required") ||
    rawMessage.includes("service_order_amount_mismatch")
  ) {
    return copy.errors.serviceAmountInvalid;
  }

  if (rawMessage.includes("service_discount_requires_retail_service_vip")) {
    return copy.errors.serviceDiscountRequiresVip;
  }

  return baseMessage;
}
