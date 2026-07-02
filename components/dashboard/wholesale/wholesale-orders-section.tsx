"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Plus,
  ReceiptText,
  RefreshCcw,
} from "lucide-react";

import {
  DashboardFilterField,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { ExchangeRateRow } from "@/lib/exchange-rates";
import { normalizeSearchText } from "@/lib/value-normalizers";
import type {
  Wholesale1688Order,
  WholesaleCustomer,
  WholesaleLogisticsOrder,
  WholesaleOrderChangeLog,
  WholesaleOrderEditRequest,
  WholesaleOrder,
  WholesaleProfile,
} from "@/lib/wholesale";
import type { WholesaleLogisticsStatus } from "@/lib/wholesale-logistics-statuses";

import {
  formatCurrency,
  formatPercent,
  getCustomerName,
  getProfileName,
} from "./wholesale-display";
import { WholesaleOrderChangeSections } from "./wholesale-order-change-sections";
import { WholesaleOrderEditDialog } from "./wholesale-order-edit-dialog";
import {
  canCurrentUserManageWholesaleOrder,
  getWholesaleOrderEditMode,
} from "./wholesale-order-edit-rules";
import { WholesaleOrderAssessmentPanel } from "./wholesale-order-assessment-panel";
import { WholesaleOrderFormDialog } from "./wholesale-order-form-dialog";
import {
  WholesaleOrderRateDialog,
  WholesaleOrderSettlementDialog,
} from "./wholesale-order-rate-dialogs";
import { WholesaleOrderRateSelectionBar } from "./wholesale-order-rate-selection";
import {
  WholesaleOrdersTable,
  type WholesaleOrderEditAction,
} from "./wholesale-orders-table";
import type { WholesaleOrderAssessmentFilters } from "./use-wholesale-order-assessment";
import {
  WholesaleEmptyState,
  WholesalePageShell,
  WholesaleStatGrid,
} from "./wholesale-ui";
import { useWholesaleOrderRateSelection } from "./use-wholesale-order-rate-selection";

type WholesaleOrdersSectionProps = {
  canEdit: boolean;
  canManageAllOrders: boolean;
  currentUserId: string | null;
  customers: WholesaleCustomer[];
  customersById: Map<string, WholesaleCustomer>;
  exchangeRates: ExchangeRateRow[];
  logisticsOrders: WholesaleLogisticsOrder[];
  logisticsStatuses: WholesaleLogisticsStatus[];
  onCreateOrder: (formData: FormData) => void | Promise<void>;
  onApproveOrderEditRequest: (requestId: string) => void | Promise<void>;
  onMarkOrderSettled: (formData: FormData) => void | Promise<void>;
  onRejectOrderEditRequest: (requestId: string) => void | Promise<void>;
  onRequestOrderEdit: (formData: FormData) => void | Promise<void>;
  onUpdateOrder: (formData: FormData) => void | Promise<void>;
  onUpdateOrderSettlementRate: (formData: FormData) => void | Promise<void>;
  orderChangeLogs: WholesaleOrderChangeLog[];
  orderEditRequests: WholesaleOrderEditRequest[];
  orderEditWindowDays: number;
  orders: WholesaleOrder[];
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  purchaseOrders: Wholesale1688Order[];
  salesAccounts: WholesaleProfile[];
};

const ALL = "all";

export function WholesaleOrdersSection({
  canEdit,
  canManageAllOrders,
  currentUserId,
  customers,
  customersById,
  exchangeRates,
  logisticsOrders,
  logisticsStatuses,
  onApproveOrderEditRequest,
  onCreateOrder,
  onMarkOrderSettled,
  onRejectOrderEditRequest,
  onRequestOrderEdit,
  onUpdateOrder,
  onUpdateOrderSettlementRate,
  orderChangeLogs,
  orderEditRequests,
  orderEditWindowDays,
  orders,
  pendingKey,
  profilesById,
  purchaseOrders,
  salesAccounts,
}: WholesaleOrdersSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEditOrder, setSelectedEditOrder] = useState<WholesaleOrder | null>(
    null,
  );
  const [selectedSettlementOrder, setSelectedSettlementOrder] =
    useState<WholesaleOrder | null>(null);
  const [rateEditOrders, setRateEditOrders] = useState<WholesaleOrder[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [customerFilter, setCustomerFilter] = useState(ALL);
  const [salesFilter, setSalesFilter] = useState(ALL);
  const [orderedFromDate, setOrderedFromDate] = useState("");
  const [orderedToDate, setOrderedToDate] = useState("");
  const purchaseOrdersByOrderId = useMemo(() => {
    const grouped = new Map<string, Wholesale1688Order[]>();

    for (const purchaseOrder of purchaseOrders) {
      if (!purchaseOrder.wholesale_order_id) continue;
      const rows = grouped.get(purchaseOrder.wholesale_order_id) ?? [];
      rows.push(purchaseOrder);
      grouped.set(purchaseOrder.wholesale_order_id, rows);
    }

    return grouped;
  }, [purchaseOrders]);
  const logisticsOrdersByOrderId = useMemo(() => {
    const grouped = new Map<string, WholesaleLogisticsOrder[]>();

    for (const logisticsOrder of logisticsOrders) {
      if (!logisticsOrder.wholesale_order_id) continue;
      const rows = grouped.get(logisticsOrder.wholesale_order_id) ?? [];
      rows.push(logisticsOrder);
      grouped.set(logisticsOrder.wholesale_order_id, rows);
    }

    return grouped;
  }, [logisticsOrders]);
  const logisticsStatusesByOrderId = useMemo(() => {
    const grouped = new Map<string, WholesaleLogisticsStatus[]>();

    for (const logisticsStatus of logisticsStatuses) {
      if (!logisticsStatus.wholesale_order_id) continue;
      const rows = grouped.get(logisticsStatus.wholesale_order_id) ?? [];
      rows.push(logisticsStatus);
      grouped.set(logisticsStatus.wholesale_order_id, rows);
    }

    return grouped;
  }, [logisticsStatuses]);
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );
  const totalPayment = orders.reduce(
    (sum, order) => sum + Number(order.customer_payment_rmb_amount ?? 0),
    0,
  );
  const totalProfit = orders.reduce(
    (sum, order) => sum + Number(order.gross_profit ?? 0),
    0,
  );
  const averageMargin = totalPayment > 0 ? totalProfit / totalPayment : null;
  const filteredOrders = useMemo(() => {
    const searchValue = normalizeSearchText(searchText);
    const orderedFromTime = getDateBoundaryTime(orderedFromDate, "start");
    const orderedToTime = getDateBoundaryTime(orderedToDate, "end");

    return orders.filter((order) => {
      if (statusFilter !== ALL && order.status !== statusFilter) return false;
      if (customerFilter !== ALL && order.customer_id !== customerFilter) return false;
      if (salesFilter !== ALL && (order.sales_user_id ?? "") !== salesFilter) {
        return false;
      }
      if (
        !isDateWithinRange(order.ordered_at, orderedFromTime, orderedToTime)
      ) {
        return false;
      }

      if (!searchValue) return true;

      const customerName = getCustomerName(customersById, order.customer_id);
      const salesName = getProfileName(profilesById, order.sales_user_id);
      const linkedPurchaseOrders = purchaseOrdersByOrderId.get(order.id) ?? [];
      const linkedLogisticsOrders = logisticsOrdersByOrderId.get(order.id) ?? [];
      const linkedLogisticsStatuses =
        logisticsStatusesByOrderId.get(order.id) ?? [];

      return [
        order.order_number,
        customerName,
        salesName,
        order.courier_company ?? "",
        order.payment_platform ?? "",
        order.notes ?? "",
        ...linkedPurchaseOrders.flatMap((purchaseOrder) => [
          purchaseOrder.external_order_number,
          purchaseOrder.item_summary ?? "",
          purchaseOrder.seller_name ?? "",
        ]),
        ...linkedLogisticsOrders.flatMap((logisticsOrder) => [
          logisticsOrder.international_tracking_number,
          logisticsOrder.destination_tracking_number ?? "",
          logisticsOrder.freight_forwarder ?? "",
          logisticsOrder.latest_status ?? "",
        ]),
        ...linkedLogisticsStatuses.flatMap((logisticsStatus) => [
          logisticsStatus.tracking_number,
          logisticsStatus.customer_name,
          logisticsStatus.status_text,
        ]),
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [
    customerFilter,
    customersById,
    orderedFromDate,
    orderedToDate,
    orders,
    profilesById,
    purchaseOrdersByOrderId,
    logisticsOrdersByOrderId,
    logisticsStatusesByOrderId,
    salesFilter,
    searchText,
    statusFilter,
  ]);
  const hasActiveFilters =
    searchText ||
    statusFilter !== ALL ||
    customerFilter !== ALL ||
    salesFilter !== ALL ||
    orderedFromDate ||
    orderedToDate;
  const assessmentFilters = useMemo<WholesaleOrderAssessmentFilters>(
    () => ({
      customerId: customerFilter,
      orderedFromDate,
      orderedToDate,
      salesUserId: salesFilter,
      searchText,
      status: statusFilter,
    }),
    [
      customerFilter,
      orderedFromDate,
      orderedToDate,
      salesFilter,
      searchText,
      statusFilter,
    ],
  );
  const canMarkOrderSettled = useCallback(
    (order: WholesaleOrder) =>
      order.status === "unsettled" &&
      canCurrentUserManageWholesaleOrder({
        canEdit,
        canManageAllOrders,
        currentUserId,
        customer: customersById.get(order.customer_id),
        order,
      }),
    [canEdit, canManageAllOrders, currentUserId, customersById],
  );
  const canUpdateSettlementRate = useCallback(
    (order: WholesaleOrder) =>
      order.status === "settled" &&
      canCurrentUserManageWholesaleOrder({
        canEdit,
        canManageAllOrders,
        currentUserId,
        customer: customersById.get(order.customer_id),
        order,
      }),
    [canEdit, canManageAllOrders, currentUserId, customersById],
  );
  const {
    clearSelectedOrders,
    selectedOrderIds,
    selectedRateOrders,
    toggleOrderSelection,
  } = useWholesaleOrderRateSelection({ canUpdateSettlementRate, orders });
  const getOrderEditAction = (
    order: WholesaleOrder,
  ): WholesaleOrderEditAction | null => {
    if (
      !canCurrentUserManageWholesaleOrder({
        canEdit,
        canManageAllOrders,
        currentUserId,
        customer: customersById.get(order.customer_id),
        order,
      })
    ) {
      return null;
    }

    const mode = getWholesaleOrderEditMode({
      canManageAllOrders,
      editWindowDays: orderEditWindowDays,
      order,
    });

    return mode === "direct"
      ? { label: "修改订单", tone: "direct" }
      : { label: "申请修改", tone: "request" };
  };
  const selectedEditMode = selectedEditOrder
    ? getWholesaleOrderEditMode({
        canManageAllOrders,
        editWindowDays: orderEditWindowDays,
        order: selectedEditOrder,
      })
    : "direct";

  return (
    <WholesalePageShell
      actions={
        canEdit ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            onClick={() => setCreateDialogOpen(true)}
            type="button"
          >
            <Plus className="size-4" />
            新建订单
          </Button>
        ) : null
      }
      description="集中管理批发客户订单、采购成本、运费、推荐佣金、毛利和订单月份。订单列表可横向滑动查看完整信息，订单编号会固定在左侧。"
      eyebrow="批发业务"
      title="批发订单"
    >
      <WholesaleStatGrid
        stats={[
          { label: "订单数量", value: `${orders.length}` },
          { label: "客户支付人民币", value: formatCurrency(totalPayment) },
          { label: "毛利合计", value: formatCurrency(totalProfit) },
          { label: "平均毛利率", value: formatPercent(averageMargin) },
        ]}
      />

      <DashboardListSection
        actions={
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            disabled={!hasActiveFilters}
            onClick={() => {
              setSearchText("");
              setStatusFilter(ALL);
              setCustomerFilter(ALL);
              setSalesFilter(ALL);
              setOrderedFromDate("");
              setOrderedToDate("");
            }}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            清空筛选
          </Button>
        }
        description={`共 ${orders.length} 笔订单，当前显示 ${filteredOrders.length} 笔。`}
        title="订单列表"
      >
        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardFilterField label="搜索订单">
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="订单编号、客户、业务员、快递或备注"
              type="search"
              value={searchText}
            />
          </DashboardFilterField>
          <DashboardFilterField label="订单状态">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value={ALL}>全部状态</option>
              <option value="unsettled">未结汇</option>
              <option value="settled">已结汇</option>
            </select>
          </DashboardFilterField>
          <DashboardFilterField label="客户">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
            >
              <option value={ALL}>全部客户</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.unique_name}
                </option>
              ))}
            </select>
          </DashboardFilterField>
          <DashboardFilterField label="业务员">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setSalesFilter(event.target.value)}
              value={salesFilter}
            >
              <option value={ALL}>全部业务员</option>
              {salesAccounts.map((profile) => (
                <option key={profile.user_id} value={profile.user_id}>
                  {profile.name || profile.email}
                </option>
              ))}
            </select>
          </DashboardFilterField>
          <DashboardFilterField label="下单日期从">
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => {
                const nextDate = event.target.value;
                setOrderedFromDate(nextDate);

                if (orderedToDate && nextDate && orderedToDate < nextDate) {
                  setOrderedToDate(nextDate);
                }
              }}
              type="date"
              value={orderedFromDate}
            />
          </DashboardFilterField>
          <DashboardFilterField label="下单日期到">
            <input
              className={dashboardFilterInputClassName}
              min={orderedFromDate || undefined}
              onChange={(event) => setOrderedToDate(event.target.value)}
              type="date"
              value={orderedToDate}
            />
          </DashboardFilterField>
        </div>

        <div className="mb-5">
          <WholesaleOrderAssessmentPanel
            filters={assessmentFilters}
            matchedOrderCount={filteredOrders.length}
          />
        </div>

        <WholesaleOrderRateSelectionBar
          onClearSelection={clearSelectedOrders}
          onOpenBulkEdit={() => {
            if (selectedRateOrders.length > 1) {
              setRateEditOrders(selectedRateOrders);
            }
          }}
          pending={pendingKey === "order:rate:bulk"}
          selectedCount={selectedRateOrders.length}
        />

        {filteredOrders.length === 0 ? (
          <WholesaleEmptyState
            description="没有匹配的批发订单。可以调整筛选条件，或新建一笔订单。"
            icon={<ReceiptText className="size-5" />}
            title="暂无匹配订单"
          />
        ) : (
          <WholesaleOrdersTable
            canMarkOrderSettled={canMarkOrderSettled}
            canUpdateSettlementRate={canUpdateSettlementRate}
            customersById={customersById}
            getOrderEditAction={getOrderEditAction}
            logisticsOrdersByOrderId={logisticsOrdersByOrderId}
            logisticsStatusesByOrderId={logisticsStatusesByOrderId}
            onOpenOrderEdit={setSelectedEditOrder}
            onOpenOrderSettlement={setSelectedSettlementOrder}
            onToggleOrderSelection={toggleOrderSelection}
            orders={filteredOrders}
            pendingKey={pendingKey}
            profilesById={profilesById}
            purchaseOrdersByOrderId={purchaseOrdersByOrderId}
            selectedOrderIds={selectedOrderIds}
          />
        )}
      </DashboardListSection>

      <WholesaleOrderChangeSections
        canReviewRequests={canManageAllOrders}
        customersById={customersById}
        logs={orderChangeLogs}
        onApproveRequest={onApproveOrderEditRequest}
        onRejectRequest={onRejectOrderEditRequest}
        ordersById={ordersById}
        pendingKey={pendingKey}
        profilesById={profilesById}
        requests={orderEditRequests}
      />

      <WholesaleOrderFormDialog
        customers={customers}
        exchangeRates={exchangeRates}
        onCreateOrder={onCreateOrder}
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
        pending={pendingKey === "order:create"}
        salesAccounts={salesAccounts}
      />

      {selectedEditOrder ? (
        <WholesaleOrderEditDialog
          canManageAllOrders={canManageAllOrders}
          canUpdateSettlementRate={canUpdateSettlementRate(selectedEditOrder)}
          customers={customers}
          editWindowDays={orderEditWindowDays}
          exchangeRates={exchangeRates}
          key={`${selectedEditOrder.id}-${selectedEditMode}`}
          mode={selectedEditMode}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEditOrder(null);
            }
          }}
          onRequestOrderEdit={onRequestOrderEdit}
          onUpdateOrder={onUpdateOrder}
          onUpdateOrderSettlementRate={onUpdateOrderSettlementRate}
          open
          order={selectedEditOrder}
          pending={
            pendingKey === `order:update:${selectedEditOrder.id}` ||
            pendingKey === `order:edit-request:${selectedEditOrder.id}` ||
            pendingKey === `order:rate:${selectedEditOrder.id}`
          }
          salesAccounts={salesAccounts}
        />
      ) : null}

      {selectedSettlementOrder ? (
        <WholesaleOrderSettlementDialog
          exchangeRates={exchangeRates}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSettlementOrder(null);
            }
          }}
          onSettleOrder={onMarkOrderSettled}
          order={selectedSettlementOrder}
          pending={pendingKey === `order:settle:${selectedSettlementOrder.id}`}
        />
      ) : null}

      <WholesaleOrderRateDialog
        onOpenChange={(open) => {
          if (!open) {
            if (rateEditOrders.length > 1) {
              clearSelectedOrders();
            }

            setRateEditOrders([]);
          }
        }}
        onUpdateRate={onUpdateOrderSettlementRate}
        open={rateEditOrders.length > 0}
        orders={rateEditOrders}
        pending={
          rateEditOrders.length > 1
            ? pendingKey === "order:rate:bulk"
            : pendingKey === `order:rate:${rateEditOrders[0]?.id ?? ""}`
        }
      />
    </WholesalePageShell>
  );
}

function getDateBoundaryTime(value: string, boundary: "start" | "end") {
  if (!value) {
    return null;
  }

  const suffix = boundary === "start" ? "T00:00:00" : "T23:59:59.999";
  const time = new Date(`${value}${suffix}`).getTime();

  return Number.isFinite(time) ? time : null;
}

function isDateWithinRange(
  value: string | null | undefined,
  fromTime: number | null,
  toTime: number | null,
) {
  if (fromTime === null && toTime === null) {
    return true;
  }

  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return false;
  }

  return (
    (fromTime === null || time >= fromTime) &&
    (toTime === null || time <= toTime)
  );
}
