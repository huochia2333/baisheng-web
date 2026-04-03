"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Clock3,
  History,
  LoaderCircle,
  PencilLine,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import {
  buildExchangeRateLatestRows,
  canManageExchangeRatesByRole,
  canReadExchangeRatesByRole,
  createExchangeRate,
  deleteExchangeRate,
  getCurrentExchangeRateViewerContext,
  getExchangeRatePairLabel,
  getExchangeRates,
  normalizeCurrencyCode,
  sortExchangeRateRows,
  updateExchangeRate,
  type ExchangeRateLatestRow,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { DashboardDialog } from "./dashboard-dialog";
import {
  EmptyState,
  PageBanner,
  formatDateTime,
  type NoticeTone,
} from "./dashboard-shared-ui";
import {
  createExchangeRateFormState,
  createExchangeRateFormStateFromRow,
  formatExchangeRateValue,
  parseExchangeRateForm,
  toExchangeRateErrorMessage,
  type ExchangeRateFormState,
} from "./exchange-rates/exchange-rates-utils";

type ExchangeRatesClientProps = {
  homeHref: string;
  mode: "manage" | "readonly";
};

type FilterState = {
  originalCurrency: string;
  targetCurrency: string;
};

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function ExchangeRatesClient({
  homeHref,
  mode,
}: ExchangeRatesClientProps) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
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

  const loadingStateRef = useRef(true);
  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadExchangeRates = useCallback(
    async ({
      isMounted,
      showLoading,
    }: {
      isMounted: () => boolean;
      showLoading: boolean;
    }) => {
      if (!supabase) {
        return;
      }

      if (showLoading && isMounted()) {
        setLoading(true);
      }

      try {
        if (shouldRecoverBrowserCloudSyncState()) {
          recoverCloudSync();
          return;
        }

        const viewer = await getCurrentExchangeRateViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        const nextCanRead = canReadExchangeRatesByRole(viewer.role, viewer.status);
        const nextCanManage = canManageExchangeRatesByRole(viewer.role);
        const nextHasPermission = mode === "manage" ? nextCanManage : nextCanRead;

        setHasPermission(nextHasPermission);

        if (!nextHasPermission) {
          setRates([]);
          setPageFeedback(null);
          return;
        }

        const nextRates = await getExchangeRates(supabase);

        if (!isMounted()) {
          return;
        }

        setRates(nextRates);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        const message = toExchangeRateErrorMessage(error);

        if (isPermissionMessage(message)) {
          setHasPermission(false);
          setRates([]);
          setPageFeedback(null);
          return;
        }

        setPageFeedback({
          tone: "error",
          message,
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [mode, recoverCloudSync, router, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadExchangeRates({
        isMounted,
        showLoading: loadingStateRef.current,
      }),
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await loadExchangeRates({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const canManage = mode === "manage" && hasPermission === true;
  const latestRows = useMemo(() => buildExchangeRateLatestRows(rates), [rates]);

  const normalizedFilters = useMemo(
    () => ({
      originalCurrency: normalizeSearchText(filters.originalCurrency),
      targetCurrency: normalizeSearchText(filters.targetCurrency),
    }),
    [filters.originalCurrency, filters.targetCurrency],
  );

  const filteredLatestRows = useMemo(() => {
    return latestRows.filter((row) => {
      const originalCurrency = normalizeSearchText(row.original_currency);
      const targetCurrency = normalizeSearchText(row.target_currency);

      return (
        originalCurrency.includes(normalizedFilters.originalCurrency) &&
        targetCurrency.includes(normalizedFilters.targetCurrency)
      );
    });
  }, [latestRows, normalizedFilters.originalCurrency, normalizedFilters.targetCurrency]);

  const filteredHistoryRows = useMemo(() => {
    return rates.filter((row) => {
      const originalCurrency = normalizeSearchText(row.original_currency);
      const targetCurrency = normalizeSearchText(row.target_currency);

      return (
        originalCurrency.includes(normalizedFilters.originalCurrency) &&
        targetCurrency.includes(normalizedFilters.targetCurrency)
      );
    });
  }, [normalizedFilters.originalCurrency, normalizedFilters.targetCurrency, rates]);

  const hasActiveFilters = Boolean(filters.originalCurrency || filters.targetCurrency);
  const latestUpdatedAt = rates[0]?.created_at ?? null;

  const openCreateDialog = () => {
    if (!canManage) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(createExchangeRateFormState());
    setCreateDialogOpen(true);
  };

  const openEditDialog = (row: ExchangeRateRow) => {
    if (!canManage) {
      return;
    }

    setPageFeedback(null);
    setEditDialogFeedback(null);
    setEditingRate(row);
    setEditFormState(createExchangeRateFormStateFromRow(row));
    setEditDialogOpen(true);
  };

  const updateCreateFormField = <Key extends keyof ExchangeRateFormState>(
    key: Key,
    value: ExchangeRateFormState[Key],
  ) => {
    setCreateDialogFeedback(null);
    setCreateFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateEditFormField = <Key extends keyof ExchangeRateFormState>(
    key: Key,
    value: ExchangeRateFormState[Key],
  ) => {
    setEditDialogFeedback(null);
    setEditFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCreateRate = async () => {
    if (!supabase || !canManage || createPending) {
      return;
    }

    const parsed = parseExchangeRateForm(createFormState);

    if (!parsed.ok) {
      setCreateDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);
    setPageFeedback(null);

    try {
      const createdRate = await createExchangeRate(supabase, parsed.payload);
      markBrowserCloudSyncActivity();
      setRates((current) => [createdRate, ...current]);
      setCreateDialogOpen(false);
      setCreateFormState(createExchangeRateFormState());
      setPageFeedback({
        tone: "success",
        message: `汇率 ${getExchangeRatePairLabel(
          createdRate.original_currency,
          createdRate.target_currency,
        )} 已新增。`,
      });
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toExchangeRateErrorMessage(error),
      });
    } finally {
      setCreatePending(false);
    }
  };

  const handleEditRate = async () => {
    if (!supabase || !canManage || editPending || !editingRate) {
      return;
    }

    const parsed = parseExchangeRateForm(editFormState);

    if (!parsed.ok) {
      setEditDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setEditPending(true);
    setEditDialogFeedback(null);
    setPageFeedback(null);

    try {
      const updatedRate = await updateExchangeRate(supabase, editingRate.id, parsed.payload);
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
        message: `汇率 ${getExchangeRatePairLabel(
          updatedRate.original_currency,
          updatedRate.target_currency,
        )} 已更新。`,
      });
    } catch (error) {
      setEditDialogFeedback({
        tone: "error",
        message: toExchangeRateErrorMessage(error),
      });
    } finally {
      setEditPending(false);
    }
  };

  const handleDeleteRate = async (row: ExchangeRateRow) => {
    if (!supabase || !canManage || deletePendingId) {
      return;
    }

    const pairLabel = getExchangeRatePairLabel(row.original_currency, row.target_currency);

    if (
      typeof window !== "undefined" &&
      !window.confirm(`确定要删除 ${pairLabel} 的这条汇率记录吗？删除后无法恢复。`)
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
        message: `汇率 ${pairLabel} 已删除。`,
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toExchangeRateErrorMessage(error),
      });
    } finally {
      setDeletePendingId(null);
    }
  };

  if (!supabase || loading) {
    return <ExchangeRatesLoadingState />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              汇率工作台
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              汇率中心
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              统一查看当前生效汇率与历史记录，便于订单与财务模块引用同一份汇率基线。
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:items-end">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryMetricCard
                accent="blue"
                icon={<ArrowLeftRight className="size-5" />}
                label="币种对数"
                value={String(latestRows.length)}
              />
              <SummaryMetricCard
                accent="gold"
                icon={<History className="size-5" />}
                label="历史记录"
                value={String(rates.length)}
              />
              <SummaryMetricCard
                accent="green"
                icon={<Clock3 className="size-5" />}
                label="最近更新"
                value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : "暂无记录"}
              />
            </div>

            {canManage ? (
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                onClick={openCreateDialog}
                type="button"
              >
                <Plus className="size-4" />
                新增汇率
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={
              mode === "manage"
                ? "当前登录账号不是管理员，暂时无法管理汇率记录。"
                : "当前登录账号暂时无法查看汇率记录。"
            }
            icon={<ShieldAlert className="size-6" />}
            title={mode === "manage" ? "暂无管理权限" : "暂无查看权限"}
          />
        </section>
      ) : (
        <>
          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
                  Current Snapshot
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
                  最新汇率
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#6a757e]">
                  每个币种对仅保留一条当前生效值，按最新更新时间自动归并。
                </p>
              </div>

              <div className="rounded-full bg-[#f5f7f8] px-4 py-2 text-sm text-[#52616d]">
                共 {latestRows.length} 个币种对
              </div>
            </div>

            {filteredLatestRows.length === 0 ? (
              <EmptyState
                description={
                  rates.length === 0
                    ? "当前还没有任何汇率记录，新增后会先出现在这里。"
                    : "没有找到符合当前筛选条件的最新汇率。"
                }
                icon={<ArrowLeftRight className="size-6" />}
                title={rates.length === 0 ? "汇率列表暂时为空" : "没有匹配结果"}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLatestRows.map((row) => (
                  <LatestRateCard key={row.pairKey} row={row} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
            <div className="mb-5 grid gap-4 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <FilterField label="原始货币">
                <input
                  className={filterInputClassName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      originalCurrency: event.target.value,
                    }))
                  }
                  placeholder="输入 USD、EUR 等"
                  type="text"
                  value={filters.originalCurrency}
                />
              </FilterField>

              <FilterField label="目标货币">
                <input
                  className={filterInputClassName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      targetCurrency: event.target.value,
                    }))
                  }
                  placeholder="输入 CNY、USDT 等"
                  type="text"
                  value={filters.targetCurrency}
                />
              </FilterField>

              <div className="flex flex-col justify-end gap-3 lg:items-end">
                <p className="text-sm text-[#69747d]">
                  共 {rates.length} 条，匹配 {filteredHistoryRows.length} 条
                </p>
                <Button
                  disabled={!hasActiveFilters}
                  onClick={() =>
                    setFilters({
                      originalCurrency: "",
                      targetCurrency: "",
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  清空筛选
                </Button>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
                  History
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
                  历史记录
                </h3>
              </div>

              <Link
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#e1ddd7] bg-white px-4 text-sm font-medium text-[#31404b] transition-colors hover:bg-[#f4f6f8]"
                href={homeHref}
              >
                返回我的页
              </Link>
            </div>

            {filteredHistoryRows.length === 0 ? (
              <EmptyState
                description={
                  rates.length === 0
                    ? "当前还没有历史汇率记录，后续新增后会按时间倒序展示。"
                    : "没有找到符合当前筛选条件的历史记录。"
                }
                icon={<History className="size-6" />}
                title={rates.length === 0 ? "历史记录暂时为空" : "没有匹配结果"}
              />
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
                <div className="overflow-x-auto">
                  <table className="min-w-[880px] w-full table-fixed border-collapse">
                    <thead className="bg-[#f7f5f2]">
                      <tr className="border-b border-[#efebe5]">
                        <HistoryHeaderCell>原始货币</HistoryHeaderCell>
                        <HistoryHeaderCell>目标货币</HistoryHeaderCell>
                        <HistoryHeaderCell>汇率值</HistoryHeaderCell>
                        <HistoryHeaderCell>更新时间</HistoryHeaderCell>
                        {canManage ? <HistoryHeaderCell>操作</HistoryHeaderCell> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryRows.map((row) => {
                        const deleting = deletePendingId === row.id;

                        return (
                          <tr
                            key={row.id}
                            className="border-b border-[#efebe5] transition-colors hover:bg-[#fcfbf8] last:border-b-0"
                          >
                            <HistoryValueCell value={normalizeCurrencyCode(row.original_currency)} />
                            <HistoryValueCell value={normalizeCurrencyCode(row.target_currency)} />
                            <HistoryValueCell value={formatExchangeRateValue(row.daily_exchange_rate)} />
                            <HistoryValueCell value={formatDateTime(row.created_at)} />
                            {canManage ? (
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    className="rounded-full"
                                    onClick={() => openEditDialog(row)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <PencilLine className="size-3.5" />
                                    编辑
                                  </Button>
                                  <Button
                                    className="rounded-full text-[#b13d3d] hover:text-[#b13d3d]"
                                    disabled={deleting}
                                    onClick={() => void handleDeleteRate(row)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    {deleting ? (
                                      <LoaderCircle className="size-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-3.5" />
                                    )}
                                    删除
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
              </div>
            )}
          </section>
        </>
      )}

      <ExchangeRateFormDialog
        description="新增后会立即写入历史记录，并自动刷新对应币种对的最新汇率。"
        feedback={createDialogFeedback}
        formState={createFormState}
        open={createDialogOpen}
        pending={createPending}
        submitLabel="新增汇率"
        title="新增汇率"
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
        description="保存后会直接覆盖当前这条历史记录，并同步更新最新汇率归并结果。"
        feedback={editDialogFeedback}
        formState={editFormState}
        open={editDialogOpen}
        pending={editPending}
        submitLabel="保存修改"
        title="编辑汇率"
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

function ExchangeRatesLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载汇率数据...
      </div>
    </div>
  );
}

function SummaryMetricCard({
  accent,
  icon,
  label,
  value,
}: {
  accent: "blue" | "green" | "gold";
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" && "border-[#d9e3eb] bg-[#f4f8fb]",
        accent === "green" && "border-[#dce8df] bg-[#f2f7f3]",
        accent === "gold" && "border-[#eadfbf] bg-[#fbf5e8]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" && "bg-[#486782]",
            accent === "green" && "bg-[#4c7259]",
            accent === "gold" && "bg-[#b7892f]",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight text-[#23313a]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function LatestRateCard({ row }: { row: ExchangeRateLatestRow }) {
  return (
    <article className="rounded-[24px] border border-[#e7e3dc] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
            Currency Pair
          </p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
            {row.pairLabel}
          </h4>
        </div>
        <span className="rounded-full bg-[#edf2f5] px-3 py-1 text-xs font-semibold text-[#486782]">
          最新
        </span>
      </div>

      <div className="mt-6 rounded-[20px] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(231,227,220,0.9)]">
        <p className="text-sm text-[#6b7680]">当前汇率</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a32]">
          {formatExchangeRateValue(row.daily_exchange_rate)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#6a757e]">
        <span>历史记录 {row.historyCount} 条</span>
        <span>{formatDateTime(row.created_at)}</span>
      </div>
    </article>
  );
}

function FilterField({
  label,
  children,
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

function ExchangeRateFormDialog({
  description,
  feedback,
  formState,
  open,
  pending,
  submitLabel,
  title,
  onFieldChange,
  onOpenChange,
  onSubmit,
}: {
  description: string;
  feedback?: PageFeedback;
  formState: ExchangeRateFormState;
  open: boolean;
  pending: boolean;
  submitLabel: string;
  title: string;
  onFieldChange: <Key extends keyof ExchangeRateFormState>(
    key: Key,
    value: ExchangeRateFormState[Key],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <DashboardDialog
      actions={
        <>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button
            className="bg-[#486782] text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <PencilLine className="size-4" />
            )}
            {submitLabel}
          </Button>
        </>
      }
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
          <ExchangeRateField label="原始货币" required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
              placeholder="例如 USD"
              type="text"
              value={formState.originalCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label="目标货币" required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("targetCurrency", event.target.value)}
              placeholder="例如 CNY"
              type="text"
              value={formState.targetCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label="汇率值" required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              min="0"
              onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
              placeholder="请输入汇率值"
              step="0.000001"
              type="number"
              value={formState.dailyExchangeRate}
            />
          </ExchangeRateField>

          <div className="rounded-[22px] border border-[#ebe7e1] bg-[#f8f6f3] px-4 py-4 text-sm leading-7 text-[#65717b]">
            货币代码会在保存时自动转成大写，例如 `usd` 会保存为 `USD`。
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
}

function ExchangeRateField({
  label,
  required = false,
  children,
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

function normalizeSearchText(value: string | null | undefined) {
  return normalizeCurrencyCode(value).toLowerCase();
}

function isPermissionMessage(message: string) {
  return message.includes("没有查看或操作汇率数据的权限");
}

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";
