import { normalizeSearchText } from "@/lib/value-normalizers";
import type {
  Wholesale1688Order,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProfile,
} from "@/lib/wholesale";

import { getCustomerName, getProfileName } from "./wholesale-display";

export type WholesaleClaimBoardKey = "assisted" | "claimed" | "hall";

export type WholesaleClaimRow = {
  assistedCustomerName: string;
  board: WholesaleClaimBoardKey;
  claimerName: string;
  customerName: string;
  orderNumber: string;
  purchaseOrder: Wholesale1688Order;
  recipientName: string;
};

export const WHOLESALE_CLAIM_BOARDS: Array<{
  key: WholesaleClaimBoardKey;
  label: string;
  description: string;
}> = [
  {
    key: "assisted",
    label: "待分类",
    description: "已按收款人名字匹配到客户，等待确认批发订单。",
  },
  {
    key: "hall",
    label: "认领大厅",
    description: "没有匹配到客户的采购订单，由业务员手动认领。",
  },
  {
    key: "claimed",
    label: "已认领",
    description: "已经确认客户和批发订单的采购订单。",
  },
];

export function buildWholesaleClaimRows({
  customersById,
  ordersById,
  profilesById,
  purchaseOrders,
}: {
  customersById: Map<string, WholesaleCustomer>;
  ordersById: Map<string, WholesaleOrder>;
  profilesById: Map<string, WholesaleProfile>;
  purchaseOrders: Wholesale1688Order[];
}): WholesaleClaimRow[] {
  return purchaseOrders.map((purchaseOrder) => {
    const assistedCustomerName = getCustomerName(
      customersById,
      purchaseOrder.assisted_customer_id,
    );

    return {
      assistedCustomerName,
      board: getWholesaleClaimBoard(purchaseOrder),
      claimerName: getProfileName(
        profilesById,
        purchaseOrder.claimed_by_user_id,
      ),
      customerName: getCustomerName(customersById, purchaseOrder.customer_id),
      orderNumber: purchaseOrder.wholesale_order_id
        ? ordersById.get(purchaseOrder.wholesale_order_id)?.order_number ??
          "未关联"
        : "未关联",
      purchaseOrder,
      recipientName: purchaseOrder.recipient_name ?? "未记录",
    };
  });
}

export function filterWholesaleClaimRows(
  rows: WholesaleClaimRow[],
  board: WholesaleClaimBoardKey,
  searchText: string,
) {
  const searchValue = normalizeSearchText(searchText);

  return rows.filter((row) => {
    if (row.board !== board) {
      return false;
    }

    if (!searchValue) {
      return true;
    }

    const { purchaseOrder } = row;

    return [
      purchaseOrder.external_order_number,
      purchaseOrder.item_summary ?? "",
      purchaseOrder.order_status ?? "",
      purchaseOrder.seller_name ?? "",
      row.assistedCustomerName,
      row.claimerName,
      row.customerName,
      row.orderNumber,
      row.recipientName,
    ].some((value) => normalizeSearchText(value).includes(searchValue));
  });
}

export function countWholesaleClaimBoards(rows: WholesaleClaimRow[]) {
  return rows.reduce<Record<WholesaleClaimBoardKey, number>>(
    (counts, row) => {
      counts[row.board] += 1;
      return counts;
    },
    {
      assisted: 0,
      claimed: 0,
      hall: 0,
    },
  );
}

function getWholesaleClaimBoard(
  purchaseOrder: Wholesale1688Order,
): WholesaleClaimBoardKey {
  if (purchaseOrder.claimed_at) {
    return "claimed";
  }

  if (purchaseOrder.assisted_customer_id) {
    return "assisted";
  }

  return "hall";
}
