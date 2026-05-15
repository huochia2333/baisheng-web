import { type AdminOrdersFilters } from "@/lib/admin-orders";

import {
  deriveTransactionRateValue,
  getServiceSubtypeCostPreset,
  type OrderFormState,
} from "./admin-orders-utils";

type OrdersTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export type OrdersClientMode = "admin" | "salesman" | "client";

export const EMPTY_ORDER_FILTERS: AdminOrdersFilters = {
  orderEntryUser: "",
  orderNumber: "",
  orderingUser: "",
};

export type OrdersViewConfig = {
  badge: string;
  title: string;
  description: string;
  createTitle: string;
  createDescription: string;
  emptyDescription: string;
  noPermissionDescription: string;
  noCreateTargetHint: string | null;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowCost: boolean;
  showOrderEntryFilter: boolean;
  showOrderingFilter: boolean;
  showOrderEntryColumn: boolean;
  showOrderingColumn: boolean;
  showCreatedAtColumn: boolean;
  showOrderEntryDetail: boolean;
  showOrderingDetail: boolean;
  lockOrderEntryToCurrentViewer: boolean;
  limitOrderingUsersToClients: boolean;
};

export function getOrdersViewConfig(
  mode: OrdersClientMode,
  t: OrdersTranslator,
): OrdersViewConfig {
  if (mode === "salesman") {
    return {
      badge: t("modes.salesman.badge"),
      title: t("modes.salesman.title"),
      description: t("modes.salesman.description"),
      createTitle: t("modes.salesman.createTitle"),
      createDescription: t("modes.salesman.createDescription"),
      emptyDescription: t("modes.salesman.emptyDescription"),
      noPermissionDescription: t("modes.salesman.noPermissionDescription"),
      noCreateTargetHint: t("modes.salesman.noCreateTargetHint"),
      allowCreate: true,
      allowEdit: false,
      allowDelete: false,
      allowCost: false,
      showOrderEntryFilter: false,
      showOrderingFilter: true,
      showOrderEntryColumn: false,
      showOrderingColumn: true,
      showCreatedAtColumn: true,
      showOrderEntryDetail: false,
      showOrderingDetail: true,
      lockOrderEntryToCurrentViewer: true,
      limitOrderingUsersToClients: true,
    };
  }

  if (mode === "client") {
    return {
      badge: t("modes.client.badge"),
      title: t("modes.client.title"),
      description: t("modes.client.description"),
      createTitle: t("modes.client.createTitle"),
      createDescription: "",
      emptyDescription: t("modes.client.emptyDescription"),
      noPermissionDescription: t("modes.client.noPermissionDescription"),
      noCreateTargetHint: null,
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
      allowCost: false,
      showOrderEntryFilter: false,
      showOrderingFilter: false,
      showOrderEntryColumn: false,
      showOrderingColumn: false,
      showCreatedAtColumn: true,
      showOrderEntryDetail: false,
      showOrderingDetail: false,
      lockOrderEntryToCurrentViewer: false,
      limitOrderingUsersToClients: false,
    };
  }

  return {
    badge: t("modes.admin.badge"),
    title: t("modes.admin.title"),
    description: t("modes.admin.description"),
    createTitle: t("modes.admin.createTitle"),
    createDescription: t("modes.admin.createDescription"),
    emptyDescription: t("modes.admin.emptyDescription"),
    noPermissionDescription: t("modes.admin.noPermissionDescription"),
    noCreateTargetHint: null,
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    allowCost: true,
    showOrderEntryFilter: true,
    showOrderingFilter: true,
    showOrderEntryColumn: true,
    showOrderingColumn: true,
    showCreatedAtColumn: false,
    showOrderEntryDetail: true,
    showOrderingDetail: true,
    lockOrderEntryToCurrentViewer: false,
    limitOrderingUsersToClients: false,
  };
}

export function getNextOrderFormState<Key extends keyof OrderFormState>(
  current: OrderFormState,
  key: Key,
  value: OrderFormState[Key],
) {
  const nextState = {
    ...current,
    [key]: value,
  };

  if (key === "dailyExchangeRate") {
    nextState.transactionRate = deriveTransactionRateValue(String(value));
  }

  if (key === "orderType") {
    nextState.purchaseSubtype = "";
    nextState.purchaseDetails = "";
    nextState.serviceSubtype = "";
    nextState.serviceDiscount = "";
    nextState.serviceDetails = "";
  }

  if (key === "serviceSubtype") {
    const presetCost = getServiceSubtypeCostPreset(String(value));

    if (presetCost !== null) {
      nextState.costAmount = presetCost;
    }
  }

  return nextState;
}

export function areOrderFiltersEqual(
  left: AdminOrdersFilters,
  right: AdminOrdersFilters,
) {
  return (
    left.orderEntryUser === right.orderEntryUser &&
    left.orderNumber === right.orderNumber &&
    left.orderingUser === right.orderingUser
  );
}
