"use client";

import {
  PackageCheck,
} from "lucide-react";

import type {
  WholesaleCustomer,
  WholesaleLogisticsOrder,
  WholesaleOrder,
} from "@/lib/wholesale";
import type { WholesaleLogisticsStatus } from "@/lib/wholesale-logistics-statuses";

import {
  formatCurrency,
  formatDateTime,
  getCustomerName,
  WHOLESALE_LOGISTICS_STATUS_LABELS,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesaleField,
  WholesalePageShell,
  WholesalePanel,
  WholesaleSelect,
  WholesaleStatusBadge,
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
  logisticsStatuses: WholesaleLogisticsStatus[];
  onCreateLogisticsStatus: (formData: FormData) => void;
  orders: WholesaleOrder[];
  pendingKey: string | null;
};

export function WholesaleLogisticsSection({
  canEdit,
  customers,
  customersById,
  logisticsOrders,
  logisticsStatuses,
  onCreateLogisticsStatus,
  orders,
  pendingKey,
}: WholesaleLogisticsSectionProps) {
  const ordersById = new Map(orders.map((order) => [order.id, order]));

  return (
    <WholesalePageShell
      description="添加需要跟进的物流号后，系统会每天核对一次状态；已送达或出现无法继续配送的情况后会自动停止核对。"
      eyebrow="批发业务"
      title="物流管理"
    >
      {canEdit ? (
        <WholesalePanel
          description="先录入物流号和客户名；如果已经确定对应客户或批发订单，也可以一起关联，方便客户查看自己的物流进展。"
          title="新增物流核对"
        >
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateLogisticsStatus(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <WholesaleField
              label="物流号"
              name="tracking_number"
              placeholder="填写需要核对的物流号"
              required
            />
            <WholesaleField
              label="客户名"
              name="customer_name"
              placeholder="填写客户常用名称"
              required
            />
            <WholesaleSelect label="归属客户" name="customer_id">
              <option value="">暂不匹配</option>
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
            <div className="flex justify-end md:col-span-2 xl:col-span-4">
              <WholesaleSubmitButton
                pending={pendingKey === "logistics-status:create"}
              >
                加入核对
              </WholesaleSubmitButton>
            </div>
          </form>
        </WholesalePanel>
      ) : null}

      <WholesalePanel
        description="状态会按物流号每天更新一次，送达或异常终止后不再重复核对。"
        title="每日核对列表"
      >
        {logisticsStatuses.length === 0 ? (
          <WholesaleEmptyState
            description="还没有物流号。添加后，这里会显示客户、当前状态和最近核对时间。"
            icon={<PackageCheck className="size-5" />}
            title="暂无物流核对记录"
          />
        ) : (
          <WholesaleTable minWidth={1180}>
            <thead>
              <tr>
                <WholesaleTh className={wholesaleStickyFirstThClassName}>
                  物流号
                </WholesaleTh>
                <WholesaleTh>客户</WholesaleTh>
                <WholesaleTh>批发订单</WholesaleTh>
                <WholesaleTh>当前状态</WholesaleTh>
                <WholesaleTh>核对结果</WholesaleTh>
                <WholesaleTh>上次核对</WholesaleTh>
                <WholesaleTh>下次核对</WholesaleTh>
              </tr>
            </thead>
            <tbody>
              {logisticsStatuses.map((row) => (
                <tr className="group" key={row.id}>
                  <WholesaleTd className={wholesaleStickyFirstTdClassName}>
                    <div className="font-semibold [overflow-wrap:anywhere]">
                      {row.tracking_number}
                    </div>
                    {row.last_error ? (
                      <div className="mt-2 text-xs leading-5 text-[#a46a1f]">
                        暂时没有查到新进展
                      </div>
                    ) : null}
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[160px] whitespace-normal">
                    {row.customer_id
                      ? getCustomerName(customersById, row.customer_id)
                      : row.customer_name}
                  </WholesaleTd>
                  <WholesaleTd>
                    {row.wholesale_order_id
                      ? ordersById.get(row.wholesale_order_id)?.order_number ??
                        "未关联"
                      : "未关联"}
                  </WholesaleTd>
                  <WholesaleTd className="min-w-[240px] whitespace-normal">
                    {row.status_text}
                  </WholesaleTd>
                  <WholesaleTd>
                    <WholesaleStatusBadge tone={getLogisticsStatusTone(row)}>
                      {WHOLESALE_LOGISTICS_STATUS_LABELS[row.status_kind]}
                    </WholesaleStatusBadge>
                  </WholesaleTd>
                  <WholesaleTd>{formatDateTime(row.last_checked_at)}</WholesaleTd>
                  <WholesaleTd>
                    {row.is_terminal ? "已停止核对" : formatDateTime(row.next_check_at)}
                  </WholesaleTd>
                </tr>
              ))}
            </tbody>
          </WholesaleTable>
        )}
      </WholesalePanel>

      {logisticsOrders.length > 0 ? (
        <WholesalePanel
          description="这里保留已经录入的货代、费用和来源订单信息，方便核对历史费用。"
          title="物流费用记录"
        >
          <WholesaleTable minWidth={1180}>
            <thead>
              <tr>
                <WholesaleTh className={wholesaleStickyFirstThClassName}>
                  运单号
                </WholesaleTh>
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
        </WholesalePanel>
      ) : null}
    </WholesalePageShell>
  );
}

function getLogisticsStatusTone(row: WholesaleLogisticsStatus) {
  if (row.status_kind === "delivered") {
    return "success";
  }

  if (row.status_kind === "exception" || row.status_kind === "stopped") {
    return "danger";
  }

  return "warning";
}
