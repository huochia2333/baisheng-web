"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { BadgeDollarSign, ClipboardList, Plus, ReceiptText, ShieldAlert } from "lucide-react";

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
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import { useResumeRecovery } from "@/lib/use-resume-recovery";

import {
  EmptyState,
  formatDateTime,
  PageBanner,
  normalizeOptionalString,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  FilterField,
  OrderDetailsDialog,
  OrderFormDialog,
  OrderHeaderCell,
  OrdersLoadingState,
  OrderStatusChip,
  OrderSummaryCard,
  OrderTypeChip,
  OrderValueCell,
  filterInputClassName,
} from "./admin-orders/admin-orders-ui";
import {
  applyOrderFormDefaults,
  canCreateOrderByRole,
  canDeleteOrderByRole,
  canReadOrderByRole,
  canReadOrderCostByRole,
  canUpdateOrderByRole,
  createOrderFormState,
  createOrderFormStateFromOrder,
  deriveTransactionRateValue,
  formatMoneyValue,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getServiceSubtypeCostPreset,
  normalizeSearchText,
  parseCreateOrderForm,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
  type OrderFormState,
} from "./admin-orders/admin-orders-utils";
import { Button } from "../ui/button";

type PageFeedback = { tone: NoticeTone; message: string } | null;

type OrdersClientMode = "admin" | "salesman" | "client";

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

const ORDERS_VIEW_CONFIG: Record<OrdersClientMode, OrdersViewConfig> = {
  admin: {
    badge: "订单工作台",
    title: "订单中心",
    description: "列表会优先展示关键订单信息，点击任意订单即可查看完整细节。",
    createTitle: "创建订单",
    createDescription: "填写订单基础信息后，系统会立即将新订单写入订单列表。",
    emptyDescription: "当前还没有订单记录，新的订单录入后会出现在这里。",
    noPermissionDescription: "当前登录账号暂时没有订单中心查看权限。",
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
  },
  salesman: {
    badge: "业务员订单",
    title: "客户订单",
    description: "这里只展示你和关联客户的订单，你可以直接为自己名下的客户创建新订单。",
    createTitle: "创建客户订单",
    createDescription: "当前页面只允许为你已关联的客户创建订单，创建后会立即出现在列表中。",
    emptyDescription: "你和关联客户的订单会展示在这里，当前还没有可查看的订单。",
    noPermissionDescription: "当前登录账号暂时没有业务员订单查看权限。",
    noCreateTargetHint: "你当前还没有可创建订单的关联客户。",
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
  },
  client: {
    badge: "客户订单",
    title: "我的订单",
    description: "这里会展示与你本人相关的订单记录，你可以随时打开查看完整订单详情。",
    createTitle: "创建订单",
    createDescription: "",
    emptyDescription: "你当前还没有订单记录，后续生成的新订单会自动展示在这里。",
    noPermissionDescription: "当前登录账号暂时没有客户订单查看权限。",
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
  },
};

export function AdminOrdersClient({
  mode = "admin",
}: {
  mode?: OrdersClientMode;
}) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const viewConfig = ORDERS_VIEW_CONFIG[mode];

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
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
  const [filters, setFilters] = useState({
    orderEntryUser: "",
    orderNumber: "",
    orderingUser: "",
  });

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

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

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
          nextOrderCosts,
        ] = await Promise.all([
          getAdminOrders(supabase),
          getOrderUserOptions(supabase),
          getOrderTypeOptions(supabase),
          getPurchaseOrderTypeOptions(supabase),
          getServiceOrderTypeOptions(supabase),
          getOrderDiscountTypeOptions(supabase),
          nextCanViewOrderCosts ? getAdminOrderCosts(supabase) : Promise.resolve([]),
        ]);

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
          message: toOrderErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, supabase, viewConfig.allowCost],
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
      typeOptions.map((option) => [option.id, getOrderTypeMetaFromCategory(option.category)]),
    );
  }, [typeOptions]);

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

  if (!supabase || loading) {
    return <OrdersLoadingState />;
  }

  const openCreateDialog = () => {
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
  };

  const openEditDialog = (order: AdminOrderRow) => {
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
          message: toOrderErrorMessage(error),
        });
      })
      .finally(() => {
        if (editSupplementaryLoadTokenRef.current !== loadToken) {
          return;
        }

        setEditSupplementaryLoading(false);
      });
  };

  const updateCreateFormField = <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => {
    setCreateDialogFeedback(null);
    setCreateFormState((current) => {
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
    });
  };

  const updateEditFormField = <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => {
    setEditDialogFeedback(null);
    setEditFormState((current) => {
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
    });
  };

  const handleCreateOrder = async () => {
    if (!supabase || createPending || !canCreateOrders) {
      return;
    }

    const parsed = parseCreateOrderForm(createFormState, orderCategoryByTypeId);

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
        message: `订单 ${createdOrder.order_number} 已创建成功。`,
      });
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error),
      });
    } finally {
      setCreatePending(false);
    }
  };

  const handleEditOrder = async () => {
    if (!supabase || editPending || !editOriginalOrderNumber || !canEditOrders) {
      return;
    }

    const parsed = parseCreateOrderForm(editFormState, orderCategoryByTypeId);

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
        message: `订单 ${updatedOrder.order_number} 已更新成功。`,
      });
    } catch (error) {
      setEditDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error),
      });
    } finally {
      setEditPending(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!supabase || !selectedOrder || deletePending || !canDeleteOrders) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`确定要软删除订单 ${selectedOrder.order_number} 吗？删除后将从列表中隐藏。`)
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
        message: `订单 ${selectedOrder.order_number} 已软删除。`,
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error),
      });
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              {viewConfig.badge}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              {viewConfig.title}
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              {viewConfig.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:items-end">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <OrderSummaryCard
                accent="blue"
                count={summary.total}
                icon={<ReceiptText className="size-5" />}
                label="订单总数"
              />
              <OrderSummaryCard
                accent="gold"
                count={summary.pending}
                icon={<ClipboardList className="size-5" />}
                label="待处理订单"
              />
              <OrderSummaryCard
                accent="green"
                count={summary.completed}
                icon={<BadgeDollarSign className="size-5" />}
                label="已完成订单"
              />
            </div>

            {canCreateOrders ? (
              <>
                <Button
                  className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={!canOpenCreateDialog}
                  onClick={openCreateDialog}
                  type="button"
                >
                  <Plus className="size-4" />
                  {viewConfig.createTitle}
                </Button>
                {viewConfig.noCreateTargetHint && !canOpenCreateDialog ? (
                  <p className="text-sm text-[#69747d]">{viewConfig.noCreateTargetHint}</p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {canViewOrders === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewConfig.noPermissionDescription}
            icon={<ShieldAlert className="size-6" />}
            title="暂无查看权限"
          />
        </section>
      ) : orders.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewConfig.emptyDescription}
            icon={<ReceiptText className="size-6" />}
            title="订单列表暂时为空"
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
          <div
            className={`mb-5 grid gap-4 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] ${
              viewConfig.showOrderEntryFilter && viewConfig.showOrderingFilter
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                : viewConfig.showOrderingFilter
                  ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  : "lg:grid-cols-[minmax(0,1fr)_auto]"
            }`}
          >
            <FilterField label="订单编号">
              <input
                className={filterInputClassName}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    orderNumber: event.target.value,
                  }))
                }
                placeholder="输入订单编号查找"
                type="text"
                value={filters.orderNumber}
              />
            </FilterField>

            {viewConfig.showOrderEntryFilter ? (
              <FilterField label="订单录入员">
                <input
                  className={filterInputClassName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      orderEntryUser: event.target.value,
                    }))
                  }
                  placeholder="输入录入员姓名或邮箱"
                  type="text"
                  value={filters.orderEntryUser}
                />
              </FilterField>
            ) : null}

            {viewConfig.showOrderingFilter ? (
              <FilterField label="订单客户">
                <input
                  className={filterInputClassName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      orderingUser: event.target.value,
                    }))
                  }
                  placeholder="输入客户姓名或邮箱"
                  type="text"
                  value={filters.orderingUser}
                />
              </FilterField>
            ) : null}

            <div className="flex flex-col justify-end gap-3 lg:items-end">
              <p className="text-sm text-[#69747d]">
                共 {orders.length} 条，匹配 {filteredOrders.length} 条
              </p>
              <Button
                disabled={
                  !filters.orderNumber && !filters.orderEntryUser && !filters.orderingUser
                }
                onClick={() =>
                  setFilters({
                    orderEntryUser: "",
                    orderNumber: "",
                    orderingUser: "",
                  })
                }
                type="button"
                variant="outline"
              >
                清空筛选
              </Button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <EmptyState
              description="没有找到符合当前筛选条件的订单，可以调整关键词后再试。"
              icon={<ClipboardList className="size-6" />}
              title="没有匹配结果"
            />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full table-fixed border-collapse">
                  <thead className="bg-[#f7f5f2]">
                    <tr className="border-b border-[#efebe5]">
                      <OrderHeaderCell>订单编号</OrderHeaderCell>
                      <OrderHeaderCell>人民币总计</OrderHeaderCell>
                      {canViewOrderCosts ? <OrderHeaderCell>订单成本</OrderHeaderCell> : null}
                      {viewConfig.showOrderEntryColumn ? (
                        <OrderHeaderCell>订单录入员</OrderHeaderCell>
                      ) : null}
                      {viewConfig.showOrderingColumn ? (
                        <OrderHeaderCell>订单客户</OrderHeaderCell>
                      ) : null}
                      <OrderHeaderCell>订单状态</OrderHeaderCell>
                      <OrderHeaderCell>订单类型</OrderHeaderCell>
                      {viewConfig.showCreatedAtColumn ? (
                        <OrderHeaderCell>创建日期</OrderHeaderCell>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.order_number}
                        className="cursor-pointer border-b border-[#efebe5] transition-colors hover:bg-[#fcfbf8] last:border-b-0"
                        onClick={() => setSelectedOrder(order)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedOrder(order);
                          }
                        }}
                        tabIndex={0}
                      >
                        <OrderValueCell strong value={order.order_number} />
                        <OrderValueCell value={formatMoneyValue(order.rmb_amount)} />
                        {canViewOrderCosts ? (
                          <OrderValueCell value={formatMoneyValue(order.cost_amount)} />
                        ) : null}
                        {viewConfig.showOrderEntryColumn ? (
                          <OrderValueCell
                            value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
                          />
                        ) : null}
                        {viewConfig.showOrderingColumn ? (
                          <OrderValueCell
                            value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
                          />
                        ) : null}
                        <OrderValueCell value={<OrderStatusChip status={order.order_status} />} />
                        <OrderValueCell
                          value={
                            <OrderTypeChip
                              meta={resolveOrderTypeMeta(order.order_type, orderTypeMetaById)}
                            />
                          }
                        />
                        {viewConfig.showCreatedAtColumn ? (
                          <OrderValueCell value={formatDateTime(order.created_at)} />
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
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
        description="编辑后会立即覆盖当前订单信息，并同步更新订单详情。"
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
        submitLabel="保存修改"
        title="编辑订单"
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

