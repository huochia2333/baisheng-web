import {
  type DashboardSharedCopy,
  toErrorMessage,
} from "../dashboard-shared-ui";

import { type OrdersUiCopy } from "./admin-orders-copy";

export function toOrderErrorMessage(
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
