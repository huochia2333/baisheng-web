"use client";

import { useMemo, useState } from "react";

import { FileSpreadsheet, RefreshCcw, Upload } from "lucide-react";

import {
  DashboardFilterField,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type {
  Wholesale1688Order,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProfile,
} from "@/lib/wholesale";

import {
  Wholesale1688UploadDialog,
  WholesaleClaimDialog,
} from "./wholesale-claims-dialogs";
import { WholesaleClaimsTable } from "./wholesale-claims-table";
import {
  buildWholesaleClaimRows,
  countWholesaleClaimBoards,
  filterWholesaleClaimRows,
  WHOLESALE_CLAIM_BOARDS,
  type WholesaleClaimBoardKey,
  type WholesaleClaimRow,
} from "./wholesale-claims-view-model";
import type { useWholesaleActions } from "./use-wholesale-actions";
import {
  WholesaleEmptyState,
  WholesalePageShell,
} from "./wholesale-ui";

type WholesaleClaimsSectionProps = {
  canAdmin: boolean;
  canEdit: boolean;
  customers: WholesaleCustomer[];
  customersById: Map<string, WholesaleCustomer>;
  orders: WholesaleOrder[];
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  purchaseOrders: Wholesale1688Order[];
  actions: Pick<
    ReturnType<typeof useWholesaleActions>,
    "claim1688Order" | "delete1688Order" | "import1688Rows"
  >;
};

export function WholesaleClaimsSection({
  actions,
  canAdmin,
  canEdit,
  customers,
  customersById,
  orders,
  pendingKey,
  profilesById,
  purchaseOrders,
}: WholesaleClaimsSectionProps) {
  const [activeBoard, setActiveBoard] =
    useState<WholesaleClaimBoardKey>("assisted");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<WholesaleClaimRow | null>(null);
  const [searchText, setSearchText] = useState("");
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );
  const claimRows = useMemo(
    () =>
      buildWholesaleClaimRows({
        customersById,
        ordersById,
        profilesById,
        purchaseOrders,
      }),
    [customersById, ordersById, profilesById, purchaseOrders],
  );
  const boardCounts = useMemo(
    () => countWholesaleClaimBoards(claimRows),
    [claimRows],
  );
  const filteredRows = useMemo(
    () => filterWholesaleClaimRows(claimRows, activeBoard, searchText),
    [activeBoard, claimRows, searchText],
  );
  const activeBoardMeta =
    WHOLESALE_CLAIM_BOARDS.find((board) => board.key === activeBoard) ??
    WHOLESALE_CLAIM_BOARDS[0];

  return (
    <WholesalePageShell
      actions={
        canEdit ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            onClick={() => setUploadDialogOpen(true)}
            type="button"
          >
            <Upload className="size-4" />
            上传 1688 CSV
          </Button>
        ) : null
      }
      description="1688 采购订单按已认领、待分类和认领大厅分开处理。CSV 会先按收款人名字辅助归类，确认客户和批发订单后才算完成认领。"
      eyebrow="批发业务"
      title="订单认领"
    >
      <DashboardListSection
        actions={
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            disabled={!searchText}
            onClick={() => setSearchText("")}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            清空搜索
          </Button>
        }
        description={`当前在${activeBoardMeta.label}中显示 ${filteredRows.length} 条采购订单。${activeBoardMeta.description}`}
        title="采购订单认领"
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <DashboardFilterField label="搜索采购订单">
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="1688 订单号、收款人、商品、客户、业务员"
              type="search"
              value={searchText}
            />
          </DashboardFilterField>
          <div className="grid gap-2 sm:grid-cols-3">
            {WHOLESALE_CLAIM_BOARDS.map((board) => (
              <button
                className={
                  activeBoard === board.key
                    ? "rounded-[18px] bg-[#486782] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_12px_24px_rgba(72,103,130,0.18)]"
                    : "rounded-[18px] border border-[#dfe5ea] bg-white px-4 py-3 text-left text-sm font-semibold text-[#486782] hover:bg-[#f4f8fa]"
                }
                key={board.key}
                onClick={() => setActiveBoard(board.key)}
                type="button"
              >
                <span className="block">{board.label}</span>
                <span className="mt-1 block text-xs opacity-80">
                  {boardCounts[board.key]} 条
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <WholesaleEmptyState
            description={getEmptyDescription(activeBoard)}
            icon={<FileSpreadsheet className="size-5" />}
            title="暂无采购订单"
          />
        ) : (
          <WholesaleClaimsTable
            canAdmin={canAdmin}
            canEdit={canEdit}
            onDelete={actions.delete1688Order}
            onOpenClaim={setClaimTarget}
            pendingKey={pendingKey}
            rows={filteredRows}
          />
        )}
      </DashboardListSection>

      <Wholesale1688UploadDialog
        onImportRows={actions.import1688Rows}
        onOpenChange={setUploadDialogOpen}
        open={uploadDialogOpen}
        pending={pendingKey === "1688:import"}
      />

      <WholesaleClaimDialog
        claimTarget={claimTarget}
        customers={customers}
        onClaim={actions.claim1688Order}
        onOpenChange={(open) => {
          if (!open) setClaimTarget(null);
        }}
        orders={orders}
        pending={pendingKey === "1688:claim"}
      />
    </WholesalePageShell>
  );
}

function getEmptyDescription(board: WholesaleClaimBoardKey) {
  if (board === "assisted") {
    return "CSV 上传后，如果系统能按收款人名字匹配到客户，会先出现在这里。";
  }

  if (board === "hall") {
    return "没有辅助匹配到客户的采购订单会进入认领大厅。";
  }

  return "确认客户和批发订单后，采购订单会进入已认领。";
}
