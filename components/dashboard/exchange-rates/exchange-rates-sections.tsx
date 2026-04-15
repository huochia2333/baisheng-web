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
import { DashboardDialog } from "../dashboard-dialog";
import { DashboardMetricCard } from "../dashboard-metric-card";
import { DashboardPaginationControls } from "../dashboard-pagination-controls";
import {
  EmptyState,
  PageBanner,
  formatDateTime,
  type NoticeTone,
} from "../dashboard-shared-ui";
import {
  formatExchangeRateValue,
  type ExchangeRateFormState,
} from "./exchange-rates-utils";

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

type ExchangeRateFormDialogProps = {
  feedback?: { tone: NoticeTone; message: string } | null;
  formState: ExchangeRateFormState;
  mode: "create" | "edit";
  open: boolean;
  pending: boolean;
  onFieldChange: <Key extends keyof ExchangeRateFormState>(
    key: Key,
    value: ExchangeRateFormState[Key],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
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
    <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
            {t("header.badge")}
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
            {t("header.title")}
          </h2>
          <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
            {t("header.description")}
          </p>
        </div>

        <div className="flex flex-col gap-4 xl:items-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DashboardMetricCard
              accent="blue"
              icon={<ArrowLeftRight className="size-5" />}
              label={t("summary.pairs")}
              value={String(latestRowsCount)}
            />
            <DashboardMetricCard
              accent="gold"
              icon={<History className="size-5" />}
              label={t("summary.history")}
              value={String(ratesCount)}
            />
            <DashboardMetricCard
              accent="green"
              icon={<Clock3 className="size-5" />}
              label={t("summary.latestUpdated")}
              value={
                latestUpdatedAt
                  ? formatDateTime(latestUpdatedAt, locale)
                  : t("summary.noRecord")
              }
            />
          </div>

          {canManage ? (
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              onClick={onCreate}
              type="button"
            >
              <Plus className="size-4" />
              {t("actions.create")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
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
  const { locale } = useLocale();

  return (
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
            {t("latest.eyebrow")}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
            {t("latest.title")}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#6a757e]">
            {t("latest.description")}
          </p>
        </div>

        <div className="rounded-full bg-[#f5f7f8] px-4 py-2 text-sm text-[#52616d]">
          {t("latest.countSummary", { count: totalLatestRows })}
        </div>
      </div>

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
              locale={locale}
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
    </section>
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
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
      <div className="mb-5 grid gap-4 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <FilterField label={t("filters.originalCurrencyLabel")}>
          <input
            className={filterInputClassName}
            onChange={(event) => onOriginalCurrencyChange(event.target.value)}
            placeholder={t("filters.originalCurrencyPlaceholder")}
            type="text"
            value={filters.originalCurrency}
          />
        </FilterField>

        <FilterField label={t("filters.targetCurrencyLabel")}>
          <input
            className={filterInputClassName}
            onChange={(event) => onTargetCurrencyChange(event.target.value)}
            placeholder={t("filters.targetCurrencyPlaceholder")}
            type="text"
            value={filters.targetCurrency}
          />
        </FilterField>

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
      </div>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
            {t("history.eyebrow")}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
            {t("history.title")}
          </h3>
        </div>

        <Link
          className="inline-flex h-9 items-center justify-center rounded-full border border-[#e1ddd7] bg-white px-4 text-sm font-medium text-[#31404b] transition-colors hover:bg-[#f4f6f8]"
          href={homeHref}
        >
          {t("history.backHome")}
        </Link>
      </div>

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
        <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
          <div className="overflow-x-auto">
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

export function ExchangeRateFormDialog({
  feedback,
  formState,
  mode,
  open,
  pending,
  onFieldChange,
  onOpenChange,
  onSubmit,
}: ExchangeRateFormDialogProps) {
  const t = useTranslations("ExchangeRates");

  return (
    <DashboardDialog
      actions={
        <>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("dialogs.cancel")}
          </Button>
          <Button
            className="bg-[#486782] text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <Plus className="size-4" />
            ) : (
              <PencilLine className="size-4" />
            )}
            {mode === "create"
              ? t("dialogs.create.submit")
              : t("dialogs.edit.submit")}
          </Button>
        </>
      }
      description={
        mode === "create"
          ? t("dialogs.create.description")
          : t("dialogs.edit.description")
      }
      onOpenChange={onOpenChange}
      open={open}
      title={mode === "create" ? t("dialogs.create.title") : t("dialogs.edit.title")}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
          <ExchangeRateField label={t("dialogs.fields.originalCurrency")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
              placeholder={t("dialogs.placeholders.originalCurrency")}
              type="text"
              value={formState.originalCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label={t("dialogs.fields.targetCurrency")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("targetCurrency", event.target.value)}
              placeholder={t("dialogs.placeholders.targetCurrency")}
              type="text"
              value={formState.targetCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label={t("dialogs.fields.dailyExchangeRate")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              min="0"
              onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
              placeholder={t("dialogs.placeholders.dailyExchangeRate")}
              step="0.000001"
              type="number"
              value={formState.dailyExchangeRate}
            />
          </ExchangeRateField>

          <div className="rounded-[22px] border border-[#ebe7e1] bg-[#f8f6f3] px-4 py-4 text-sm leading-7 text-[#65717b]">
            {t("dialogs.currencyHint")}
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
}

function LatestRateCard({
  historyCountLabel,
  latestBadge,
  locale,
  row,
}: {
  historyCountLabel: string;
  latestBadge: string;
  locale: "zh" | "en";
  row: ExchangeRateLatestRow;
}) {
  const t = useTranslations("ExchangeRates");

  return (
    <article className="rounded-[24px] border border-[#e7e3dc] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
            {t("latest.card.eyebrow")}
          </p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
            {row.pairLabel}
          </h4>
        </div>
        <span className="rounded-full bg-[#edf2f5] px-3 py-1 text-xs font-semibold text-[#486782]">
          {latestBadge}
        </span>
      </div>

      <div className="mt-6 rounded-[20px] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(231,227,220,0.9)]">
        <p className="text-sm text-[#6b7680]">{t("latest.card.currentRate")}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a32]">
          {formatExchangeRateValue(
            row.daily_exchange_rate,
            locale,
            t("summary.noRecord"),
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#6a757e]">
        <span>{historyCountLabel}</span>
        <span>{formatDateTime(row.created_at, locale)}</span>
      </div>
    </article>
  );
}

function FilterField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">{label}</span>
      {children}
    </label>
  );
}

function ExchangeRateField({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">
        {label}
        {required ? <span className="ml-1 text-[#c94d4d]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

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

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";
