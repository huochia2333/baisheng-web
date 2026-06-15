"use client";

import { useMemo, useState } from "react";

import {
  CheckCircle2,
  LoaderCircle,
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
  WholesaleOrder,
  WholesaleProfile,
} from "@/lib/wholesale";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  getCustomerName,
  getProfileName,
  WHOLESALE_ORDER_STATUS_LABELS,
} from "./wholesale-display";
import {
  LinkedLogisticsOrders,
  LinkedPurchaseOrders,
} from "./wholesale-order-linked-records";
import {
  WholesaleOrderAssessmentPanel,
} from "./wholesale-order-assessment-panel";
import { WholesaleOrderFormDialog } from "./wholesale-order-form-dialog";
import type { WholesaleOrderAssessmentFilters } from "./use-wholesale-order-assessment";
import {
  WholesaleEmptyState,
  WholesalePageShell,
  WholesaleStatGrid,
  WholesaleStatusBadge,
  WholesaleTable,
  WholesaleTd,
  WholesaleTh,
  wholesaleStickyFirstTdClassName,
  wholesaleStickyFirstThClassName,
} from "./wholesale-ui";

type WholesaleOrdersSectionProps = {
  canEdit: boolean;
  canManageAllOrders: boolean;
  currentUserId: string | null;
  customers: WholesaleCustomer[];
  customersById: Map<string, WholesaleCustomer>;
  exchangeRates: ExchangeRateRow[];
  logisticsOrders: WholesaleLogisticsOrder[];
  onCreateOrder: (formData: FormData) => void | Promise<void>;
  onMarkOrderSettled: (orderId: string) => void | Promise<void>;
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
  onCreateOrder,
  onMarkOrderSettled,
  orders,
  pendingKey,
  profilesById,
  purchaseOrders,
  salesAccounts,
}: WholesaleOrdersSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
  const canMarkOrderSettled = (order: WholesaleOrder) =>
    order.status === "unsettled" &&
    canEdit &&
    (canManageAllOrders ||
      order.sales_user_id === currentUserId ||
      order.created_by_user_id === currentUserId);

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

        {filteredOrders.length === 0 ? (
          <WholesaleEmptyState
            description="没有匹配的批发订单。可以调整筛选条件，或新建一笔订单。"
            icon={<ReceiptText className="size-5" />}
            title="暂无匹配订单"
          />
        ) : (
          <WholesaleTable minWidth={3260}>
            <thead>
              <tr>
                <WholesaleTh className={wholesaleStickyFirstThClassName}>
                  订单编号
                </WholesaleTh>
                <WholesaleTh>客户</WholesaleTh>
                <WholesaleTh>业务员</WholesaleTh>
                <WholesaleTh>小单数量</WholesaleTh>
                <WholesaleTh>产品采购金额</WholesaleTh>
                <WholesaleTh>打包费</WholesaleTh>
                <WholesaleTh>国际运费</WholesaleTh>
                <WholesaleTh>其他费用</WholesaleTh>
                <WholesaleTh>推荐佣金费用</WholesaleTh>
                <WholesaleTh>快递公司</WholesaleTh>
                <WholesaleTh>结汇汇率</WholesaleTh>
                <WholesaleTh>支付币种</WholesaleTh>
                <WholesaleTh>客户支付金额</WholesaleTh>
                <WholesaleTh>人民币金额</WholesaleTh>
                <WholesaleTh>收款平台</WholesaleTh>
                <WholesaleTh>毛利</WholesaleTh>
                <WholesaleTh>毛利率</WholesaleTh>
                <WholesaleTh>单位毛利</WholesaleTh>
                <WholesaleTh>订单计入月份</WholesaleTh>
                <WholesaleTh>下单时间</WholesaleTh>
                <WholesaleTh>结汇时间</WholesaleTh>
                <WholesaleTh className="min-w-[320px] whitespace-normal">
                  关联 1688 采购订单
                </WholesaleTh>
                <WholesaleTh className="min-w-[320px] whitespace-normal">
                  关联物流订单
                </WholesaleTh>
                <WholesaleTh className="min-w-[240px] whitespace-normal">备注</WholesaleTh>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr className="group" key={order.id}>
                  <WholesaleTd className={wholesaleStickyFirstTdClassName}>
                    <div className="font-semibold [overflow-wrap:anywhere]">
                      {order.order_number}
                    </div>
                    <div className="mt-2">
                      <WholesaleStatusBadge
                        tone={order.status === "settled" ? "success" : "warning"}
                      >
                        {WHOLESALE_ORDER_STATUS_LABELS[order.status]}
                      </WholesaleStatusBadge>
                    </div>
                    {canMarkOrderSettled(order) ? (
                      <Button
                        className="mt-3 h-9 rounded-full bg-[#486782] px-3 text-xs text-white hover:bg-[#3e5f79]"
                        disabled={pendingKey === `order:settle:${order.id}`}
                        onClick={() => void onMarkOrderSettled(order.id)}
                        type="button"
                      >
                        {pendingKey === `order:settle:${order.id}` ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        标记已结汇
                      </Button>
                    ) : null}
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[160px] whitespace-normal">
                    {getCustomerName(customersById, order.customer_id)}
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[150px] whitespace-normal">
                    {getProfileName(profilesById, order.sales_user_id)}
                  </WholesaleTd>
                  <WholesaleTd>{formatNumber(order.small_order_count)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.product_purchase_amount)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.packing_fee)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.international_shipping_fee)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.other_fee)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.referral_commission_fee)}</WholesaleTd>
                  <WholesaleTd className="min-w-[140px] whitespace-normal">
                    {order.courier_company ?? "未记录"}
                  </WholesaleTd>
                  <WholesaleTd>{formatNumber(order.settlement_exchange_rate)}</WholesaleTd>
                  <WholesaleTd>{order.customer_payment_currency}</WholesaleTd>
                  <WholesaleTd>
                    {formatCurrency(
                      order.customer_payment_amount,
                      order.customer_payment_currency,
                    )}
                  </WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.customer_payment_rmb_amount)}</WholesaleTd>
                  <WholesaleTd className="min-w-[140px] whitespace-normal">
                    {order.payment_platform ?? "未记录"}
                  </WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.gross_profit)}</WholesaleTd>
                  <WholesaleTd>{formatPercent(order.gross_margin)}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(order.unit_gross_profit)}</WholesaleTd>
                  <WholesaleTd>{formatDate(order.order_month)}</WholesaleTd>
                  <WholesaleTd>{formatDateTime(order.ordered_at)}</WholesaleTd>
                  <WholesaleTd>
                    {order.settled_at ? formatDateTime(order.settled_at) : "未结汇"}
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[320px] whitespace-normal">
                    <LinkedPurchaseOrders
                      profilesById={profilesById}
                      purchaseOrders={purchaseOrdersByOrderId.get(order.id) ?? []}
                    />
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[320px] whitespace-normal">
                    <LinkedLogisticsOrders
                      logisticsOrders={logisticsOrdersByOrderId.get(order.id) ?? []}
                    />
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[240px] whitespace-normal">
                    {order.notes ?? "未记录"}
                  </WholesaleTd>
                </tr>
              ))}
            </tbody>
          </WholesaleTable>
        )}
      </DashboardListSection>

      <WholesaleOrderFormDialog
        customers={customers}
        exchangeRates={exchangeRates}
        onCreateOrder={onCreateOrder}
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
        pending={pendingKey === "order:create"}
        salesAccounts={salesAccounts}
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
