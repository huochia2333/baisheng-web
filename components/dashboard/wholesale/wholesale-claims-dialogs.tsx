"use client";

import { useMemo, useState } from "react";

import { FileSpreadsheet } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { DashboardFilterField } from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { Wholesale1688IngestRow } from "@/lib/wholesale-1688-ingest";
import { parseWholesale1688Csv } from "@/lib/wholesale-1688-ingest";
import type {
  WholesaleCustomer,
  WholesaleOrder,
} from "@/lib/wholesale";

import type { WholesaleClaimRow } from "./wholesale-claims-view-model";
import { WholesaleSelect } from "./wholesale-ui";

export function Wholesale1688UploadDialog({
  onImportRows,
  onOpenChange,
  open,
  pending,
}: {
  onImportRows: (fileName: string, rows: Wholesale1688IngestRow[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
}) {
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<Wholesale1688IngestRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const rowsWithRecipient = parsedRows.filter((row) => row.recipient_name).length;

  return (
    <DashboardDialog
      description="选择文件后先读取内容，确认无误再接收进入认领列表。系统会按收款人名字先帮你分到待分类。"
      onOpenChange={onOpenChange}
      open={open}
      title="上传 1688 CSV"
    >
      <div className="space-y-4">
        <DashboardFilterField label="选择文件">
          <input
            accept=".csv,text/csv"
            className="block w-full rounded-[18px] border border-[#dfe5ea] bg-white px-3 py-2 text-sm text-[#23313a] file:mr-4 file:rounded-full file:border-0 file:bg-[#486782] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              setFileName(file.name);
              setParseError(null);
              file
                .text()
                .then((text) => setParsedRows(parseWholesale1688Csv(text)))
                .catch(() => {
                  setParsedRows([]);
                  setParseError("文件没有读取成功，请重新选择。");
                });
            }}
            type="file"
          />
        </DashboardFilterField>
        {parseError ? (
          <p className="text-sm text-[#b13d3d]">{parseError}</p>
        ) : parsedRows.length > 0 ? (
          <p className="text-sm leading-6 text-[#61717e]">
            已读取 {parsedRows.length} 条采购订单，其中 {rowsWithRecipient}{" "}
            条带有收款人名字。确认后会先进入待分类或认领大厅。
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] disabled:opacity-60"
            disabled={parsedRows.length === 0 || pending}
            onClick={() => {
              onImportRows(fileName, parsedRows);
              onOpenChange(false);
            }}
            type="button"
          >
            <FileSpreadsheet className="size-4" />
            接收采购订单
          </Button>
        </div>
      </div>
    </DashboardDialog>
  );
}

export function WholesaleClaimDialog({
  claimTarget,
  customers,
  onClaim,
  onOpenChange,
  orders,
  pending,
}: {
  claimTarget: WholesaleClaimRow | null;
  customers: WholesaleCustomer[];
  onClaim: (formData: FormData) => void;
  onOpenChange: (open: boolean) => void;
  orders: WholesaleOrder[];
  pending: boolean;
}) {
  return (
    <DashboardDialog
      description="确认客户和批发订单后，这条采购订单会进入已认领。"
      onOpenChange={onOpenChange}
      open={Boolean(claimTarget)}
      title={claimTarget?.purchaseOrder.external_order_number ?? "认领采购订单"}
    >
      {claimTarget ? (
        <WholesaleClaimDialogForm
          claimTarget={claimTarget}
          customers={customers}
          key={claimTarget.purchaseOrder.id}
          onClaim={onClaim}
          onOpenChange={onOpenChange}
          orders={orders}
          pending={pending}
        />
      ) : null}
    </DashboardDialog>
  );
}

function WholesaleClaimDialogForm({
  claimTarget,
  customers,
  onClaim,
  onOpenChange,
  orders,
  pending,
}: {
  claimTarget: WholesaleClaimRow;
  customers: WholesaleCustomer[];
  onClaim: (formData: FormData) => void;
  onOpenChange: (open: boolean) => void;
  orders: WholesaleOrder[];
  pending: boolean;
}) {
  const defaultCustomerId =
    claimTarget.purchaseOrder.assisted_customer_id ??
    claimTarget.purchaseOrder.customer_id ??
    "";
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId);
  const [selectedOrderId, setSelectedOrderId] = useState(() =>
    getDefaultWholesaleOrderId(orders, defaultCustomerId, claimTarget),
  );
  const matchingOrders = useMemo(
    () =>
      selectedCustomerId
        ? orders.filter((order) => order.customer_id === selectedCustomerId)
        : [],
    [orders, selectedCustomerId],
  );
  const canSubmit = Boolean(selectedCustomerId && selectedOrderId);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onClaim(new FormData(event.currentTarget));
        onOpenChange(false);
      }}
    >
      <input
        name="purchase_order_id"
        type="hidden"
        value={claimTarget.purchaseOrder.id}
      />
      {claimTarget.purchaseOrder.assisted_customer_id ? (
        <div className="rounded-[18px] bg-[#f6f8f9] px-4 py-3 text-sm leading-6 text-[#61717e]">
          系统根据收款人名字“{claimTarget.recipientName}”匹配到客户“
          {claimTarget.assistedCustomerName}”，请确认要关联的批发订单。
        </div>
      ) : null}
      <WholesaleSelect
        label="客户"
        name="customer_id"
        onChange={(event) => {
          const nextCustomerId = event.target.value;
          setSelectedCustomerId(nextCustomerId);
          setSelectedOrderId(
            getDefaultWholesaleOrderId(orders, nextCustomerId, claimTarget),
          );
        }}
        required
        value={selectedCustomerId}
      >
        <option value="">选择客户</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.unique_name}
          </option>
        ))}
      </WholesaleSelect>
      <WholesaleSelect
        disabled={!selectedCustomerId || matchingOrders.length === 0}
        label="关联批发订单"
        name="wholesale_order_id"
        onChange={(event) => setSelectedOrderId(event.target.value)}
        required
        value={selectedOrderId}
      >
        <option value="">
          {selectedCustomerId ? "选择批发订单" : "先选择客户"}
        </option>
        {matchingOrders.map((order) => (
          <option key={order.id} value={order.id}>
            {order.order_number}
          </option>
        ))}
      </WholesaleSelect>
      {selectedCustomerId && matchingOrders.length === 0 ? (
        <p className="text-sm leading-6 text-[#9a6a07]">
          这个客户还没有可关联的批发订单，请先新建订单后再认领。
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button
          className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] disabled:opacity-60"
          disabled={pending || !canSubmit}
          type="submit"
        >
          确认归属
        </Button>
      </div>
    </form>
  );
}

function getDefaultWholesaleOrderId(
  orders: WholesaleOrder[],
  customerId: string,
  claimTarget: WholesaleClaimRow,
) {
  if (!customerId) {
    return "";
  }

  const targetOrderId = claimTarget.purchaseOrder.wholesale_order_id;

  if (
    targetOrderId &&
    orders.some(
      (order) => order.id === targetOrderId && order.customer_id === customerId,
    )
  ) {
    return targetOrderId;
  }

  const matchingOrders = orders.filter((order) => order.customer_id === customerId);

  return matchingOrders.length === 1 ? matchingOrders[0].id : "";
}
