"use client";

import { memo } from "react";
import type { ReactNode } from "react";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Clock3,
  History,
  LoaderCircle,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import type { ExchangeRateLatestRow, ExchangeRateRow } from "@/lib/exchange-rates";
import { normalizeCurrencyCode } from "@/lib/exchange-rates";

import { Button } from "../../ui/button";
import { DashboardPaginationControls } from "../dashboard-pagination-controls";
import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardListHeader,
  DashboardListSection,
  DashboardSectionPanel,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import {
  EmptyState,
  formatDateTime,
} from "../dashboard-shared-ui";
import { formatExchangeRateValue } from "./exchange-rates-utils";
import { ExchangeRateFormDialog } from "./exchange-rates-form-dialog";
import { LatestRateCard } from "./exchange-rates-latest-card";

export { ExchangeRateFormDialog };

type PaginationState = {
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

type ExchangeRatesHeaderSectionProps = {
  canManage: boolean;
  latestRowsCount: number;
  latestUpdatedAt: string | null;
  onCreate: () => void;
  ratesCount: number;
};

type ExchangeRatesLatestSectionProps = {
  filteredRowsCount: number;
  pagination: PaginationState;
  rows: ExchangeRateLatestRow[];
  totalLatestRows: number;
  totalRates: number;
};

type ExchangeRatesHistorySectionProps = {
  canManage: boolean;
  deletePendingId: string | null;
  filteredRowsCount: number;
  filters: {
    originalCurrency: string;
    targetCurrency: string;
  };
  hasActiveFilters: boolean;
  homeHref: string;
  onClearFilters: () => void;
  onDeleteRow: (row: ExchangeRateRow) => void;
  onEditRow: (row: ExchangeRateRow) => void;
  onOriginalCurrencyChange: (value: string) => void;
  onTargetCurrencyChange: (value: string) => void;
  pagination: PaginationState;
  rows: ExchangeRateRow[];
  totalRates: number;
};

export const ExchangeRatesHeaderSection = memo(function ExchangeRatesHeaderSection({
  canManage,
  latestRowsCount,
  latestUpdatedAt,
  onCreate,
  ratesCount,
}: ExchangeRatesHeaderSectionProps) {
  const t = useTranslations("ExchangeRates");
  const { locale } = useLocale();

  return (
    <DashboardSectionHeader
      actions={
        canManage ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            onClick={onCreate}
            type="button"
          >
            <Plus className="size-4" />
            {t("actions.create")}
          </Button>
        ) : null
      }
      badge={t("header.badge")}
      contentClassName="max-w-2xl"
      description={t("header.description")}
      metrics={[
        {
          accent: "blue",
          icon: <ArrowLeftRight className="size-5" />,
          key: "pairs",
          label: t("summary.pairs"),
          value: String(latestRowsCount),
        },
        {
          accent: "gold",
          icon: <History className="size-5" />,
          key: "history",
          label: t("summary.history"),
          value: String(ratesCount),
        },
        {
          accent: "green",
          icon: <Clock3 className="size-5" />,
          key: "latest",
          label: t("summary.latestUpdated"),
          value: latestUpdatedAt
            ? formatDateTime(latestUpdatedAt, locale)
            : t("summary.noRecord"),
        },
      ]}
      title={t("header.title")}
    />
  );
});

export const ExchangeRatesLatestSection = memo(function ExchangeRatesLatestSection({
  filteredRowsCount,
  pagination,
  rows,
  totalLatestRows,
  totalRates,
}: ExchangeRatesLatestSectionProps) {
  const t = useTranslations("ExchangeRates");

  return (
    <DashboardListSection
      actions={
        <div className="rounded-full bg-[#f5f7f8] px-4 py-2 text-sm text-[#52616d]">
          {t("latest.countSummary", { count: totalLatestRows })}
        </div>
      }
      description={t("latest.description")}
      eyebrow={t("latest.eyebrow")}
      title={t("latest.title")}
    >
      {filteredRowsCount === 0 ? (
        <EmptyState
          description={
            totalRates === 0
              ? t("latest.emptyDescription")
              : t("latest.noMatchDescription")
          }
          icon={<ArrowLeftRight className="size-6" />}
          title={totalRates === 0 ? t("latest.emptyTitle") : t("latest.noMatchTitle")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <LatestRateCard
              key={row.pairKey}
              historyCountLabel={t("latest.card.historyCount", {
                count: row.historyCount,
              })}
              latestBadge={t("latest.card.latestBadge")}
              row={row}
            />
          ))}
        </div>
      )}

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
    </DashboardListSection>
  );
});

export const ExchangeRatesHistorySection = memo(function ExchangeRatesHistorySection({
  canManage,
  deletePendingId,
  filteredRowsCount,
  filters,
  hasActiveFilters,
  homeHref,
  onClearFilters,
  onDeleteRow,
  onEditRow,
  onOriginalCurrencyChange,
  onTargetCurrencyChange,
  pagination,
  rows,
  totalRates,
}: ExchangeRatesHistorySectionProps) {
  const t = useTranslations("ExchangeRates");
  const { locale } = useLocale();

  return (
    <DashboardSectionPanel className="p-4 sm:p-6 xl:p-8">
      <DashboardFilterPanel
        className="mb-5"
        gridClassName="lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <DashboardFilterField label={t("filters.originalCurrencyLabel")}>
          <input
            className={dashboardFilterInputClassName}
            onChange={(event) => onOriginalCurrencyChange(event.target.value)}
            placeholder={t("filters.originalCurrencyPlaceholder")}
            type="text"
            value={filters.originalCurrency}
          />
        </DashboardFilterField>

        <DashboardFilterField label={t("filters.targetCurrencyLabel")}>
          <input
            className={dashboardFilterInputClassName}
            onChange={(event) => onTargetCurrencyChange(event.target.value)}
            placeholder={t("filters.targetCurrencyPlaceholder")}
            type="text"
            value={filters.targetCurrency}
          />
        </DashboardFilterField>

        <div className="flex flex-col justify-end gap-3 lg:items-end">
          <p className="text-sm text-[#69747d]">
            {t("filters.resultSummary", {
              matched: filteredRowsCount,
              total: totalRates,
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

      <DashboardListHeader
        actions={
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#e1ddd7] bg-white px-4 text-sm font-medium text-[#31404b] transition-colors hover:bg-[#f4f6f8]"
            href={homeHref}
          >
            {t("history.backHome")}
          </Link>
        }
        className="mb-5"
        eyebrow={t("history.eyebrow")}
        title={t("history.title")}
      />

      {filteredRowsCount === 0 ? (
        <EmptyState
          description={
            totalRates === 0
              ? t("history.emptyDescription")
              : t("history.noMatchDescription")
          }
          icon={<History className="size-6" />}
          title={totalRates === 0 ? t("history.emptyTitle") : t("history.noMatchTitle")}
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
            <table className="min-w-[880px] w-full table-fixed border-collapse">
              <thead className="bg-[#f7f5f2]">
                <tr className="border-b border-[#efebe5]">
                  <HistoryHeaderCell>{t("history.columns.originalCurrency")}</HistoryHeaderCell>
                  <HistoryHeaderCell>{t("history.columns.targetCurrency")}</HistoryHeaderCell>
                  <HistoryHeaderCell>{t("history.columns.rate")}</HistoryHeaderCell>
                  <HistoryHeaderCell>{t("history.columns.updatedAt")}</HistoryHeaderCell>
                  {canManage ? (
                    <HistoryHeaderCell>{t("history.columns.actions")}</HistoryHeaderCell>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const deleting = deletePendingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[#efebe5] transition-colors hover:bg-[#fcfbf8] last:border-b-0"
                    >
                      <HistoryValueCell value={normalizeCurrencyCode(row.original_currency)} />
                      <HistoryValueCell value={normalizeCurrencyCode(row.target_currency)} />
                      <HistoryValueCell
                        value={formatExchangeRateValue(
                          row.daily_exchange_rate,
                          locale,
                          t("summary.noRecord"),
                        )}
                      />
                      <HistoryValueCell value={formatDateTime(row.created_at, locale)} />
                      {canManage ? (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              className="rounded-full"
                              onClick={() => onEditRow(row)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <PencilLine className="size-3.5" />
                              {t("actions.edit")}
                            </Button>
                            <Button
                              className="rounded-full text-[#b13d3d] hover:text-[#b13d3d]"
                              disabled={deleting}
                              onClick={() => onDeleteRow(row)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {deleting ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                              {t("actions.delete")}
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </DashboardTableFrame>
      )}
    </DashboardSectionPanel>
  );
});

function HistoryHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
      {children}
    </th>
  );
}

function HistoryValueCell({ value }: { value: ReactNode }) {
  return <td className="px-5 py-4 text-sm text-[#31404b]">{value}</td>;
}
