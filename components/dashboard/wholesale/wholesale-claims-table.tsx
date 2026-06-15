"use client";

import { CheckCircle2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "./wholesale-display";
import type { WholesaleClaimRow } from "./wholesale-claims-view-model";
import {
  WholesaleStatusBadge,
  WholesaleTable,
  WholesaleTd,
  WholesaleTh,
  wholesaleStickyFirstTdClassName,
  wholesaleStickyFirstThClassName,
} from "./wholesale-ui";

export function WholesaleClaimsTable({
  canAdmin,
  canEdit,
  onDelete,
  onOpenClaim,
  pendingKey,
  rows,
}: {
  canAdmin: boolean;
  canEdit: boolean;
  onDelete: (purchaseOrderId: string) => void;
  onOpenClaim: (row: WholesaleClaimRow) => void;
  pendingKey: string | null;
  rows: WholesaleClaimRow[];
}) {
  return (
    <WholesaleTable minWidth={2040}>
      <thead>
        <tr>
          <WholesaleTh className={wholesaleStickyFirstThClassName}>
            1688 订单号
          </WholesaleTh>
          <WholesaleTh>收款人名字</WholesaleTh>
          <WholesaleTh>辅助归类</WholesaleTh>
          <WholesaleTh>业务员</WholesaleTh>
          <WholesaleTh>客户</WholesaleTh>
          <WholesaleTh>关联批发订单</WholesaleTh>
          <WholesaleTh className="min-w-[260px] whitespace-normal">
            商品
          </WholesaleTh>
          <WholesaleTh>数量</WholesaleTh>
          <WholesaleTh>采购金额</WholesaleTh>
          <WholesaleTh>采购时间</WholesaleTh>
          <WholesaleTh>认领时间</WholesaleTh>
          <WholesaleTh>接收时间</WholesaleTh>
          <WholesaleTh>操作</WholesaleTh>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <WholesaleClaimTableRow
            canAdmin={canAdmin}
            canEdit={canEdit}
            key={row.purchaseOrder.id}
            onDelete={onDelete}
            onOpenClaim={onOpenClaim}
            pendingKey={pendingKey}
            row={row}
          />
        ))}
      </tbody>
    </WholesaleTable>
  );
}

function WholesaleClaimTableRow({
  canAdmin,
  canEdit,
  onDelete,
  onOpenClaim,
  pendingKey,
  row,
}: {
  canAdmin: boolean;
  canEdit: boolean;
  onDelete: (purchaseOrderId: string) => void;
  onOpenClaim: (row: WholesaleClaimRow) => void;
  pendingKey: string | null;
  row: WholesaleClaimRow;
}) {
  const { purchaseOrder } = row;

  return (
    <tr className="group">
      <WholesaleTd className={wholesaleStickyFirstTdClassName}>
        <div className="font-semibold [overflow-wrap:anywhere]">
          {purchaseOrder.external_order_number}
        </div>
        <div className="mt-2">
          <ClaimBoardBadge row={row} />
        </div>
        <div className="mt-2 text-xs leading-5 text-[#71808d]">
          {purchaseOrder.order_status ?? "未记录状态"}
        </div>
      </WholesaleTd>
      <WholesaleTd className="min-w-[150px] whitespace-normal">
        {row.recipientName}
      </WholesaleTd>
      <WholesaleTd className="min-w-[170px] whitespace-normal">
        {purchaseOrder.assisted_customer_id ? (
          <div>
            <div className="font-semibold text-[#2b3942]">
              {row.assistedCustomerName}
            </div>
            <div className="mt-1 text-xs leading-5 text-[#71808d]">
              按收款人名字匹配
            </div>
          </div>
        ) : (
          "未匹配"
        )}
      </WholesaleTd>
      <WholesaleTd className="min-w-[150px] whitespace-normal">
        {purchaseOrder.claimed_by_user_id ? row.claimerName : "未认领"}
      </WholesaleTd>
      <WholesaleTd className="min-w-[160px] whitespace-normal">
        {row.customerName}
      </WholesaleTd>
      <WholesaleTd className="min-w-[170px] whitespace-normal">
        {row.orderNumber}
      </WholesaleTd>
      <WholesaleTd className="min-w-[260px] whitespace-normal">
        <div>{purchaseOrder.item_summary ?? "未记录商品"}</div>
        {purchaseOrder.seller_name ? (
          <div className="mt-1 text-xs text-[#71808d]">
            1688 店铺 {purchaseOrder.seller_name}
          </div>
        ) : null}
      </WholesaleTd>
      <WholesaleTd>{formatNumber(purchaseOrder.quantity)}</WholesaleTd>
      <WholesaleTd>{formatCurrency(purchaseOrder.purchase_amount)}</WholesaleTd>
      <WholesaleTd>{formatDateTime(purchaseOrder.purchased_at)}</WholesaleTd>
      <WholesaleTd>{formatDateTime(purchaseOrder.claimed_at)}</WholesaleTd>
      <WholesaleTd>{formatDateTime(purchaseOrder.created_at)}</WholesaleTd>
      <WholesaleTd>
        <ClaimActions
          canAdmin={canAdmin}
          canEdit={canEdit}
          onDelete={() => onDelete(purchaseOrder.id)}
          onOpenClaim={() => onOpenClaim(row)}
          pending={pendingKey}
          row={row}
        />
      </WholesaleTd>
    </tr>
  );
}

function ClaimBoardBadge({ row }: { row: WholesaleClaimRow }) {
  if (row.board === "claimed") {
    return <WholesaleStatusBadge tone="success">已认领</WholesaleStatusBadge>;
  }

  if (row.board === "assisted") {
    return <WholesaleStatusBadge tone="warning">待分类</WholesaleStatusBadge>;
  }

  return <WholesaleStatusBadge tone="default">认领大厅</WholesaleStatusBadge>;
}

function ClaimActions({
  canAdmin,
  canEdit,
  onDelete,
  onOpenClaim,
  pending,
  row,
}: {
  canAdmin: boolean;
  canEdit: boolean;
  onDelete: () => void;
  onOpenClaim: () => void;
  pending: string | null;
  row: WholesaleClaimRow;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {row.board === "claimed" ? (
        <WholesaleStatusBadge tone="success">
          <CheckCircle2 className="mr-1 size-3.5" />
          {formatDateTime(row.purchaseOrder.claimed_at)}
        </WholesaleStatusBadge>
      ) : canEdit ? (
        <Button
          className="h-9 rounded-full bg-[#486782] px-3 text-xs text-white hover:bg-[#3e5f79]"
          disabled={pending === "1688:claim"}
          onClick={onOpenClaim}
          type="button"
        >
          {row.board === "assisted" ? "确认归属" : "认领"}
        </Button>
      ) : (
        <WholesaleStatusBadge tone="warning">等待认领</WholesaleStatusBadge>
      )}
      {canAdmin ? (
        <Button
          className="h-9 rounded-full bg-[#fbe6e6] px-3 text-xs font-semibold text-[#b13d3d] hover:bg-[#f7d4d4]"
          disabled={pending === "1688:delete"}
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="size-3.5" />
          移出
        </Button>
      ) : null}
    </div>
  );
}
