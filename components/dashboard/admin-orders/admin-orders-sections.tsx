"use client";

import { memo } from "react";

import { useTranslations } from "next-intl";
import { BadgeDollarSign, ClipboardList, Plus, ReceiptText } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import { type AdminOrderRow } from "@/lib/admin-orders";

import { Button } from "../../ui/button";
import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardSectionPanel,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { DashboardPaginationControls } from "../dashboard-pagination-controls";
import { EmptyState, formatDateTime } from "../dashboard-shared-ui";
import {
  OrderHeaderCell,
  OrderStatusChip,
  OrderTypeChip,
  OrderValueCell,
} from "./admin-orders-ui";
import {
  formatMoneyValue,
  createOrdersUiCopy,
  getOrderTypeMetaFromCategory,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
} from "./admin-orders-utils";

type OrdersHeaderSectionProps = {
  badge: string;
  canCreateOrders: boolean;
  canOpenCreateDialog: boolean;
  createTitle: string;
  description: string;
  noCreateTargetHint: string | null;
  onCreate: () => void;
  summary: {
    completed: number;
    pending: number;
    total: number;
  };
  title: string;
};

type OrdersPaginationState = {
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  page: number;
  pageCount: number;
  startIndex: number;
  totalItems: number;
};

type OrdersTableSectionProps = {
  canViewOrderCosts: boolean;
  filters: {
    orderEntryUser: string;
    orderNumber: string;
    orderingUser: string;
  };
  matchedOrdersCount: number;
  onClearFilters: () => void;
  onOrderEntryUserChange: (value: string) => void;
  onOrderNumberChange: (value: string) => void;
  onOrderingUserChange: (value: string) => void;
  onSelectOrder: (order: AdminOrderRow) => void;
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>;
  pagination: OrdersPaginationState;
  rows: AdminOrderRow[];
  showCreatedAtColumn: boolean;
  showOrderEntryColumn: boolean;
  showOrderEntryFilter: boolean;
  showOrderingColumn: boolean;
  showOrderingFilter: boolean;
  totalOrdersCount: number;
  userLabelById: Map<string, string>;
};

export const OrdersHeaderSection = memo(function OrdersHeaderSection({
  badge,
  canCreateOrders,
  canOpenCreateDialog,
  createTitle,
  description,
  noCreateTargetHint,
  onCreate,
  summary,
  title,
}: OrdersHeaderSectionProps) {
  const t = useTranslations("Orders");

  return (
    <DashboardSectionHeader
      actions={
        canCreateOrders ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!canOpenCreateDialog}
            onClick={onCreate}
            type="button"
          >
            <Plus className="size-4" />
            {createTitle}
          </Button>
        ) : null
      }
      asideFooter={
        noCreateTargetHint && !canOpenCreateDialog ? (
          <p className="text-sm text-[#69747d]">{noCreateTargetHint}</p>
        ) : null
      }
      badge={badge}
      contentClassName="max-w-2xl"
      description={description}
      metrics={[
        {
          accent: "blue",
          icon: <ReceiptText className="size-5" />,
          key: "total",
          label: t("summary.total"),
          value: String(summary.total),
        },
        {
          accent: "gold",
          icon: <ClipboardList className="size-5" />,
          key: "pending",
          label: t("summary.pending"),
          value: String(summary.pending),
        },
        {
          accent: "green",
          icon: <BadgeDollarSign className="size-5" />,
          key: "completed",
          label: t("summary.completed"),
          value: String(summary.completed),
        },
      ]}
      title={title}
    />
  );
});

export const OrdersTableSection = memo(function OrdersTableSection({
  canViewOrderCosts,
  filters,
  matchedOrdersCount,
  onClearFilters,
  onOrderEntryUserChange,
  onOrderNumberChange,
  onOrderingUserChange,
  onSelectOrder,
  orderTypeMetaById,
  pagination,
  rows,
  showCreatedAtColumn,
  showOrderEntryColumn,
  showOrderEntryFilter,
  showOrderingColumn,
  showOrderingFilter,
  totalOrdersCount,
  userLabelById,
}: OrdersTableSectionProps) {
  const t = useTranslations("Orders");
  const ordersUiT = useTranslations("OrdersUI");
  const { locale } = useLocale();
  const orderUiCopy = createOrdersUiCopy(ordersUiT);
  const hasActiveFilters = Boolean(
    filters.orderNumber || filters.orderEntryUser || filters.orderingUser,
  );

  return (
    <DashboardSectionPanel className="p-4 sm:p-6 xl:p-8">
      <DashboardFilterPanel
        className="mb-5"
        gridClassName={
          showOrderEntryFilter && showOrderingFilter
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            : showOrderingFilter
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              : "lg:grid-cols-[minmax(0,1fr)_auto]"
        }
      >
        <DashboardFilterField label={t("filters.orderNumberLabel")}>
          <input
            className={dashboardFilterInputClassName}
            onChange={(event) => onOrderNumberChange(event.target.value)}
            placeholder={t("filters.orderNumberPlaceholder")}
            type="text"
            value={filters.orderNumber}
          />
        </DashboardFilterField>

        {showOrderEntryFilter ? (
          <DashboardFilterField label={t("filters.orderEntryUserLabel")}>
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => onOrderEntryUserChange(event.target.value)}
              placeholder={t("filters.orderEntryUserPlaceholder")}
              type="text"
              value={filters.orderEntryUser}
            />
          </DashboardFilterField>
        ) : null}

        {showOrderingFilter ? (
          <DashboardFilterField label={t("filters.orderingUserLabel")}>
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => onOrderingUserChange(event.target.value)}
              placeholder={t("filters.orderingUserPlaceholder")}
              type="text"
              value={filters.orderingUser}
            />
          </DashboardFilterField>
        ) : null}

        <div className="flex flex-col justify-end gap-3 lg:items-end">
          <p className="text-sm text-[#69747d]">
            {t("filters.resultSummary", {
              total: totalOrdersCount,
              matched: matchedOrdersCount,
            })}
          </p>
          <Button
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            type="button"
            variant="outline"
          >
            {t("filters.clear")}
          </Button>
        </div>
      </DashboardFilterPanel>

      {matchedOrdersCount === 0 ? (
        <EmptyState
          description={t("states.noMatchDescription")}
          icon={<ClipboardList className="size-6" />}
          title={t("states.noMatchTitle")}
        />
      ) : (
        <DashboardTableFrame
          footer={
            <DashboardPaginationControls
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onNextPage={pagination.onNextPage}
              onPreviousPage={pagination.onPreviousPage}
              page={pagination.page}
              pageCount={pagination.pageCount}
              startIndex={pagination.startIndex}
              totalItems={pagination.totalItems}
            />
          }
        >
            <table className="min-w-[960px] w-full table-fixed border-collapse">
              <thead className="bg-[#f7f5f2]">
                <tr className="border-b border-[#efebe5]">
                  <OrderHeaderCell>{t("table.orderNumber")}</OrderHeaderCell>
                  <OrderHeaderCell>{t("table.rmbAmount")}</OrderHeaderCell>
                  {canViewOrderCosts ? <OrderHeaderCell>{t("table.costAmount")}</OrderHeaderCell> : null}
                  {showOrderEntryColumn ? (
                    <OrderHeaderCell>{t("table.orderEntryUser")}</OrderHeaderCell>
                  ) : null}
                  {showOrderingColumn ? (
                    <OrderHeaderCell>{t("table.orderingUser")}</OrderHeaderCell>
                  ) : null}
                  <OrderHeaderCell>{t("table.orderStatus")}</OrderHeaderCell>
                  <OrderHeaderCell>{t("table.orderType")}</OrderHeaderCell>
                  {showCreatedAtColumn ? (
                    <OrderHeaderCell>{t("table.createdAt")}</OrderHeaderCell>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr
                    key={order.order_number}
                    className="cursor-pointer border-b border-[#efebe5] transition-colors hover:bg-[#fcfbf8] last:border-b-0"
                    onClick={() => onSelectOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectOrder(order);
                      }
                    }}
                    tabIndex={0}
                  >
                    <OrderValueCell strong value={order.order_number} />
                    <OrderValueCell value={formatMoneyValue(order.rmb_amount, locale)} />
                    {canViewOrderCosts ? (
                      <OrderValueCell value={formatMoneyValue(order.cost_amount, locale)} />
                    ) : null}
                    {showOrderEntryColumn ? (
                      <OrderValueCell
                        value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
                      />
                    ) : null}
                    {showOrderingColumn ? (
                      <OrderValueCell
                        value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
                      />
                    ) : null}
                    <OrderValueCell value={<OrderStatusChip status={order.order_status} />} />
                    <OrderValueCell
                      value={
                        <OrderTypeChip
                          meta={resolveOrderTypeMeta(
                            order.order_type,
                            orderTypeMetaById,
                            orderUiCopy,
                          )}
                        />
                      }
                    />
                    {showCreatedAtColumn ? (
                      <OrderValueCell value={formatDateTime(order.created_at, locale)} />
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
        </DashboardTableFrame>
      )}
    </DashboardSectionPanel>
  );
});
