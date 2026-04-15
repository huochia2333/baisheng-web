"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReceiptText, ShieldAlert } from "lucide-react";

import {
  createAdminOrder,
  deleteAdminOrder,
  getAdminOrders,
  getAdminOrderCosts,
  getAdminOrderSupplementaryDetail,
  getCurrentOrderViewerContext,
  mergeAdminOrdersWithCosts,
  getOrderDiscountTypeOptions,
  getOrderTypeOptions,
  getOrderUserOptions,
  getPurchaseOrderTypeOptions,
  getServiceOrderTypeOptions,
  updateAdminOrder,
  type AdminOrderRow,
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import {
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useBrowserCloudSyncRecovery } from "@/lib/use-browser-cloud-sync-recovery";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";

import {
  createDashboardSharedCopy,
  EmptyState,
  normalizeSearchText,
  PageBanner,
  normalizeOptionalString,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  OrderDetailsDialog,
  OrderFormDialog,
  OrdersLoadingState,
} from "./admin-orders/admin-orders-ui";
import {
  OrdersHeaderSection,
  OrdersTableSection,
} from "./admin-orders/admin-orders-sections";
import {
  applyOrderFormDefaults,
  canCreateOrderByRole,
  canDeleteOrderByRole,
  canReadOrderByRole,
  canReadOrderCostByRole,
  canUpdateOrderByRole,
  createOrdersUiCopy,
  createOrderFormState,
  createOrderFormStateFromOrder,
  deriveTransactionRateValue,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getServiceSubtypeCostPreset,
  parseCreateOrderForm,
  resolveOrderUserLabel,
  toOrderErrorMessage,
  type OrderFormState,
} from "./admin-orders/admin-orders-utils";

type PageFeedback = { tone: NoticeTone; message: string } | null;

type OrdersClientMode = "admin" | "salesman" | "client";

const EMPTY_ORDER_FILTERS = {
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

export function AdminOrdersClient({
  mode = "admin",
}: {
  mode?: OrdersClientMode;
}) {
  const router = useRouter();
  const t = useTranslations("Orders");
  const ordersUiT = useTranslations("OrdersUI");
  const sharedT = useTranslations("DashboardShared");
  const supabase = getBrowserSupabaseClient();
  const viewConfig = getOrdersViewConfig(mode, t);
  const ordersUiCopy = useMemo(() => createOrdersUiCopy(ordersUiT), [ordersUiT]);
  const sharedCopy = useMemo(() => createDashboardSharedCopy(sharedT), [sharedT]);

  const [loading, setLoading] = useState(true);
  const { recoverCloudSync, syncGeneration } = useBrowserCloudSyncRecovery();
  const [canViewOrders, setCanViewOrders] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [userOptions, setUserOptions] = useState<OrderUserOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<BusinessCategoryOption[]>([]);
  const [purchaseTypeOptions, setPurchaseTypeOptions] = useState<PurchaseOrderTypeOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<ServiceOrderTypeOption[]>([]);
  const [discountOptions, setDiscountOptions] = useState<OrderDiscountTypeOption[]>([]);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(null);
  const [currentViewerRole, setCurrentViewerRole] = useState<AppRole | null>(null);
  const [currentViewerStatus, setCurrentViewerStatus] = useState<UserStatus | null>(null);
  const [filters, setFilters] = useState(EMPTY_ORDER_FILTERS);

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
  const loadingStateRef = useRef(true);
  const editSupplementaryLoadTokenRef = useRef(0);

  loadingStateRef.current = loading;

  const loadOrders = useCallback(
    async ({
      isMounted,
      showLoading,
    }: {
      isMounted: () => boolean;
      showLoading: boolean;
    }) => {
      if (!supabase) {
        return;
      }

      if (showLoading && isMounted()) {
        setLoading(true);
      }

      try {
        if (shouldRecoverBrowserCloudSyncState()) {
          recoverCloudSync();
          return;
        }

        const viewer = await getCurrentOrderViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        const nextCanViewOrders = canReadOrderByRole(viewer.role, viewer.status);
        const nextCanViewOrderCosts =
          viewConfig.allowCost && canReadOrderCostByRole(viewer.role, viewer.status);
        setCanViewOrders(nextCanViewOrders);
        setCurrentViewerId(viewer.user.id);
        setCurrentViewerRole(viewer.role);
        setCurrentViewerStatus(viewer.status);

        if (!nextCanViewOrders) {
          setOrders([]);
          setUserOptions([]);
          setTypeOptions([]);
          setPurchaseTypeOptions([]);
          setServiceTypeOptions([]);
          setDiscountOptions([]);
          setPageFeedback(null);
          return;
        }

        const [
          nextOrders,
          nextUserOptions,
          nextTypeOptions,
          nextPurchaseTypeOptions,
          nextServiceTypeOptions,
          nextDiscountOptions,
        ] = await Promise.all([
          getAdminOrders(supabase),
          getOrderUserOptions(supabase),
          getOrderTypeOptions(supabase),
          getPurchaseOrderTypeOptions(supabase),
          getServiceOrderTypeOptions(supabase),
          getOrderDiscountTypeOptions(supabase),
        ]);
        const nextOrderCosts =
          nextCanViewOrderCosts && nextOrders.length > 0
            ? await getAdminOrderCosts(
                supabase,
                nextOrders.map((order) => order.id),
              )
            : [];

        if (!isMounted()) {
          return;
        }

        setOrders(
          nextCanViewOrderCosts
            ? mergeAdminOrdersWithCosts(nextOrders, nextOrderCosts)
            : nextOrders,
        );
        setUserOptions(nextUserOptions);
        setTypeOptions(nextTypeOptions);
        setPurchaseTypeOptions(nextPurchaseTypeOptions);
        setServiceTypeOptions(nextServiceTypeOptions);
        setDiscountOptions(nextDiscountOptions);
        setPageFeedback(null);
        setCreateFormState((current) =>
          applyOrderFormDefaults(current, {
            orderEntryUser: viewer.user.id,
            orderType: nextTypeOptions[0]?.id ?? "",
          }),
        );
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [ordersUiCopy, recoverCloudSync, router, sharedCopy, supabase, viewConfig.allowCost],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadOrders({
        isMounted,
        showLoading: loadingStateRef.current,
      }),
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await loadOrders({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const canViewOrderCosts =
    viewConfig.allowCost && canReadOrderCostByRole(currentViewerRole, currentViewerStatus);
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

  const summary = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.order_status === "pending").length,
      completed: orders.filter((order) => order.order_status === "completed").length,
    };
  }, [orders]);

  const userLabelById = useMemo(() => {
    return new Map(userOptions.map((option) => [option.user_id, getOrderUserOptionLabel(option)]));
  }, [userOptions]);

  const orderTypeMetaById = useMemo(() => {
    return new Map(
      typeOptions.map((option) => [
        option.id,
        getOrderTypeMetaFromCategory(option.category, ordersUiCopy),
      ]),
    );
  }, [ordersUiCopy, typeOptions]);

  const orderCategoryByTypeId = useMemo(() => {
    return new Map(
      typeOptions.map((option) => [option.id, normalizeOptionalString(option.category)]),
    );
  }, [typeOptions]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderNumber = normalizeSearchText(order.order_number);
      const orderEntryUser = normalizeSearchText(
        resolveOrderUserLabel(order.order_entry_user, userLabelById),
      );
      const orderingUser = normalizeSearchText(
        resolveOrderUserLabel(order.ordering_user, userLabelById),
      );

      return (
        orderNumber.includes(normalizeSearchText(filters.orderNumber)) &&
        orderEntryUser.includes(normalizeSearchText(filters.orderEntryUser)) &&
        orderingUser.includes(normalizeSearchText(filters.orderingUser))
      );
    });
  }, [filters.orderEntryUser, filters.orderNumber, filters.orderingUser, orders, userLabelById]);
  const ordersPagination = useDashboardPagination(filteredOrders);
  const ordersPaginationState = useMemo(
    () => ({
      endIndex: ordersPagination.endIndex,
      hasNextPage: ordersPagination.hasNextPage,
      hasPreviousPage: ordersPagination.hasPreviousPage,
      onNextPage: ordersPagination.goToNextPage,
      onPreviousPage: ordersPagination.goToPreviousPage,
      page: ordersPagination.page,
      pageCount: ordersPagination.pageCount,
      startIndex: ordersPagination.startIndex,
      totalItems: ordersPagination.totalItems,
    }),
    [
      ordersPagination.endIndex,
      ordersPagination.goToNextPage,
      ordersPagination.goToPreviousPage,
      ordersPagination.hasNextPage,
      ordersPagination.hasPreviousPage,
      ordersPagination.page,
      ordersPagination.pageCount,
      ordersPagination.startIndex,
      ordersPagination.totalItems,
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
        orderType: typeOptions[0]?.id ?? "",
      }),
    );
    setCreateDialogOpen(true);
  }, [canOpenCreateDialog, currentViewerId, typeOptions]);

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
      setOrders((current) => [createdOrder, ...current]);
      setCreateDialogOpen(false);
      setCreateDialogFeedback(null);
      setCreateFormState(
        createOrderFormState({
          orderEntryUser: currentViewerId ?? "",
          orderType: typeOptions[0]?.id ?? "",
        }),
      );
      setPageFeedback({
        tone: "success",
        message: t("feedback.createSuccess", { orderNumber: createdOrder.order_number }),
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
    typeOptions,
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

      setOrders((current) =>
        current.map((item) =>
          item.order_number === editOriginalOrderNumber ? updatedOrder : item,
        ),
      );
      setEditDialogOpen(false);
      setEditDialogFeedback(null);
      setEditOriginalOrderNumber(null);
      setSelectedOrder(updatedOrder);
      setPageFeedback({
        tone: "success",
        message: t("feedback.updateSuccess", { orderNumber: updatedOrder.order_number }),
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
  ]);

  const handleDeleteOrder = useCallback(async () => {
    if (!supabase || !selectedOrder || deletePending || !canDeleteOrders) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        t("feedback.deleteConfirm", { orderNumber: selectedOrder.order_number }),
      )
    ) {
      return;
    }

    setDeletePending(true);
    setPageFeedback(null);

    try {
      await deleteAdminOrder(supabase, selectedOrder.order_number);
      setOrders((current) =>
        current.filter((item) => item.order_number !== selectedOrder.order_number),
      );
      setSelectedOrder(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.deleteSuccess", { orderNumber: selectedOrder.order_number }),
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setDeletePending(false);
    }
  }, [canDeleteOrders, deletePending, ordersUiCopy, selectedOrder, sharedCopy, supabase, t]);

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

  if (!supabase || loading) {
    return <OrdersLoadingState />;
  }

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
      ) : orders.length === 0 ? (
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
          filteredOrders={filteredOrders}
          filters={filters}
          onClearFilters={clearFilters}
          onOrderEntryUserChange={handleOrderEntryUserChange}
          onOrderNumberChange={handleOrderNumberChange}
          onOrderingUserChange={handleOrderingUserChange}
          onSelectOrder={handleSelectOrder}
          orderTypeMetaById={orderTypeMetaById}
          ordersCount={orders.length}
          pagination={ordersPaginationState}
          rows={ordersPagination.items}
          showCreatedAtColumn={viewConfig.showCreatedAtColumn}
          showOrderEntryColumn={viewConfig.showOrderEntryColumn}
          showOrderEntryFilter={viewConfig.showOrderEntryFilter}
          showOrderingColumn={viewConfig.showOrderingColumn}
          showOrderingFilter={viewConfig.showOrderingFilter}
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
        orderDiscountOptions={discountOptions}
        orderEntryUserOptions={orderEntryUserOptions}
        orderTypeOptions={typeOptions}
        orderUserOptions={userOptions}
        orderingUserOptions={orderingUserOptions}
        pending={createPending}
        purchaseOrderTypeOptions={purchaseTypeOptions}
        serviceOrderTypeOptions={serviceTypeOptions}
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
        orderDiscountOptions={discountOptions}
        orderTypeOptions={typeOptions}
        orderUserOptions={userOptions}
        pending={editPending}
        purchaseOrderTypeOptions={purchaseTypeOptions}
        serviceOrderTypeOptions={serviceTypeOptions}
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

