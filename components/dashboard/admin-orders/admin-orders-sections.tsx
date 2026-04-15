"use client";

import { memo } from "react";

import { useTranslations } from "next-intl";
import { BadgeDollarSign, ClipboardList, Plus, ReceiptText } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import { type AdminOrderRow } from "@/lib/admin-orders";

import { Button } from "../../ui/button";
import { DashboardPaginationControls } from "../dashboard-pagination-controls";
import { EmptyState, formatDateTime } from "../dashboard-shared-ui";
import {
  FilterField,
  OrderHeaderCell,
  OrderStatusChip,
  OrderSummaryCard,
  OrderTypeChip,
  OrderValueCell,
  filterInputClassName,
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
  filteredOrders: AdminOrderRow[];
  filters: {
    orderEntryUser: string;
    orderNumber: string;
    orderingUser: string;
  };
  onClearFilters: () => void;
  onOrderEntryUserChange: (value: string) => void;
  onOrderNumberChange: (value: string) => void;
  onOrderingUserChange: (value: string) => void;
  onSelectOrder: (order: AdminOrderRow) => void;
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>;
  ordersCount: number;
  pagination: OrdersPaginationState;
  rows: AdminOrderRow[];
  showCreatedAtColumn: boolean;
  showOrderEntryColumn: boolean;
  showOrderEntryFilter: boolean;
  showOrderingColumn: boolean;
  showOrderingFilter: boolean;
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
    <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
            {badge}
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
            {title}
          </h2>
          <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-4 xl:items-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OrderSummaryCard
              accent="blue"
              count={summary.total}
              icon={<ReceiptText className="size-5" />}
              label={t("summary.total")}
            />
            <OrderSummaryCard
              accent="gold"
              count={summary.pending}
              icon={<ClipboardList className="size-5" />}
              label={t("summary.pending")}
            />
            <OrderSummaryCard
              accent="green"
              count={summary.completed}
              icon={<BadgeDollarSign className="size-5" />}
              label={t("summary.completed")}
            />
          </div>

          {canCreateOrders ? (
            <>
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                disabled={!canOpenCreateDialog}
                onClick={onCreate}
                type="button"
              >
                <Plus className="size-4" />
                {createTitle}
              </Button>
              {noCreateTargetHint && !canOpenCreateDialog ? (
                <p className="text-sm text-[#69747d]">{noCreateTargetHint}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
});

export const OrdersTableSection = memo(function OrdersTableSection({
  canViewOrderCosts,
  filteredOrders,
  filters,
  onClearFilters,
  onOrderEntryUserChange,
  onOrderNumberChange,
  onOrderingUserChange,
  onSelectOrder,
  orderTypeMetaById,
  ordersCount,
  pagination,
  rows,
  showCreatedAtColumn,
  showOrderEntryColumn,
  showOrderEntryFilter,
  showOrderingColumn,
  showOrderingFilter,
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
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
      <div
        className={`mb-5 grid gap-4 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] ${
          showOrderEntryFilter && showOrderingFilter
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            : showOrderingFilter
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              : "lg:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        <FilterField label={t("filters.orderNumberLabel")}>
          <input
            className={filterInputClassName}
            onChange={(event) => onOrderNumberChange(event.target.value)}
            placeholder={t("filters.orderNumberPlaceholder")}
            type="text"
            value={filters.orderNumber}
          />
        </FilterField>

        {showOrderEntryFilter ? (
          <FilterField label={t("filters.orderEntryUserLabel")}>
            <input
              className={filterInputClassName}
              onChange={(event) => onOrderEntryUserChange(event.target.value)}
              placeholder={t("filters.orderEntryUserPlaceholder")}
              type="text"
              value={filters.orderEntryUser}
            />
          </FilterField>
        ) : null}

        {showOrderingFilter ? (
          <FilterField label={t("filters.orderingUserLabel")}>
            <input
              className={filterInputClassName}
              onChange={(event) => onOrderingUserChange(event.target.value)}
              placeholder={t("filters.orderingUserPlaceholder")}
              type="text"
              value={filters.orderingUser}
            />
          </FilterField>
        ) : null}

        <div className="flex flex-col justify-end gap-3 lg:items-end">
          <p className="text-sm text-[#69747d]">
            {t("filters.resultSummary", {
              total: ordersCount,
              matched: filteredOrders.length,
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
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          description={t("states.noMatchDescription")}
          icon={<ClipboardList className="size-6" />}
          title={t("states.noMatchTitle")}
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
          <div className="overflow-x-auto">
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
          </div>

          <div className="px-5 pb-5">
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
          </div>
        </div>
      )}
    </section>
  );
});
