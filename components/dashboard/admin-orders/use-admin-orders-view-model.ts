"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { type AdminOrdersPageData } from "@/lib/admin-orders";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createDashboardSharedCopy,
  normalizeOptionalString,
} from "@/components/dashboard/dashboard-shared-ui";

import {
  getOrdersViewConfig,
  type OrdersClientMode,
} from "./admin-orders-client-config";
import {
  canCreateOrderByRole,
  canDeleteOrderByRole,
  canUpdateOrderByRole,
  createOrdersUiCopy,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
} from "./admin-orders-utils";
import {
  type PageFeedback,
} from "./admin-orders-view-model-shared";
import { useAdminOrderCreateDialog } from "./use-admin-order-create-dialog";
import { useAdminOrderDeleteActions } from "./use-admin-order-delete-actions";
import { useAdminOrderEditDialog } from "./use-admin-order-edit-dialog";
import { useAdminOrderSelection } from "./use-admin-order-selection";
import { useAdminOrdersRouteState } from "./use-admin-orders-route-state";

export function useAdminOrdersViewModel({
  initialData,
  mode = "admin",
}: {
  initialData: AdminOrdersPageData;
  mode?: OrdersClientMode;
}) {
  const t = useTranslations("Orders");
  const ordersUiT = useTranslations("OrdersUI");
  const sharedT = useTranslations("DashboardShared");
  const supabase = getBrowserSupabaseClient();
  const viewConfig = useMemo(() => getOrdersViewConfig(mode, t), [mode, t]);
  const ordersUiCopy = useMemo(() => createOrdersUiCopy(ordersUiT), [ordersUiT]);
  const sharedCopy = useMemo(() => createDashboardSharedCopy(sharedT), [sharedT]);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);

  const {
    canViewOrderCosts: serverCanViewOrderCosts,
    canViewOrders,
    currentViewerId,
    currentViewerRole,
    currentViewerStatus,
    matchedOrdersCount,
    orderDiscountOptions,
    orderTypeOptions,
    orders,
    pagination,
    purchaseOrderTypeOptions,
    serviceOrderTypeOptions,
    summary,
    todayExchangeRates,
    totalOrdersCount,
    userOptions,
  } = initialData;

  const routeState = useAdminOrdersRouteState({
    initialFilters: initialData.filters,
    pagination,
  });
  const selectionState = useAdminOrderSelection(orders);

  const canViewOrderCosts = viewConfig.allowCost && serverCanViewOrderCosts;
  const canCreateOrders =
    viewConfig.allowCreate &&
    canViewOrders &&
    canCreateOrderByRole(currentViewerRole, currentViewerStatus);
  const canEditOrders =
    viewConfig.allowEdit &&
    canUpdateOrderByRole(currentViewerRole, currentViewerStatus);
  const canDeleteOrders =
    viewConfig.allowDelete &&
    canDeleteOrderByRole(currentViewerRole, currentViewerStatus);

  const orderEntryUserOptions = useMemo(() => {
    if (viewConfig.lockOrderEntryToCurrentViewer) {
      return userOptions.filter((option) => option.user_id === currentViewerId);
    }

    return userOptions;
  }, [currentViewerId, userOptions, viewConfig.lockOrderEntryToCurrentViewer]);

  const orderingUserOptions = useMemo(() => {
    if (!viewConfig.limitOrderingUsersToClients) {
      return userOptions;
    }

    return userOptions.filter(
      (option) =>
        option.user_id !== currentViewerId && option.role === "client",
    );
  }, [currentViewerId, userOptions, viewConfig.limitOrderingUsersToClients]);

  const canOpenCreateDialog =
    canCreateOrders &&
    orderTypeOptions.length > 0 &&
    (!viewConfig.limitOrderingUsersToClients || orderingUserOptions.length > 0);

  const userLabelById = useMemo(() => {
    return new Map(
      userOptions.map((option) => [option.user_id, getOrderUserOptionLabel(option)]),
    );
  }, [userOptions]);

  const orderTypeMetaById = useMemo(() => {
    return new Map(
      orderTypeOptions.map((option) => [
        option.id,
        getOrderTypeMetaFromCategory(option.category, ordersUiCopy),
      ]),
    );
  }, [orderTypeOptions, ordersUiCopy]);

  const orderCategoryByTypeId = useMemo(() => {
    return new Map(
      orderTypeOptions.map((option) => [option.id, normalizeOptionalString(option.category)]),
    );
  }, [orderTypeOptions]);

  const createDialogState = useAdminOrderCreateDialog({
    canCreateOrders,
    canOpenCreateDialog,
    currentViewerId,
    orderCategoryByTypeId,
    orderTypeOptions,
    ordersUiCopy,
    refreshOrdersRoute: routeState.refreshOrdersRoute,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
    todayExchangeRates,
  });

  const editDialogState = useAdminOrderEditDialog({
    canEditOrders,
    clearSelectedOrder: selectionState.clearSelectedOrder,
    orderCategoryByTypeId,
    ordersUiCopy,
    refreshOrdersRoute: routeState.refreshOrdersRoute,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
  });

  const deleteActions = useAdminOrderDeleteActions({
    canDeleteOrders,
    clearSelectedOrder: selectionState.clearSelectedOrder,
    ordersUiCopy,
    refreshOrdersRoute: routeState.refreshOrdersRoute,
    selectedOrder: selectionState.selectedOrder,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
  });

  return {
    canCreateOrders,
    canDeleteOrders,
    canEditOrders,
    canOpenCreateDialog,
    canViewOrderCosts,
    canViewOrders,
    clearFilters: routeState.clearFilters,
    createDialogFeedback: createDialogState.createDialogFeedback,
    createDialogOpen: createDialogState.createDialogOpen,
    createFormState: createDialogState.createFormState,
    createPending: createDialogState.createPending,
    deletePending: deleteActions.deletePending,
    editDialogFeedback: editDialogState.editDialogFeedback,
    editDialogOpen: editDialogState.editDialogOpen,
    editFormState: editDialogState.editFormState,
    editPending: editDialogState.editPending,
    editSupplementaryLoading: editDialogState.editSupplementaryLoading,
    filters: routeState.filters,
    forceDeletePending: deleteActions.forceDeletePending,
    handleCreateDialogOpenChange: createDialogState.handleCreateDialogOpenChange,
    handleCreateOrder: createDialogState.handleCreateOrder,
    handleDeleteOrder: deleteActions.handleDeleteOrder,
    handleEditDialogOpenChange: editDialogState.handleEditDialogOpenChange,
    handleEditOrder: editDialogState.handleEditOrder,
    handleForceDeleteOrder: deleteActions.handleForceDeleteOrder,
    handleOrderDetailsOpenChange: selectionState.handleOrderDetailsOpenChange,
    handleOrderEntryUserChange: routeState.handleOrderEntryUserChange,
    handleOrderNumberChange: routeState.handleOrderNumberChange,
    handleOrderingUserChange: routeState.handleOrderingUserChange,
    handleSelectOrder: selectionState.handleSelectOrder,
    matchedOrdersCount,
    openCreateDialog: createDialogState.openCreateDialog,
    openEditDialog: editDialogState.openEditDialog,
    orderDiscountOptions,
    orderEntryUserOptions,
    orderingUserOptions,
    orderTypeMetaById,
    orderTypeOptions,
    orders,
    ordersPaginationState: routeState.ordersPaginationState,
    pageFeedback,
    purchaseOrderTypeOptions,
    selectedOrder: selectionState.selectedOrder,
    serviceOrderTypeOptions,
    summary,
    supabase,
    todayExchangeRates,
    totalOrdersCount,
    updateCreateFormField: createDialogState.updateCreateFormField,
    updateEditFormField: editDialogState.updateEditFormField,
    userLabelById,
    userOptions,
    viewConfig,
  };
}
