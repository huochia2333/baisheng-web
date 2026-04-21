"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";

import {
  markBrowserCloudSyncActivity,
} from "@/lib/browser-sync-recovery";
import {
  buildExchangeRateLatestRows,
  createExchangeRate,
  deleteExchangeRate,
  getExchangeRatesPageData,
  getExchangeRatePairLabel,
  normalizeCurrencyCode,
  sortExchangeRateRows,
  type ExchangeRatesPageData,
  updateExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";

import {
  EmptyState,
  PageBanner,
  normalizeSearchText,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  ExchangeRateFormDialog,
  ExchangeRatesHeaderSection,
  ExchangeRatesHistorySection,
  ExchangeRatesLatestSection,
} from "./exchange-rates/exchange-rates-sections";
import {
  createExchangeRateCopy,
  createExchangeRateFormState,
  createExchangeRateFormStateFromRow,
  isExchangeRatePermissionMessage,
  parseExchangeRateForm,
  toExchangeRateErrorMessage,
  type ExchangeRateFormState,
} from "./exchange-rates/exchange-rates-utils";
import { useWorkspaceSyncEffect } from "./workspace-session-provider";

type ExchangeRatesClientProps = {
  homeHref: string;
  initialData: ExchangeRatesPageData;
  mode: "manage" | "readonly";
};

type FilterState = {
  originalCurrency: string;
  targetCurrency: string;
};

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function ExchangeRatesClient({
  homeHref,
  initialData,
  mode,
}: ExchangeRatesClientProps) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("ExchangeRates");
  const exchangeRateCopy = useMemo(() => createExchangeRateCopy(t), [t]);

  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [rates, setRates] = useState<ExchangeRateRow[]>(initialData.rates);
  const [filters, setFilters] = useState<FilterState>({
    originalCurrency: "",
    targetCurrency: "",
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] = useState<PageFeedback>(null);
  const [createFormState, setCreateFormState] = useState<ExchangeRateFormState>(() =>
    createExchangeRateFormState(),
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editDialogFeedback, setEditDialogFeedback] = useState<PageFeedback>(null);
  const [editFormState, setEditFormState] = useState<ExchangeRateFormState>(() =>
    createExchangeRateFormState(),
  );
  const [editingRate, setEditingRate] = useState<ExchangeRateRow | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const applyPageData = useCallback((pageData: ExchangeRatesPageData) => {
    setHasPermission(pageData.hasPermission);
    setRates(pageData.rates);
  }, []);

  useEffect(() => {
    applyPageData(initialData);
  }, [applyPageData, initialData]);

  const refreshExchangeRates = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getExchangeRatesPageData(supabase, mode);

        if (!isMounted()) {
          return;
        }

        applyPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        const message = toExchangeRateErrorMessage(error, exchangeRateCopy);

        if (isExchangeRatePermissionMessage(message, exchangeRateCopy.errors.permission)) {
          setHasPermission(false);
          setRates([]);
          setPageFeedback(null);
          return;
        }

        setPageFeedback({
          tone: "error",
          message,
        });
      }
    },
    [applyPageData, exchangeRateCopy, mode, supabase],
  );

  useWorkspaceSyncEffect(refreshExchangeRates);

  const canManage = mode === "manage" && hasPermission === true;
  const latestRows = useMemo(() => buildExchangeRateLatestRows(rates), [rates]);

  const normalizedFilters = useMemo(
    () => ({
      originalCurrency: normalizeSearchText(normalizeCurrencyCode(filters.originalCurrency)),
      targetCurrency: normalizeSearchText(normalizeCurrencyCode(filters.targetCurrency)),
    }),
    [filters.originalCurrency, filters.targetCurrency],
  );

  const filteredLatestRows = useMemo(() => {
    return latestRows.filter((row) => {
      const originalCurrency = normalizeSearchText(normalizeCurrencyCode(row.original_currency));
      const targetCurrency = normalizeSearchText(normalizeCurrencyCode(row.target_currency));

      return (
        originalCurrency.includes(normalizedFilters.originalCurrency) &&
        targetCurrency.includes(normalizedFilters.targetCurrency)
      );
    });
  }, [latestRows, normalizedFilters.originalCurrency, normalizedFilters.targetCurrency]);

  const filteredHistoryRows = useMemo(() => {
    return rates.filter((row) => {
      const originalCurrency = normalizeSearchText(normalizeCurrencyCode(row.original_currency));
      const targetCurrency = normalizeSearchText(normalizeCurrencyCode(row.target_currency));

      return (
        originalCurrency.includes(normalizedFilters.originalCurrency) &&
        targetCurrency.includes(normalizedFilters.targetCurrency)
      );
    });
  }, [normalizedFilters.originalCurrency, normalizedFilters.targetCurrency, rates]);

  const latestPagination = useDashboardPagination(filteredLatestRows);
  const historyPagination = useDashboardPagination(filteredHistoryRows);

  const latestPaginationState = useMemo(
    () => ({
      endIndex: latestPagination.endIndex,
      hasNextPage: latestPagination.hasNextPage,
      hasPreviousPage: latestPagination.hasPreviousPage,
      onNextPage: latestPagination.goToNextPage,
      onPreviousPage: latestPagination.goToPreviousPage,
      page: latestPagination.page,
      pageCount: latestPagination.pageCount,
      startIndex: latestPagination.startIndex,
      totalItems: latestPagination.totalItems,
    }),
    [
      latestPagination.endIndex,
      latestPagination.goToNextPage,
      latestPagination.goToPreviousPage,
      latestPagination.hasNextPage,
      latestPagination.hasPreviousPage,
      latestPagination.page,
      latestPagination.pageCount,
      latestPagination.startIndex,
      latestPagination.totalItems,
    ],
  );

  const historyPaginationState = useMemo(
    () => ({
      endIndex: historyPagination.endIndex,
      hasNextPage: historyPagination.hasNextPage,
      hasPreviousPage: historyPagination.hasPreviousPage,
      onNextPage: historyPagination.goToNextPage,
      onPreviousPage: historyPagination.goToPreviousPage,
      page: historyPagination.page,
      pageCount: historyPagination.pageCount,
      startIndex: historyPagination.startIndex,
      totalItems: historyPagination.totalItems,
    }),
    [
      historyPagination.endIndex,
      historyPagination.goToNextPage,
      historyPagination.goToPreviousPage,
      historyPagination.hasNextPage,
      historyPagination.hasPreviousPage,
      historyPagination.page,
      historyPagination.pageCount,
      historyPagination.startIndex,
      historyPagination.totalItems,
    ],
  );

  const hasActiveFilters = Boolean(filters.originalCurrency || filters.targetCurrency);
  const latestUpdatedAt = rates[0]?.created_at ?? null;

  const openCreateDialog = useCallback(() => {
    if (!canManage) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(createExchangeRateFormState());
    setCreateDialogOpen(true);
  }, [canManage]);

  const openEditDialog = useCallback(
    (row: ExchangeRateRow) => {
      if (!canManage) {
        return;
      }

      setPageFeedback(null);
      setEditDialogFeedback(null);
      setEditingRate(row);
      setEditFormState(createExchangeRateFormStateFromRow(row));
      setEditDialogOpen(true);
    },
    [canManage],
  );

  const updateCreateFormField = useCallback(
    <Key extends keyof ExchangeRateFormState>(
      key: Key,
      value: ExchangeRateFormState[Key],
    ) => {
      setCreateDialogFeedback(null);
      setCreateFormState((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const updateEditFormField = useCallback(
    <Key extends keyof ExchangeRateFormState>(
      key: Key,
      value: ExchangeRateFormState[Key],
    ) => {
      setEditDialogFeedback(null);
      setEditFormState((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const handleOriginalCurrencyChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      originalCurrency: value,
    }));
  }, []);

  const handleTargetCurrencyChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      targetCurrency: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      originalCurrency: "",
      targetCurrency: "",
    });
  }, []);

  const handleCreateRate = useCallback(async () => {
    if (!supabase || !canManage || createPending) {
      return;
    }

    const parsed = parseExchangeRateForm(createFormState, exchangeRateCopy);

    if (!parsed.ok) {
      setCreateDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);
    setPageFeedback(null);

    try {
      const createdRate = await createExchangeRate(supabase, parsed.payload);
      const pairLabel = getExchangeRatePairLabel(
        createdRate.original_currency,
        createdRate.target_currency,
      );
      markBrowserCloudSyncActivity();
      setRates((current) => [createdRate, ...current]);
      setCreateDialogOpen(false);
      setCreateFormState(createExchangeRateFormState());
      setPageFeedback({
        tone: "success",
        message: t("feedback.created", { pairLabel }),
      });
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toExchangeRateErrorMessage(error, exchangeRateCopy),
      });
    } finally {
      setCreatePending(false);
    }
  }, [canManage, createFormState, createPending, exchangeRateCopy, supabase, t]);

  const handleEditRate = useCallback(async () => {
    if (!supabase || !canManage || editPending || !editingRate) {
      return;
    }

    const parsed = parseExchangeRateForm(editFormState, exchangeRateCopy);

    if (!parsed.ok) {
      setEditDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setEditPending(true);
    setEditDialogFeedback(null);
    setPageFeedback(null);

    try {
      const updatedRate = await updateExchangeRate(supabase, editingRate.id, parsed.payload);
      const pairLabel = getExchangeRatePairLabel(
        updatedRate.original_currency,
        updatedRate.target_currency,
      );
      markBrowserCloudSyncActivity();
      setRates((current) =>
        sortExchangeRateRows(
          current.map((row) => (row.id === updatedRate.id ? updatedRate : row)),
        ),
      );
      setEditDialogOpen(false);
      setEditingRate(null);
      setPageFeedback({
        tone: "success",
        message: t("feedback.updated", { pairLabel }),
      });
    } catch (error) {
      setEditDialogFeedback({
        tone: "error",
        message: toExchangeRateErrorMessage(error, exchangeRateCopy),
      });
    } finally {
      setEditPending(false);
    }
  }, [canManage, editFormState, editPending, editingRate, exchangeRateCopy, supabase, t]);

  const handleDeleteRate = useCallback(
    async (row: ExchangeRateRow) => {
      if (!supabase || !canManage || deletePendingId) {
        return;
      }

      const pairLabel = getExchangeRatePairLabel(row.original_currency, row.target_currency);

      if (
        typeof window !== "undefined" &&
        !window.confirm(t("feedback.deleteConfirm", { pairLabel }))
      ) {
        return;
      }

      setDeletePendingId(row.id);
      setPageFeedback(null);

      try {
        await deleteExchangeRate(supabase, row.id);
        markBrowserCloudSyncActivity();
        setRates((current) => current.filter((item) => item.id !== row.id));
        setPageFeedback({
          tone: "success",
          message: t("feedback.deleted", { pairLabel }),
        });
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toExchangeRateErrorMessage(error, exchangeRateCopy),
        });
      } finally {
        setDeletePendingId(null);
      }
    },
    [canManage, deletePendingId, exchangeRateCopy, supabase, t],
  );
  const handleDeleteRow = useCallback(
    (row: ExchangeRateRow) => {
      void handleDeleteRate(row);
    },
    [handleDeleteRate],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <ExchangeRatesHeaderSection
        canManage={canManage}
        latestRowsCount={latestRows.length}
        latestUpdatedAt={latestUpdatedAt}
        onCreate={openCreateDialog}
        ratesCount={rates.length}
      />

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={
              mode === "manage"
                ? t("states.noManageDescription")
                : t("states.noViewDescription")
            }
            icon={<ShieldAlert className="size-6" />}
            title={mode === "manage" ? t("states.noManageTitle") : t("states.noViewTitle")}
          />
        </section>
      ) : (
        <>
          <ExchangeRatesLatestSection
            filteredRowsCount={filteredLatestRows.length}
            pagination={latestPaginationState}
            rows={latestPagination.items}
            totalLatestRows={latestRows.length}
            totalRates={rates.length}
          />

          <ExchangeRatesHistorySection
            canManage={canManage}
            deletePendingId={deletePendingId}
            filteredRowsCount={filteredHistoryRows.length}
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            homeHref={homeHref}
            onClearFilters={clearFilters}
            onDeleteRow={handleDeleteRow}
            onEditRow={openEditDialog}
            onOriginalCurrencyChange={handleOriginalCurrencyChange}
            onTargetCurrencyChange={handleTargetCurrencyChange}
            pagination={historyPaginationState}
            rows={historyPagination.items}
            totalRates={rates.length}
          />
        </>
      )}

      <ExchangeRateFormDialog
        feedback={createDialogFeedback}
        formState={createFormState}
        mode="create"
        open={createDialogOpen}
        pending={createPending}
        onFieldChange={updateCreateFormField}
        onOpenChange={(open) => {
          if (!open && createPending) {
            return;
          }

          if (!open) {
            setCreateDialogFeedback(null);
          }

          setCreateDialogOpen(open);
        }}
        onSubmit={handleCreateRate}
      />

      <ExchangeRateFormDialog
        feedback={editDialogFeedback}
        formState={editFormState}
        mode="edit"
        open={editDialogOpen}
        pending={editPending}
        onFieldChange={updateEditFormField}
        onOpenChange={(open) => {
          if (!open && editPending) {
            return;
          }

          if (!open) {
            setEditingRate(null);
            setEditDialogFeedback(null);
          }

          setEditDialogOpen(open);
        }}
        onSubmit={handleEditRate}
      />
    </section>
  );
}
