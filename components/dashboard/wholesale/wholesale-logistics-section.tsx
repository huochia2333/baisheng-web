"use client";

import { Route } from "lucide-react";

import type {
  WholesaleCustomer,
  WholesaleLogisticsOrder,
  WholesaleOrder,
} from "@/lib/wholesale";

import {
  formatCurrency,
  formatDateTime,
  getCustomerName,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesaleField,
  WholesalePageShell,
  WholesalePanel,
  WholesaleSelect,
  WholesaleSubmitButton,
  WholesaleTable,
  WholesaleTd,
  WholesaleTh,
  wholesaleStickyFirstTdClassName,
  wholesaleStickyFirstThClassName,
} from "./wholesale-ui";

type WholesaleLogisticsSectionProps = {
  canEdit: boolean;
  customers: WholesaleCustomer[];
  customersById: Map<string, WholesaleCustomer>;
  logisticsOrders: WholesaleLogisticsOrder[];
  onCreateLogisticsOrder: (formData: FormData) => void;
  orders: WholesaleOrder[];
  pendingKey: string | null;
};

export function WholesaleLogisticsSection({
  canEdit,
  customers,
  customersById,
  logisticsOrders,
  onCreateLogisticsOrder,
  orders,
  pendingKey,
}: WholesaleLogisticsSectionProps) {
  const ordersById = new Map(orders.map((order) => [order.id, order]));

  return (
    <WholesalePageShell
      description="记录从其他工作流传来的订单编号，并把国际订单号和目的地订单号关联起来，方便按客户查看物流进度和费用。"
      eyebrow="批发业务"
      title="物流管理"
    >
      {canEdit ? (
        <WholesalePanel
          description="每次录入都可以选择归属客户；后续接入货代查询后，会在这里更新每日进度和费用。"
          title="新增物流记录"
        >
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateLogisticsOrder(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <WholesaleSelect label="归属客户" name="customer_id">
              <option value="">暂不归属</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.unique_name}
                </option>
              ))}
            </WholesaleSelect>
            <WholesaleSelect label="关联批发订单" name="wholesale_order_id">
              <option value="">暂不关联</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number}
                </option>
              ))}
            </WholesaleSelect>
            <WholesaleField
              label="来源工作流订单编号"
              name="source_workflow_order_number"
            />
            <WholesaleField
              label="国际订单号"
              name="international_tracking_number"
              required
            />
            <WholesaleField
              label="目的地订单号"
              name="destination_tracking_number"
            />
            <WholesaleField label="货代" name="freight_forwarder" />
            <WholesaleField label="最新进度" name="latest_status" />
            <WholesaleField
              label="进度时间"
              name="latest_checkpoint_at"
              type="datetime-local"
            />
            <WholesaleField
              label="物流费用"
              min={0}
              name="logistics_fee"
              step="0.01"
              type="number"
            />
            <WholesaleField defaultValue="CNY" label="费用币种" name="currency" />
            <WholesaleField label="批次来源" name="batch_source" />
            <div className="flex justify-end md:col-span-2 xl:col-span-4">
              <WholesaleSubmitButton pending={pendingKey === "logistics:create"}>
                保存物流
              </WholesaleSubmitButton>
            </div>
          </form>
        </WholesalePanel>
      ) : null}

      <WholesalePanel title="物流列表">
        {logisticsOrders.length === 0 ? (
          <WholesaleEmptyState
            description="还没有物流记录。录入后，客户可以在自己的批发页面看到对应订单进度。"
            icon={<Route className="size-5" />}
            title="暂无物流记录"
          />
        ) : (
          <WholesaleTable minWidth={1180}>
            <thead>
              <tr>
                <WholesaleTh className={wholesaleStickyFirstThClassName}>运单号</WholesaleTh>
                <WholesaleTh>客户</WholesaleTh>
                <WholesaleTh>来源订单</WholesaleTh>
                <WholesaleTh>批发订单</WholesaleTh>
                <WholesaleTh>货代</WholesaleTh>
                <WholesaleTh>最新进度</WholesaleTh>
                <WholesaleTh>物流费用</WholesaleTh>
                <WholesaleTh>更新时间</WholesaleTh>
              </tr>
            </thead>
            <tbody>
              {logisticsOrders.map((row) => (
                <tr className="group" key={row.id}>
                  <WholesaleTd className={wholesaleStickyFirstTdClassName}>
                    <div className="font-semibold [overflow-wrap:anywhere]">
                      {row.international_tracking_number}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-[#71808d]">
                      目的地 {row.destination_tracking_number ?? "未记录"}
                    </div>
                  </WholesaleTd>
                  <WholesaleTd>{getCustomerName(customersById, row.customer_id)}</WholesaleTd>
                  <WholesaleTd>{row.source_workflow_order_number ?? "未记录"}</WholesaleTd>
                  <WholesaleTd>
                    {row.wholesale_order_id
                      ? ordersById.get(row.wholesale_order_id)?.order_number ?? "未关联"
                      : "未关联"}
                  </WholesaleTd>
                  <WholesaleTd>{row.freight_forwarder ?? "未记录"}</WholesaleTd>
                  <WholesaleTd>{row.latest_status ?? "未记录"}</WholesaleTd>
                  <WholesaleTd>{formatCurrency(row.logistics_fee, row.currency)}</WholesaleTd>
                  <WholesaleTd>
                    {formatDateTime(row.latest_checkpoint_at ?? row.updated_at)}
                  </WholesaleTd>
                </tr>
              ))}
            </tbody>
          </WholesaleTable>
        )}
      </WholesalePanel>
    </WholesalePageShell>
  );
}
