"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReceiptText, ShieldAlert } from "lucide-react";

import {
  type AdminOrdersFilters,
  type AdminOrdersPageData,
  createAdminOrder,
  deleteAdminOrder,
  forceDeleteAdminOrder,
  getAdminOrderSupplementaryDetail,
  updateAdminOrder,
  type AdminOrderRow,
} from "@/lib/admin-orders";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createDashboardSharedCopy,
  EmptyState,
  PageBanner,
  normalizeOptionalString,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  OrderDetailsDialog,
  OrderFormDialog,
} from "./admin-orders/admin-orders-ui";
import {
  OrdersHeaderSection,
  OrdersTableSection,
} from "./admin-orders/admin-orders-sections";
import {
  applyOrderFormDefaults,
  canCreateOrderByRole,
  canDeleteOrderByRole,
  canUpdateOrderByRole,
  createOrdersUiCopy,
  createOrderFormState,
  createOrderFormStateFromOrder,
  deriveTransactionRateValue,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getServiceSubtypeCostPreset,
  parseCreateOrderForm,
  toOrderErrorMessage,
  type OrderFormState,
} from "./admin-orders/admin-orders-utils";
import { useWorkspaceSyncEffect } from "./workspace-session-provider";

type PageFeedback = { tone: NoticeTone; message: string } | null;

type OrdersClientMode = "admin" | "salesman" | "client";

const EMPTY_ORDER_FILTERS: AdminOrdersFilters = {
  orderEntryUser: "",
  orderNumber: "",
  orderingUser: "",
};

type OrdersViewConfig = {
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

function getOrdersViewConfig(
  mode: OrdersClientMode,
  t: ReturnType<typeof useTranslations>,
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

function getNextOrderFormState<Key extends keyof OrderFormState>(
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

  if (key === "serviceSubtype") {
    const presetCost = getServiceSubtypeCostPreset(String(value));

    if (presetCost !== null) {
      nextState.costAmount = presetCost;
    }
  }

  return nextState;
}

function areOrderFiltersEqual(
  left: AdminOrdersFilters,
  right: AdminOrdersFilters,
) {
  return (
    left.orderEntryUser === right.orderEntryUser &&
    left.orderNumber === right.orderNumber &&
    left.orderingUser === right.orderingUser
  );
}

export function AdminOrdersClient({
  initialData,
  mode = "admin",
}: {
  initialData: AdminOrdersPageData;
  mode?: OrdersClientMode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Orders");
  const ordersUiT = useTranslations("OrdersUI");
  const sharedT = useTranslations("DashboardShared");
  const supabase = getBrowserSupabaseClient();
  const viewConfig = getOrdersViewConfig(mode, t);
  const ordersUiCopy = useMemo(() => createOrdersUiCopy(ordersUiT), [ordersUiT]);
  const sharedCopy = useMemo(() => createDashboardSharedCopy(sharedT), [sharedT]);
  const [, startRouteTransition] = useTransition();
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [filters, setFilters] = useState<AdminOrdersFilters>(initialData.filters);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] = useState<PageFeedback>(null);
  const [createFormState, setCreateFormState] = useState<OrderFormState>(() =>
    createOrderFormState(),
  );

  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogFeedback, setEditDialogFeedback] = useState<PageFeedback>(null);
  const [editSupplementaryLoading, setEditSupplementaryLoading] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editOriginalOrderNumber, setEditOriginalOrderNumber] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<OrderFormState>(() =>
    createOrderFormState(),
  );
  const [deletePending, setDeletePending] = useState(false);
  const [forceDeletePending, setForceDeletePending] = useState(false);
  const editSupplementaryLoadTokenRef = useRef(0);
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
    totalOrdersCount,
    userOptions,
  } = initialData;

  useEffect(() => {
    setFilters(initialData.filters);
  }, [initialData.filters]);

  useEffect(() => {
    setSelectedOrder((current) => {
      if (!current) {
        return current;
      }

      return orders.find((item) => item.id === current.id) ?? null;
    });
  }, [orders]);

  useEffect(() => {
    if (createDialogOpen) {
      return;
    }

    setCreateFormState((current) =>
      applyOrderFormDefaults(current, {
        orderEntryUser: currentViewerId ?? "",
        orderType: orderTypeOptions[0]?.id ?? "",
      }),
    );
  }, [createDialogOpen, currentViewerId, orderTypeOptions]);

  const replaceOrdersRoute = useCallback(
    (next: {
      filters?: AdminOrdersFilters;
      page?: number;
    }) => {
      const nextFilters = next.filters ?? filters;
      const nextPage = next.page ?? pagination.page;
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextFilters.orderNumber) {
        nextParams.set("orderNumber", nextFilters.orderNumber);
      } else {
        nextParams.delete("orderNumber");
      }

      if (nextFilters.orderEntryUser) {
        nextParams.set("orderEntryUser", nextFilters.orderEntryUser);
      } else {
        nextParams.delete("orderEntryUser");
      }

      if (nextFilters.orderingUser) {
        nextParams.set("orderingUser", nextFilters.orderingUser);
      } else {
        nextParams.delete("orderingUser");
      }

      if (nextPage > 1) {
        nextParams.set("page", String(nextPage));
      } else {
        nextParams.delete("page");
      }

      const nextQuery = nextParams.toString();

      startRouteTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      });
    },
    [filters, pagination.page, pathname, router, searchParams],
  );

  useEffect(() => {
    if (areOrderFiltersEqual(filters, initialData.filters)) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      replaceOrdersRoute({
        filters,
        page: 1,
      });
    }, 250);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [filters, initialData.filters, replaceOrdersRoute]);

  const refreshOrdersRoute = useCallback(() => {
    startRouteTransition(() => {
      router.refresh();
    });
  }, [router, startRouteTransition]);

  useWorkspaceSyncEffect(refreshOrdersRoute);

  const canViewOrderCosts = viewConfig.allowCost && serverCanViewOrderCosts;
  const canCreateOrders =
    viewConfig.allowCreate && canCreateOrderByRole(currentViewerRole, currentViewerStatus);
  const canEditOrders =
    viewConfig.allowEdit && canUpdateOrderByRole(currentViewerRole, currentViewerStatus);
  const canDeleteOrders =
    viewConfig.allowDelete && canDeleteOrderByRole(currentViewerRole, currentViewerStatus);

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
      (option) => option.user_id !== currentViewerId && option.role === "client",
    );
  }, [currentViewerId, userOptions, viewConfig.limitOrderingUsersToClients]);

  const canOpenCreateDialog =
    canCreateOrders &&
    (!viewConfig.limitOrderingUsersToClients || orderingUserOptions.length > 0);

  const userLabelById = useMemo(() => {
    return new Map(userOptions.map((option) => [option.user_id, getOrderUserOptionLabel(option)]));
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

  const goToPage = useCallback(
    (page: number) => {
      replaceOrdersRoute({
        filters,
        page,
      });
    },
    [filters, replaceOrdersRoute],
  );

  const ordersPaginationState = useMemo(
    () => ({
      endIndex: pagination.endIndex,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
      onNextPage: () => goToPage(pagination.page + 1),
      onPreviousPage: () => goToPage(pagination.page - 1),
      page: pagination.page,
      pageCount: pagination.pageCount,
      startIndex: pagination.startIndex,
      totalItems: pagination.totalItems,
    }),
    [
      goToPage,
      pagination.endIndex,
      pagination.hasNextPage,
      pagination.hasPreviousPage,
      pagination.page,
      pagination.pageCount,
      pagination.startIndex,
      pagination.totalItems,
    ],
  );

  const openCreateDialog = useCallback(() => {
    if (!canOpenCreateDialog) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(
      createOrderFormState({
        orderEntryUser: currentViewerId ?? "",
        orderType: orderTypeOptions[0]?.id ?? "",
      }),
    );
    setCreateDialogOpen(true);
  }, [canOpenCreateDialog, currentViewerId, orderTypeOptions]);

  const openEditDialog = useCallback(
    (order: AdminOrderRow) => {
      setPageFeedback(null);
      setSelectedOrder(null);
      setEditDialogFeedback(null);
      setEditOriginalOrderNumber(order.order_number);
      setEditFormState(createOrderFormStateFromOrder(order));
      setEditDialogOpen(true);

      if (!supabase) {
        return;
      }

      const loadToken = editSupplementaryLoadTokenRef.current + 1;
      editSupplementaryLoadTokenRef.current = loadToken;
      setEditSupplementaryLoading(true);

      void getAdminOrderSupplementaryDetail(supabase, order.order_number)
        .then((detail) => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditFormState(createOrderFormStateFromOrder(order, detail));
        })
        .catch((error) => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditDialogFeedback({
            tone: "error",
            message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
          });
        })
        .finally(() => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditSupplementaryLoading(false);
        });
    },
    [ordersUiCopy, sharedCopy, supabase],
  );

  const updateCreateFormField = useCallback(
    <Key extends keyof OrderFormState>(key: Key, value: OrderFormState[Key]) => {
      setCreateDialogFeedback(null);
      setCreateFormState((current) => getNextOrderFormState(current, key, value));
    },
    [],
  );

  const updateEditFormField = useCallback(
    <Key extends keyof OrderFormState>(key: Key, value: OrderFormState[Key]) => {
      setEditDialogFeedback(null);
      setEditFormState((current) => getNextOrderFormState(current, key, value));
    },
    [],
  );

  const handleCreateOrder = useCallback(async () => {
    if (!supabase || createPending || !canCreateOrders) {
      return;
    }

    const parsed = parseCreateOrderForm(createFormState, orderCategoryByTypeId, ordersUiCopy);

    if (!parsed.ok) {
      setCreateDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);
    setPageFeedback(null);

    try {
      const createdOrder = await createAdminOrder(supabase, parsed.payload);
      setCreateDialogOpen(false);
      setCreateDialogFeedback(null);
      setCreateFormState(
        createOrderFormState({
          orderEntryUser: currentViewerId ?? "",
          orderType: orderTypeOptions[0]?.id ?? "",
        }),
      );
      setPageFeedback({
        tone: "success",
        message: t("feedback.createSuccess", { orderNumber: createdOrder.order_number }),
      });
      startRouteTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setCreatePending(false);
    }
  }, [
    canCreateOrders,
    createFormState,
    createPending,
    currentViewerId,
    orderCategoryByTypeId,
    ordersUiCopy,
    sharedCopy,
    supabase,
    t,
    orderTypeOptions,
    router,
    startRouteTransition,
  ]);

  const handleEditOrder = useCallback(async () => {
    if (!supabase || editPending || !editOriginalOrderNumber || !canEditOrders) {
      return;
    }

    const parsed = parseCreateOrderForm(editFormState, orderCategoryByTypeId, ordersUiCopy);

    if (!parsed.ok) {
      setEditDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setEditPending(true);
    setEditDialogFeedback(null);
    setPageFeedback(null);

    try {
      const updatedOrder = await updateAdminOrder(supabase, {
        originalOrderNumber: editOriginalOrderNumber,
        ...parsed.payload,
      });

      setEditDialogOpen(false);
      setEditDialogFeedback(null);
      setEditOriginalOrderNumber(null);
      setSelectedOrder(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.updateSuccess", { orderNumber: updatedOrder.order_number }),
      });
      startRouteTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setEditDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setEditPending(false);
    }
  }, [
    canEditOrders,
    editFormState,
    editOriginalOrderNumber,
    editPending,
    orderCategoryByTypeId,
    ordersUiCopy,
    sharedCopy,
    supabase,
    t,
    router,
    startRouteTransition,
  ]);

  const handleDeleteOrder = useCallback(async () => {
    if (
      !supabase ||
      !selectedOrder ||
      deletePending ||
      forceDeletePending ||
      !canDeleteOrders
    ) {
      return;
    }

    const targetOrder = selectedOrder;

    if (
      typeof window !== "undefined" &&
      !window.confirm(t("feedback.deleteConfirm", { orderNumber: targetOrder.order_number }))
    ) {
      return;
    }

    setDeletePending(true);
    setPageFeedback(null);

    try {
      await deleteAdminOrder(supabase, targetOrder.order_number);
      setSelectedOrder(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.deleteSuccess", { orderNumber: targetOrder.order_number }),
      });
      startRouteTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setDeletePending(false);
    }
  }, [
    canDeleteOrders,
    deletePending,
    forceDeletePending,
    ordersUiCopy,
    selectedOrder,
    sharedCopy,
    supabase,
    t,
    router,
    startRouteTransition,
  ]);

  const handleForceDeleteOrder = useCallback(async () => {
    if (
      !supabase ||
      !selectedOrder ||
      deletePending ||
      forceDeletePending ||
      !canDeleteOrders
    ) {
      return;
    }

    const targetOrder = selectedOrder;

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        t("feedback.forceDeleteConfirm", { orderNumber: targetOrder.order_number }),
      )
    ) {
      return;
    }

    setForceDeletePending(true);
    setPageFeedback(null);

    try {
      await forceDeleteAdminOrder(supabase, targetOrder.order_number);
      setSelectedOrder(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.forceDeleteSuccess", { orderNumber: targetOrder.order_number }),
      });
      startRouteTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setForceDeletePending(false);
    }
  }, [
    canDeleteOrders,
    deletePending,
    forceDeletePending,
    ordersUiCopy,
    selectedOrder,
    sharedCopy,
    supabase,
    t,
    router,
    startRouteTransition,
  ]);

  const handleSelectOrder = useCallback((order: AdminOrderRow) => {
    setSelectedOrder(order);
  }, []);

  const handleOrderNumberChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderNumber: value,
    }));
  }, []);

  const handleOrderEntryUserChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderEntryUser: value,
    }));
  }, []);

  const handleOrderingUserChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderingUser: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_ORDER_FILTERS);
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <OrdersHeaderSection
        badge={viewConfig.badge}
        canCreateOrders={canCreateOrders}
        canOpenCreateDialog={canOpenCreateDialog}
        createTitle={viewConfig.createTitle}
        description={viewConfig.description}
        noCreateTargetHint={viewConfig.noCreateTargetHint}
        onCreate={openCreateDialog}
        summary={summary}
        title={viewConfig.title}
      />

      {canViewOrders === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewConfig.noPermissionDescription}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noViewPermissionTitle")}
          />
        </section>
      ) : totalOrdersCount === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewConfig.emptyDescription}
            icon={<ReceiptText className="size-6" />}
            title={t("states.emptyTitle")}
          />
        </section>
      ) : (
        <OrdersTableSection
          canViewOrderCosts={canViewOrderCosts}
          filters={filters}
          matchedOrdersCount={matchedOrdersCount}
          onClearFilters={clearFilters}
          onOrderEntryUserChange={handleOrderEntryUserChange}
          onOrderNumberChange={handleOrderNumberChange}
          onOrderingUserChange={handleOrderingUserChange}
          onSelectOrder={handleSelectOrder}
          orderTypeMetaById={orderTypeMetaById}
          pagination={ordersPaginationState}
          rows={orders}
          showCreatedAtColumn={viewConfig.showCreatedAtColumn}
          showOrderEntryColumn={viewConfig.showOrderEntryColumn}
          showOrderEntryFilter={viewConfig.showOrderEntryFilter}
          showOrderingColumn={viewConfig.showOrderingColumn}
          showOrderingFilter={viewConfig.showOrderingFilter}
          totalOrdersCount={totalOrdersCount}
          userLabelById={userLabelById}
        />
      )}

      <OrderFormDialog
        description={viewConfig.createDescription}
        feedback={createDialogFeedback}
        formState={createFormState}
        lockOrderEntryUser={viewConfig.lockOrderEntryToCurrentViewer}
        mode="create"
        open={createDialogOpen}
        orderDiscountOptions={orderDiscountOptions}
        orderEntryUserOptions={orderEntryUserOptions}
        orderTypeOptions={orderTypeOptions}
        orderUserOptions={userOptions}
        orderingUserOptions={orderingUserOptions}
        pending={createPending}
        purchaseOrderTypeOptions={purchaseOrderTypeOptions}
        serviceOrderTypeOptions={serviceOrderTypeOptions}
        showCostField={canViewOrderCosts}
        submitLabel={viewConfig.createTitle}
        title={viewConfig.createTitle}
        onFieldChange={updateCreateFormField}
        onOpenChange={(open) => {
          if (!open && createPending) {
            return;
          }

          if (!open) {
            setCreateDialogFeedback(null);
          }

          setCreateDialogOpen(open);
        }}
        onSubmit={handleCreateOrder}
      />

      <OrderFormDialog
        description={t("dialogs.editDescription")}
        feedback={editDialogFeedback}
        formState={editFormState}
        mode="edit"
        open={editDialogOpen}
        orderDiscountOptions={orderDiscountOptions}
        orderTypeOptions={orderTypeOptions}
        orderUserOptions={userOptions}
        pending={editPending}
        purchaseOrderTypeOptions={purchaseOrderTypeOptions}
        serviceOrderTypeOptions={serviceOrderTypeOptions}
        showCostField={canViewOrderCosts}
        supplementaryLoading={editSupplementaryLoading}
        submitLabel={t("dialogs.saveChanges")}
        title={t("dialogs.editTitle")}
        onFieldChange={updateEditFormField}
        onOpenChange={(open) => {
          if (!open && editPending) {
            return;
          }

          if (!open) {
            setEditOriginalOrderNumber(null);
            setEditDialogFeedback(null);
            setEditSupplementaryLoading(false);
            editSupplementaryLoadTokenRef.current += 1;
          }

          setEditDialogOpen(open);
        }}
        onSubmit={handleEditOrder}
      />

      <OrderDetailsDialog
        canDelete={canDeleteOrders}
        canEdit={canEditOrders}
        canViewCost={canViewOrderCosts}
        deletePending={deletePending}
        onDelete={handleDeleteOrder}
        onEdit={openEditDialog}
        forceDeletePending={forceDeletePending}
        onForceDelete={handleForceDeleteOrder}
        order={selectedOrder}
        orderTypeMetaById={orderTypeMetaById}
        showOrderEntryUser={viewConfig.showOrderEntryDetail}
        showOrderingUser={viewConfig.showOrderingDetail}
        supabase={supabase}
        userLabelById={userLabelById}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
          }
        }}
      />
    </section>
  );
}

