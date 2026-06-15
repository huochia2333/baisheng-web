"use client";

import type {
  Wholesale1688Order,
  WholesaleLogisticsOrder,
  WholesaleProfile,
} from "@/lib/wholesale";

import { formatCurrency, formatDateTime, formatNumber, getProfileName } from "./wholesale-display";

export function LinkedPurchaseOrders({
  profilesById,
  purchaseOrders,
}: {
  profilesById: Map<string, WholesaleProfile>;
  purchaseOrders: Wholesale1688Order[];
}) {
  if (purchaseOrders.length === 0) {
    return <span className="text-[#71808d]">未关联</span>;
  }

  return (
    <div className="space-y-3">
      {purchaseOrders.map((purchaseOrder) => (
        <div
          className="rounded-[16px] border border-[#ebe7e1] bg-[#fbfaf8] px-3 py-2"
          key={purchaseOrder.id}
        >
          <div className="font-semibold [overflow-wrap:anywhere]">
            {purchaseOrder.external_order_number}
          </div>
          <div className="mt-1 text-xs leading-5 text-[#71808d]">
            {purchaseOrder.item_summary ?? "未记录商品"}
          </div>
          <div className="mt-1 text-xs leading-5 text-[#71808d]">
            数量 {formatNumber(purchaseOrder.quantity)} / 金额{" "}
            {formatCurrency(purchaseOrder.purchase_amount)} / 业务员{" "}
            {getProfileName(profilesById, purchaseOrder.claimed_by_user_id)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LinkedLogisticsOrders({
  logisticsOrders,
}: {
  logisticsOrders: WholesaleLogisticsOrder[];
}) {
  if (logisticsOrders.length === 0) {
    return <span className="text-[#71808d]">未关联</span>;
  }

  return (
    <div className="space-y-3">
      {logisticsOrders.map((logisticsOrder) => (
        <div
          className="rounded-[16px] border border-[#ebe7e1] bg-[#fbfaf8] px-3 py-2"
          key={logisticsOrder.id}
        >
          <div className="font-semibold [overflow-wrap:anywhere]">
            {logisticsOrder.international_tracking_number}
          </div>
          <div className="mt-1 text-xs leading-5 text-[#71808d]">
            目的地 {logisticsOrder.destination_tracking_number ?? "未记录"} / 货代{" "}
            {logisticsOrder.freight_forwarder ?? "未记录"}
          </div>
          <div className="mt-1 text-xs leading-5 text-[#71808d]">
            {logisticsOrder.latest_status ?? "未记录进度"} / 费用{" "}
            {formatCurrency(logisticsOrder.logistics_fee, logisticsOrder.currency)}
          </div>
          <div className="mt-1 text-xs leading-5 text-[#71808d]">
            {formatDateTime(
              logisticsOrder.latest_checkpoint_at ?? logisticsOrder.updated_at,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
