"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Coins, ReceiptText, ShieldAlert, WalletCards } from "lucide-react";

import { canViewSalesmanCommissionBoard, getCurrentSalesmanCommissionViewerContext, getVisibleSalesmanCommissions } from "@/lib/salesman-commission";
import { shouldRecoverBrowserCloudSyncState } from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useBrowserCloudSyncRecovery } from "@/lib/use-browser-cloud-sync-recovery";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AdminCommissionRow, CommissionSettlementStatus } from "@/lib/admin-commission";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";

import { formatCommissionMoney, getCommissionCategoryLabel, getCommissionOrderStatusLabel, getCommissionOriginText, getCommissionSettlementStatusLabel, toCommissionErrorMessage } from "./commission-copy";
import { DashboardCenteredLoadingState } from "./dashboard-centered-loading-state";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardPaginationControls } from "./dashboard-pagination-controls";
import { EmptyState, PageBanner, formatDateTime, type NoticeTone } from "./dashboard-shared-ui";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function SalesmanCommissionClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Commission");
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const { recoverCloudSync, syncGeneration } = useBrowserCloudSyncRecovery();
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>([]);
  const loadingStateRef = useRef(true);
  loadingStateRef.current = loading;

  const loadCommissionBoard = useCallback(async ({ isMounted, showLoading }: { isMounted: () => boolean; showLoading: boolean }) => {
    if (!supabase) return;
    if (showLoading && isMounted()) setLoading(true);
    try {
      if (shouldRecoverBrowserCloudSyncState()) { recoverCloudSync(); return; }
      const viewer = await getCurrentSalesmanCommissionViewerContext(supabase);
      if (!isMounted()) return;
      if (!viewer) { router.replace("/login"); return; }
      setViewerRole(viewer.role);
      setViewerStatus(viewer.status);
      if (!canViewSalesmanCommissionBoard(viewer.role, viewer.status)) { setCommissions([]); setPageFeedback(null); return; }
      const nextCommissions = await getVisibleSalesmanCommissions(supabase, viewer);
      if (!isMounted()) return;
      setCommissions(nextCommissions);
      setPageFeedback(null);
    } catch (error) {
      if (!isMounted()) return;
      setPageFeedback({ tone: "error", message: toCommissionErrorMessage(error, t, "salesman") });
    } finally {
      if (showLoading && isMounted()) setLoading(false);
    }
  }, [recoverCloudSync, router, supabase, t]);

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) => loadCommissionBoard({ isMounted, showLoading: loadingStateRef.current }),
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) return;
      if (!session?.user) { router.replace("/login"); return; }
      await loadCommissionBoard({ isMounted, showLoading: false });
    },
  });
  useResumeRecovery(recoverCloudSync, { enabled: Boolean(supabase) });

  const hasPermission = canViewSalesmanCommissionBoard(viewerRole, viewerStatus);
  const commissionsPagination = useDashboardPagination(commissions);
  const summary = useMemo(() => ({
    totalAmount: commissions.reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    pendingAmount: commissions.filter((commission) => commission.settlementStatus === "pending").reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    paidAmount: commissions.filter((commission) => commission.settlementStatus === "paid").reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
  }), [commissions]);

  if (!supabase || loading) {
    return <DashboardCenteredLoadingState message={t("salesman.loading")} />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner> : null}
      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">{t("salesman.header.badge")}</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">{t("salesman.header.title")}</h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{t("salesman.header.description")}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <DashboardMetricCard accent="blue" icon={<WalletCards className="size-5" />} label={t("salesman.summary.totalAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.totalAmount, locale)} />
            <DashboardMetricCard accent="gold" icon={<Coins className="size-5" />} label={t("salesman.summary.pendingAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.pendingAmount, locale)} />
            <DashboardMetricCard accent="green" icon={<BadgeDollarSign className="size-5" />} label={t("salesman.summary.paidAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.paidAmount, locale)} />
          </div>
        </div>
      </section>
      {!hasPermission ? <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8"><EmptyState description={t("salesman.states.noPermissionDescription")} icon={<ShieldAlert className="size-6" />} title={t("salesman.states.noPermissionTitle")} /></section> : commissions.length === 0 ? <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8"><EmptyState description={t("salesman.states.emptyDescription")} icon={<ReceiptText className="size-6" />} title={t("salesman.states.emptyTitle")} /></section> : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">{t("salesman.table.title")}</h3>
              <p className="mt-2 text-sm leading-7 text-[#67727b]">{t("salesman.table.description")}</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                  <th className="px-4 py-3">{t("salesman.table.columns.origin")}</th>
                  <th className="px-4 py-3">{t("salesman.table.columns.orderCustomer")}</th>
                  <th className="px-4 py-3">{t("salesman.table.columns.category")}</th>
                  <th className="px-4 py-3">{t("salesman.table.columns.amount")}</th>
                  <th className="px-4 py-3">{t("salesman.table.columns.settlement")}</th>
                  <th className="px-4 py-3">{t("salesman.table.columns.time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efebe5]">
                {commissionsPagination.items.map((commission) => (
                  <tr key={commission.id} className="align-top transition-colors hover:bg-[#f7f7f5]">
                    <td className="px-4 py-4">
                      <div className="max-w-sm text-sm leading-7 text-[#22313a]">{getCommissionOriginText(commission, t)}</div>
                      {commission.settlementNote ? <p className="mt-2 max-w-sm text-xs leading-6 text-[#79848d]">{t("shared.note", { note: commission.settlementNote })}</p> : null}
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine label={t("shared.fields.orderNumber")} value={commission.orderNumber} />
                      <DetailLine label={t("shared.fields.customer")} value={commission.sourceCustomer?.label ?? t("shared.fallback.none")} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#22313a]">{getCommissionCategoryLabel(commission.category, t)}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InlineChip tone="blue">{getCommissionOrderStatusLabel(commission.orderStatus, t)}</InlineChip>
                        {commission.isOrderDeleted ? <InlineChip tone="gold">{t("shared.deletedOrder")}</InlineChip> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#22313a]">{formatCommissionMoney(commission.commissionAmountRmb, locale)}</div>
                      <div className="mt-2 text-xs leading-6 text-[#79848d]">{t("salesman.table.amountHint", { amount: formatCommissionMoney(commission.orderAmountRmb, locale) })}</div>
                    </td>
                    <td className="px-4 py-4">
                      <InlineChip tone={getSettlementTone(commission.settlementStatus)}>{getCommissionSettlementStatusLabel(commission.settlementStatus, t)}</InlineChip>
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine label={t("shared.fields.createdAt")} value={formatDateTime(commission.createdAt, locale)} />
                      <DetailLine label={t("shared.fields.settledAt")} value={formatDateTime(commission.settledAt, locale)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <DashboardPaginationControls
              endIndex={commissionsPagination.endIndex}
              hasNextPage={commissionsPagination.hasNextPage}
              hasPreviousPage={commissionsPagination.hasPreviousPage}
              onNextPage={commissionsPagination.goToNextPage}
              onPreviousPage={commissionsPagination.goToPreviousPage}
              page={commissionsPagination.page}
              pageCount={commissionsPagination.pageCount}
              startIndex={commissionsPagination.startIndex}
              totalItems={commissionsPagination.totalItems}
            />
          </div>
        </section>
      )}
    </section>
  );
}

function InlineChip({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "gold" }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", tone === "blue" && "bg-[#e4edf3] text-[#486782]", tone === "green" && "bg-[#e7f3ea] text-[#4c7259]", tone === "gold" && "bg-[#fbf1d9] text-[#9a6a07]")}>{children}</span>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <div className="leading-7 text-[#66727b]"><span className="text-xs text-[#8a949c]">{label}: </span><span>{value}</span></div>;
}

function getSettlementTone(status: CommissionSettlementStatus) { if (status === "paid") return "green"; if (status === "pending" || status === "reversed") return "gold"; return "blue"; }
