"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  ClipboardList,
  LoaderCircle,
  PencilLine,
  Plus,
  ReceiptText,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  createAdminOrder,
  deleteAdminOrder,
  getAdminOrders,
  getAdminOrderSupplementaryDetail,
  getCurrentOrderViewerContext,
  getOrderDiscountTypeOptions,
  getOrderTypeOptions,
  getOrderUserOptions,
  getPurchaseOrderTypeOptions,
  getServiceOrderTypeOptions,
  updateAdminOrder,
  type AdminOrderDetailValue,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type BusinessCategoryOption,
  type CreateAdminOrderInput,
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
import { useDelayedTimeoutWarning } from "@/lib/use-delayed-timeout-warning";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  PageBanner,
  formatDateTime,
  normalizeOptionalString,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";
import { DashboardDialog } from "./dashboard-dialog";
import { Button } from "../ui/button";

type PageFeedback = { tone: NoticeTone; message: string } | null;

type OrderFormState = {
  orderNumber: string;
  originalCurrency: string;
  amount: string;
  dailyExchangeRate: string;
  transactionRate: string;
  rmbAmount: string;
  orderEntryUser: string;
  orderingUser: string;
  orderStatus: string;
  orderType: string;
  createdAt: string;
  reviewedAt: string;
  purchaseSubtype: string;
  purchaseDetails: string;
  serviceSubtype: string;
  serviceDiscount: string;
  serviceDetails: string;
};

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "待处理" },
  { value: "in_progress", label: "处理中" },
  { value: "settled", label: "已结算" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
  { value: "refunding", label: "退款中" },
] as const;

export function AdminOrdersClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [userOptions, setUserOptions] = useState<OrderUserOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<BusinessCategoryOption[]>([]);
  const [purchaseTypeOptions, setPurchaseTypeOptions] = useState<PurchaseOrderTypeOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<ServiceOrderTypeOption[]>([]);
  const [discountOptions, setDiscountOptions] = useState<OrderDiscountTypeOption[]>([]);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(null);
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
  const { clearPendingTimeoutWarning, scheduleTimeoutWarning } =
    useDelayedTimeoutWarning();

  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    clearPendingTimeoutWarning();
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, [clearPendingTimeoutWarning]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    if (shouldRecoverBrowserCloudSyncState()) {
      recoverCloudSync();
      return;
    }

    let isMounted = true;
    const showLoading = loadingStateRef.current;

    const loadOrders = async ({ showLoading }: { showLoading: boolean }) => {
      let warningDelayed = false;

      if (showLoading && isMounted) {
        setLoading(true);
      }

      clearPendingTimeoutWarning();

      try {
        const viewer = await getCurrentOrderViewerContext(supabase);

        if (!isMounted) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        const isAdmin = viewer.role === "administrator";
        setHasPermission(isAdmin);
        setCurrentViewerId(viewer.user.id);

        if (!isAdmin) {
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

        if (!isMounted) {
          return;
        }

        setOrders(nextOrders);
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
        if (!isMounted) {
          return;
        }

        warningDelayed = scheduleTimeoutWarning(error, () => {
          if (!isMounted) {
            return;
          }

          setPageFeedback({
            tone: "error",
            message: toOrderErrorMessage(error),
          });

          if (showLoading) {
            setLoading(false);
          }
        });

        if (!warningDelayed) {
          setPageFeedback({
            tone: "error",
            message: toOrderErrorMessage(error),
          });
        }
      } finally {
        if (showLoading && isMounted && !warningDelayed) {
          setLoading(false);
        }
      }
    };

    void loadOrders({ showLoading });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        await loadOrders({ showLoading: false });
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [
    clearPendingTimeoutWarning,
    recoverCloudSync,
    router,
    scheduleTimeoutWarning,
    supabase,
    syncGeneration,
  ]);

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

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
    setCreateFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateEditFormField = <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => {
    setEditDialogFeedback(null);
    setEditFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCreateOrder = async () => {
    if (!supabase || createPending) {
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
    if (!supabase || editPending || !editOriginalOrderNumber) {
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
    if (!supabase || !selectedOrder || deletePending) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`确定要彻底删除订单 ${selectedOrder.order_number} 吗？删除后无法恢复。`)
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
        message: `订单 ${selectedOrder.order_number} 已彻底删除。`,
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
              订单工作台
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              订单中心
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              列表会优先展示关键订单信息，点击任意订单即可查看完整细节。
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

            {hasPermission ? (
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                onClick={openCreateDialog}
                type="button"
              >
                <Plus className="size-4" />
                创建订单
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前登录账号不是管理员，暂时无法查看订单中心。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无查看权限"
          />
        </section>
      ) : orders.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前还没有订单记录，新的订单录入后会出现在这里。"
            icon={<ReceiptText className="size-6" />}
            title="订单列表暂时为空"
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
          <div className="mb-5 grid gap-4 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                      <OrderHeaderCell>订单录入员</OrderHeaderCell>
                      <OrderHeaderCell>订单客户</OrderHeaderCell>
                      <OrderHeaderCell>订单状态</OrderHeaderCell>
                      <OrderHeaderCell>订单类型</OrderHeaderCell>
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
                        <OrderValueCell
                          value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
                        />
                        <OrderValueCell
                          value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
                        />
                        <OrderValueCell value={<OrderStatusChip status={order.order_status} />} />
                        <OrderValueCell
                          value={
                            <OrderTypeChip
                              meta={resolveOrderTypeMeta(order.order_type, orderTypeMetaById)}
                            />
                          }
                        />
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
        description="填写订单基础信息后，系统会立即将新订单写入订单列表。"
        feedback={createDialogFeedback}
        formState={createFormState}
        mode="create"
        open={createDialogOpen}
        orderDiscountOptions={discountOptions}
        orderTypeOptions={typeOptions}
        orderUserOptions={userOptions}
        pending={createPending}
        purchaseOrderTypeOptions={purchaseTypeOptions}
        serviceOrderTypeOptions={serviceTypeOptions}
        submitLabel="创建订单"
        title="创建订单"
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
        deletePending={deletePending}
        onDelete={handleDeleteOrder}
        onEdit={openEditDialog}
        order={selectedOrder}
        orderTypeMetaById={orderTypeMetaById}
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

function OrdersLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载订单列表...
      </div>
    </div>
  );
}

function OrderSummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" && "border-[#d9e3eb] bg-[#f4f8fb]",
        accent === "green" && "border-[#dce8df] bg-[#f2f7f3]",
        accent === "gold" && "border-[#eadfbf] bg-[#fbf5e8]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" && "bg-[#486782]",
            accent === "green" && "bg-[#4c7259]",
            accent === "gold" && "bg-[#b7892f]",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">{label}</span>
      {children}
    </label>
  );
}

function OrderFormDialog({
  mode,
  title,
  description,
  submitLabel,
  feedback,
  open,
  pending,
  formState,
  orderDiscountOptions,
  orderTypeOptions,
  orderUserOptions,
  purchaseOrderTypeOptions,
  serviceOrderTypeOptions,
  supplementaryLoading = false,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  feedback?: PageFeedback;
  open: boolean;
  pending: boolean;
  formState: OrderFormState;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orderUserOptions: OrderUserOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  supplementaryLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldChange: <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => void;
  onSubmit: () => void;
}) {
  const selectedOrderCategory = useMemo(() => {
    return (
      orderTypeOptions.find((option) => option.id === formState.orderType)?.category ?? null
    );
  }, [formState.orderType, orderTypeOptions]);
  const isFormBusy = pending || supplementaryLoading;

  return (
    <DashboardDialog
      actions={
        <>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              取消
            </Button>
            <Button
              className="bg-[#486782] text-white hover:bg-[#3e5f79]"
              disabled={isFormBusy}
              onClick={onSubmit}
              type="button"
            >
              {isFormBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <PencilLine className="size-4" />
            )}
            {submitLabel}
          </Button>
        </>
      }
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
        <OrderField label="订单编号" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
              onChange={(event) => onFieldChange("orderNumber", event.target.value)}
            placeholder="请输入订单编号"
            type="text"
            value={formState.orderNumber}
          />
        </OrderField>

        <OrderField label="原始货币" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
            placeholder="例如 USD、CNY、EUR"
            type="text"
            value={formState.originalCurrency}
          />
        </OrderField>

        <OrderField label="金额总计" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("amount", event.target.value)}
            placeholder="请输入金额总计"
            step="0.01"
            type="number"
            value={formState.amount}
          />
        </OrderField>

        <OrderField label="当日汇率" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
            placeholder="请输入当日汇率"
            step="0.0001"
            type="number"
            value={formState.dailyExchangeRate}
          />
        </OrderField>

        <OrderField label="公司成交汇率" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("transactionRate", event.target.value)}
            placeholder="请输入公司成交汇率"
            step="0.0001"
            type="number"
            value={formState.transactionRate}
          />
        </OrderField>

        <OrderField label="人民币总计" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("rmbAmount", event.target.value)}
            placeholder="请输入人民币总计"
            step="0.01"
            type="number"
            value={formState.rmbAmount}
          />
        </OrderField>

        <OrderField label="订单录入员" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderEntryUser", event.target.value)}
            value={formState.orderEntryUser}
          >
            <option value="">请选择订单录入员</option>
            {orderUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单客户" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderingUser", event.target.value)}
            value={formState.orderingUser}
          >
            <option value="">请选择订单客户</option>
            {orderUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单状态" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderStatus", event.target.value)}
            value={formState.orderStatus}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单类型" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderType", event.target.value)}
            value={formState.orderType}
          >
            <option value="">请选择订单类型</option>
            {orderTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {getOrderTypeMetaFromCategory(option.category).label}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="创建日期" required>
          <input
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("createdAt", event.target.value)}
            type="datetime-local"
            value={formState.createdAt}
          />
        </OrderField>

        <OrderField label="最后一次改动日期" required>
          <input
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("reviewedAt", event.target.value)}
            type="datetime-local"
            value={formState.reviewedAt}
          />
        </OrderField>

        {selectedOrderCategory === "purchase" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? "当前订单类型为采购订单，请继续填写采购子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
                  : "当前订单类型为采购订单，可直接修改采购子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
              }
              title="采购订单信息"
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  正在加载采购订单信息...
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label="采购小类" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("purchaseSubtype", event.target.value)}
                    value={formState.purchaseSubtype}
                  >
                    <option value="">请选择采购小类</option>
                    {purchaseOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatPurchaseOrderSubtype(option.business_subcategory)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label="采购订单明细">
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("purchaseDetails", event.target.value)}
                  placeholder={'可填写 JSON，或按行输入，例如：\n商品名称: iPhone 16 Pro\n数量: 2\n收货城市: 上海'}
                  rows={6}
                  value={formState.purchaseDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}

        {selectedOrderCategory === "service" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? "当前订单类型为服务订单，请继续填写服务子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
                  : "当前订单类型为服务订单，可直接修改服务子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
              }
              title="服务订单信息"
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  正在加载服务订单信息...
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label="服务小类" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceSubtype", event.target.value)}
                    value={formState.serviceSubtype}
                  >
                    <option value="">请选择服务小类</option>
                    {serviceOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatServiceOrderSubtype(option.business_subcategory)}
                      </option>
                    ))}
                  </select>
                </OrderField>

                <OrderField label="订单折扣" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceDiscount", event.target.value)}
                    value={formState.serviceDiscount}
                  >
                    <option value="">请选择订单折扣</option>
                    {orderDiscountOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatDiscountRatioValue(option.discount_ratio)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label="服务订单明细">
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("serviceDetails", event.target.value)}
                  placeholder={'可填写 JSON，或按行输入，例如：\n服务日期: 2026-04-02\n服务地点: 上海浦东机场\n接待人数: 3'}
                  rows={6}
                  value={formState.serviceDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}
        </div>
      </div>
    </DashboardDialog>
  );
}

function OrderDetailsDialog({
  order,
  userLabelById,
  orderTypeMetaById,
  supabase,
  onEdit,
  onDelete,
  deletePending,
  onOpenChange,
}: {
  order: AdminOrderRow | null;
  userLabelById: Map<string, string>;
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>;
  supabase: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>;
  onEdit: (order: AdminOrderRow) => void;
  onDelete: () => void;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const typeMeta = resolveOrderTypeMeta(order?.order_type ?? null, orderTypeMetaById);
  const orderNumber = order?.order_number ?? null;
  const [supplementaryState, setSupplementaryState] = useState<{
    orderNumber: string | null;
    detail: AdminOrderSupplementaryDetail | null;
    error: string | null;
  }>({
    orderNumber: null,
    detail: null,
    error: null,
  });

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let isActive = true;

    void getAdminOrderSupplementaryDetail(supabase, orderNumber)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail,
          error: null,
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail: null,
          error: toOrderErrorMessage(error),
        });
      });

    return () => {
      isActive = false;
    };
  }, [orderNumber, supabase]);

  const supplementaryLoading =
    orderNumber !== null && supplementaryState.orderNumber !== orderNumber;
  const supplementaryDetail =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.detail : null;
  const supplementaryError =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.error : null;

  return (
    <DashboardDialog
      actions={
        order ? (
          <>
            <Button onClick={() => onEdit(order)} type="button" variant="outline">
              <PencilLine className="size-4" />
              编辑订单
            </Button>
            <Button
              className="border-[#efd6d6] bg-white text-[#b13d3d] hover:bg-[#fff4f4]"
              disabled={deletePending}
              onClick={onDelete}
              type="button"
              variant="outline"
            >
              {deletePending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              删除订单
            </Button>
          </>
        ) : null
      }
      description={order ? "查看订单的完整金额、汇率、人员信息以及关联表单内容。" : undefined}
      onOpenChange={onOpenChange}
      open={order !== null}
      title={order ? `订单 ${order.order_number}` : "订单详情"}
    >
      {order ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <OrderDetailCard label="订单编号" value={order.order_number} />
            <OrderDetailCard label="订单状态" value={getStatusLabel(order.order_status)} />
            <OrderDetailCard label="订单类型" value={typeMeta.label} />
            <OrderDetailCard label="原始货币" value={formatCurrencyCode(order.original_currency)} />
            <OrderDetailCard label="金额总计" value={formatMoneyValue(order.amount)} />
            <OrderDetailCard label="人民币总计" value={formatMoneyValue(order.rmb_amount)} />
            <OrderDetailCard label="当日汇率" value={formatRateValue(order.daily_exchange_rate)} />
            <OrderDetailCard
              label="公司成交汇率"
              value={formatRateValue(order.transaction_rate)}
            />
            <OrderDetailCard
              label="订单录入员"
              value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
            />
            <OrderDetailCard
              label="订单客户"
              value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
            />
            <OrderDetailCard label="创建日期" value={formatDateTime(order.created_at)} />
            <OrderDetailCard
              label="最后一次改动日期"
              value={formatDateTime(order.reviewed_at)}
            />
          </div>

          <OrderSupplementaryDetailsSection
            detail={supplementaryDetail}
            error={supplementaryError}
            loading={supplementaryLoading}
          />
        </div>
      ) : null}
    </DashboardDialog>
  );
}

function OrderSupplementaryDetailsSection({
  detail,
  loading,
  error,
}: {
  detail: AdminOrderSupplementaryDetail | null;
  loading: boolean;
  error: string | null;
}) {
  const detailItems = useMemo(
    () => (detail ? flattenOrderDetailItems(detail.details) : []),
    [detail],
  );

  if (loading) {
    return (
      <div className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
        <div className="flex items-center gap-3 text-sm text-[#60707d]">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载关联表单内容...
        </div>
      </div>
    );
  }

  if (error) {
    return <PageBanner tone="error">{error}</PageBanner>;
  }

  if (!detail) {
    return <PageBanner tone="info">当前订单还没有对应的采购单或服务单表单内容。</PageBanner>;
  }

  const formTitle = detail.kind === "purchase" ? "采购订单表单" : "服务订单表单";
  const subtypeLabel = detail.kind === "purchase" ? "采购小类" : "服务小类";
  const subtypeValue =
    detail.kind === "purchase"
      ? formatPurchaseOrderSubtype(detail.subtype)
      : formatServiceOrderSubtype(detail.subtype);

  return (
    <section className="rounded-[28px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)] sm:p-6">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-[#23313a]">{formTitle}</h3>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <OrderDetailCard label="来源表单" value={formTitle} />
        <OrderDetailCard label={subtypeLabel} value={subtypeValue} />
        {detail.kind === "service" ? (
          <OrderDetailCard
            label="订单折扣"
            value={formatDiscountRatioValue(detail.discountRatio)}
          />
        ) : null}

        {detailItems.length > 0 ? (
          detailItems.map((item, index) => (
            <OrderDetailCard
              key={`${item.label}-${index}`}
              label={item.label}
              multiline
              value={item.value}
            />
          ))
        ) : (
          <div className="md:col-span-2">
            <PageBanner tone="info">当前关联表单还没有填写更多明细内容。</PageBanner>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#31424d]">
        <span>{label}</span>
        {required ? <span className="text-[#b13d3d]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function OrderSupplementaryFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#23313a]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#66717a]">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function OrderDetailCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#ebe7e1] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm leading-7 text-[#2b3942]",
          multiline ? "whitespace-pre-wrap break-words" : "truncate",
        )}
        title={multiline ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function OrderHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
      {children}
    </th>
  );
}

function OrderValueCell({
  value,
  strong,
}: {
  value: ReactNode;
  strong?: boolean;
}) {
  const title = typeof value === "string" ? value : undefined;

  return (
    <td
      className={cn(
        "max-w-[220px] px-5 py-4 text-sm text-[#2b3942]",
        strong ? "font-semibold text-[#223038]" : "font-medium",
      )}
      title={title}
    >
      <div className="truncate">{value}</div>
    </td>
  );
}

function OrderStatusChip({ status }: { status: string | null }) {
  const normalizedStatus = normalizeOptionalString(status);

  if (!normalizedStatus) {
    return <StatusTag tone="default">待补充</StatusTag>;
  }

  const matchedStatus = ORDER_STATUS_OPTIONS.find((option) => option.value === normalizedStatus);

  if (!matchedStatus) {
    return <StatusTag tone="default">{normalizedStatus}</StatusTag>;
  }

  return (
    <StatusTag
      tone={
        normalizedStatus === "pending"
          ? "gold"
          : normalizedStatus === "completed"
            ? "green"
            : normalizedStatus === "cancelled" || normalizedStatus === "refunding"
              ? "red"
              : "blue"
      }
    >
      {matchedStatus.label}
    </StatusTag>
  );
}

function OrderTypeChip({
  meta,
}: {
  meta: ReturnType<typeof getOrderTypeMetaFromCategory>;
}) {
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
}

function StatusTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "default" | "gold" | "green" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "blue" && "bg-[#eef3f7] text-[#486782]",
        tone === "default" && "bg-[#f0efec] text-[#6d787f]",
        tone === "gold" && "bg-[#fff5db] text-[#9a6a07]",
        tone === "green" && "bg-[#e8f4ec] text-[#4c7259]",
        tone === "red" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {children}
    </span>
  );
}

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const fieldTextareaClassName =
  "w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 py-3 text-[15px] leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition placeholder:text-[#98a2aa] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

function createOrderFormState(defaults?: {
  orderEntryUser?: string;
  orderType?: string;
}): OrderFormState {
  return {
    orderNumber: "",
    originalCurrency: "",
    amount: "",
    dailyExchangeRate: "",
    transactionRate: "",
    rmbAmount: "",
    orderEntryUser: defaults?.orderEntryUser ?? "",
    orderingUser: "",
    orderStatus: "pending",
    orderType: defaults?.orderType ?? "",
    createdAt: getNowDateTimeInputValue(),
    reviewedAt: getNowDateTimeInputValue(),
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
    orderNumber: order.order_number,
    originalCurrency: formatCurrencyCode(order.original_currency),
    amount: formatEditableNumericValue(order.amount),
    dailyExchangeRate: formatEditableNumericValue(order.daily_exchange_rate),
    transactionRate: formatEditableNumericValue(order.transaction_rate),
    rmbAmount: formatEditableNumericValue(order.rmb_amount),
    orderEntryUser: normalizeOptionalString(order.order_entry_user) ?? "",
    orderingUser: normalizeOptionalString(order.ordering_user) ?? "",
    orderStatus: normalizeOptionalString(order.order_status) ?? "pending",
    orderType: normalizeOptionalString(order.order_type) ?? "",
    createdAt: toDateTimeInputValue(order.created_at),
    reviewedAt: toDateTimeInputValue(order.reviewed_at),
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

function getNowDateTimeInputValue() {
  return toDateTimeInputValue(new Date().toISOString());
}

function toDateTimeInputValue(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setSeconds(0, 0);
    const localTime = new Date(
      fallback.getTime() - fallback.getTimezoneOffset() * 60_000,
    );
    return localTime.toISOString().slice(0, 16);
  }

  date.setSeconds(0, 0);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function parseBaseOrderForm(
  formState: OrderFormState,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const orderNumber = formState.orderNumber.trim();
  const originalCurrency = formState.originalCurrency.trim().toUpperCase();
  const orderEntryUser = formState.orderEntryUser.trim();
  const orderingUser = formState.orderingUser.trim();
  const orderStatus = formState.orderStatus.trim();
  const orderType = formState.orderType.trim();

  if (!orderNumber) return { ok: false, message: "请输入订单编号。" };
  if (!originalCurrency) return { ok: false, message: "请输入原始货币。" };
  if (!orderEntryUser) return { ok: false, message: "请选择订单录入员。" };
  if (!orderingUser) return { ok: false, message: "请选择订单客户。" };
  if (!orderStatus) return { ok: false, message: "请选择订单状态。" };
  if (!orderType) return { ok: false, message: "请选择订单类型。" };

  const amount = parseRequiredNumber(formState.amount, "金额总计");
  const dailyExchangeRate = parseRequiredNumber(formState.dailyExchangeRate, "当日汇率");
  const transactionRate = parseRequiredNumber(formState.transactionRate, "公司成交汇率");
  const rmbAmount = parseRequiredNumber(formState.rmbAmount, "人民币总计");
  const createdAt = parseRequiredDateTime(formState.createdAt, "创建日期");
  const reviewedAt = parseRequiredDateTime(formState.reviewedAt, "最后一次改动日期");

  if (typeof amount === "string") return { ok: false, message: amount };
  if (typeof dailyExchangeRate === "string") {
    return { ok: false, message: dailyExchangeRate };
  }
  if (typeof transactionRate === "string") {
    return { ok: false, message: transactionRate };
  }
  if (typeof rmbAmount === "string") return { ok: false, message: rmbAmount };
  if (typeof createdAt === "string") return { ok: false, message: createdAt };
  if (typeof reviewedAt === "string") return { ok: false, message: reviewedAt };

  return {
    ok: true,
    payload: {
      orderNumber,
      originalCurrency,
      amount,
      dailyExchangeRate,
      transactionRate,
      rmbAmount,
      orderEntryUser,
      orderingUser,
      orderStatus,
      orderType,
      createdAt: createdAt.toISOString(),
      reviewedAt: reviewedAt.toISOString(),
    },
  };
}

function parseCreateOrderForm(
  formState: OrderFormState,
  orderCategoryByTypeId: Map<string, string | null>,
):
  | { ok: true; payload: CreateAdminOrderInput }
  | { ok: false; message: string } {
  const baseParsed = parseBaseOrderForm(formState);

  if (!baseParsed.ok) {
    return baseParsed;
  }

  const orderCategory = orderCategoryByTypeId.get(formState.orderType.trim()) ?? null;

  if (orderCategory === "purchase") {
    const purchaseSubtype = formState.purchaseSubtype.trim();

    if (!purchaseSubtype) {
      return { ok: false, message: "请选择采购小类。" };
    }

    const purchaseDetails = parseFlexibleOrderDetails(formState.purchaseDetails, "采购订单明细");

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
      return { ok: false, message: "请选择服务小类。" };
    }

    if (!serviceDiscount) {
      return { ok: false, message: "请选择订单折扣。" };
    }

    const serviceDetails = parseFlexibleOrderDetails(formState.serviceDetails, "服务订单明细");

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
      return `${label}格式不正确，请填写 JSON，或按“字段: 内容”逐行输入。`;
    }

    return Object.fromEntries(detailEntries as Array<readonly [string, string]>);
  }
}

function parseRequiredNumber(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return `请填写${label}。`;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return `${label}格式不正确。`;
  }

  return parsed;
}

function parseRequiredDateTime(value: string, label: string): Date | string {
  const normalized = value.trim();

  if (!normalized) {
    return `请选择${label}。`;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return `${label}格式不正确。`;
  }

  return parsed;
}

function formatEditableNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return String(value);
  }

  return normalizeOptionalString(value) ?? "";
}

function normalizeSearchText(value: string | null | undefined) {
  return (normalizeOptionalString(value) ?? "").toLowerCase().replace(/\s+/g, " ");
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

function getOrderTypeMetaFromCategory(category: string | null | undefined) {
  const normalizedCategory = normalizeOptionalString(category);

  if (normalizedCategory === "purchase") {
    return { label: "采购订单", tone: "blue" as const };
  }

  if (normalizedCategory === "service") {
    return { label: "服务订单", tone: "green" as const };
  }

  return {
    label: normalizedCategory ?? "待补充",
    tone: "default" as const,
  };
}

function resolveOrderTypeMeta(
  value: string | null,
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>,
) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return getOrderTypeMetaFromCategory(null);
  }

  return orderTypeMetaById.get(normalizedValue) ?? getOrderTypeMetaFromCategory(normalizedValue);
}

function formatPurchaseOrderSubtype(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "待补充";
  }

  return (
    {
      sourcing: "货源采购",
      dropshipping: "一件代发",
      tourist_shopping: "旅游购物",
      group_buying: "团购",
    } satisfies Record<string, string>
  )[normalizedValue] ?? normalizedValue;
}

function formatServiceOrderSubtype(value: string | null | undefined) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return "待补充";
  }

  return (
    {
      tour_escort: "旅游陪同",
      medical_escort: "医疗陪同",
      digital_survival: "数字化生存",
      airport_transfer: "机场接送",
      car_service: "用车服务",
      vip_recharge: "VIP 充值",
    } satisfies Record<string, string>
  )[normalizedValue] ?? normalizedValue;
}

function formatDiscountRatioValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "待补充";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(parsed);
}

type FlattenedOrderDetailItem = {
  label: string;
  value: string;
};

function flattenOrderDetailItems(value: AdminOrderDetailValue): FlattenedOrderDetailItem[] {
  return flattenOrderDetailValue(value);
}

function flattenOrderDetailValue(
  value: AdminOrderDetailValue,
  parentLabel?: string,
): FlattenedOrderDetailItem[] {
  if (value === null) {
    return parentLabel ? [{ label: parentLabel, value: "-" }] : [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [
      {
        label: parentLabel ?? "表单内容",
        value: formatOrderDetailPrimitive(value),
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
          label: parentLabel ?? "表单内容",
          value: value.map((item) => formatOrderDetailPrimitive(item)).join("、"),
        },
      ];
    }

    return value.flatMap((item, index) =>
      flattenOrderDetailValue(
        item,
        parentLabel ? `${parentLabel} / 第 ${index + 1} 项` : `第 ${index + 1} 项`,
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
    ),
  );
}

function isOrderDetailPrimitive(
  value: AdminOrderDetailValue,
): value is string | number | boolean | null {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function formatOrderDetailPrimitive(value: string | number | boolean | null) {
  if (value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("zh-CN", {
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

function getStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeOptionalString(status);

  if (!normalizedStatus) {
    return "待补充";
  }

  const matchedStatus = ORDER_STATUS_OPTIONS.find((option) => option.value === normalizedStatus);
  return matchedStatus?.label ?? normalizedStatus;
}

function formatCurrencyCode(value: string | null | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : "-";
}

function formatMoneyValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
  }).format(parsed);
}

function formatRateValue(value: number | string | null | undefined) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN", {
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

function toOrderErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("duplicate key value")) {
    return "订单编号已存在，请更换后重试。";
  }

  if (baseMessage.includes("violates foreign key constraint")) {
    return "请选择有效的订单录入员、订单客户、订单类型，以及对应的采购/服务子表选项。";
  }

  return baseMessage;
}
