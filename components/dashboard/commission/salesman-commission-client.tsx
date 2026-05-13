"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BadgeDollarSign, Coins, ReceiptText, ShieldAlert, WalletCards } from "lucide-react";

import { getSalesmanCommissionPageData, type SalesmanCommissionPageData } from "@/lib/salesman-commission";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";
import type { AdminCommissionRow, CommissionSettlementStatus } from "@/lib/admin-commission";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import {
  DashboardListSection,
  DashboardTableFrame,
} from "@/components/dashboard/dashboard-section-panel";
import { EmptyState, PageBanner, formatDateTime, type NoticeTone } from "@/components/dashboard/dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

import { CommissionBoardSwitch } from "./commission-board-switch";
import { formatCommissionMoney, getCommissionCategoryLabel, getCommissionOrderStatusLabel, getCommissionOriginText, getCommissionSettlementStatusLabel, toCommissionErrorMessage } from "./commission-display";
import { SalesmanTaskCommissionSection } from "./salesman-task-commission-section";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type CommissionBoard = "normal" | "task";

export function SalesmanCommissionClient({
  initialData,
}: {
  initialData: SalesmanCommissionPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Commission");
  const { locale } = useLocale();
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>(initialData.commissions);
  const [taskCommissions, setTaskCommissions] = useState(initialData.taskCommissions);
  const [activeBoard, setActiveBoard] = useState<CommissionBoard>("normal");

  const applyPageData = useCallback((pageData: SalesmanCommissionPageData) => {
    setHasPermission(pageData.hasPermission);
    setCommissions(pageData.commissions);
    setTaskCommissions(pageData.taskCommissions);
  }, []);

  const refreshCommissionBoard = useCallback(async ({ isMounted }: { isMounted: () => boolean }) => {
    if (!supabase) return;

    try {
      const nextPageData = await getSalesmanCommissionPageData(supabase);
      if (!isMounted()) return;
      applyPageData(nextPageData);
      setPageFeedback(null);
    } catch (error) {
      if (!isMounted()) return;
      setPageFeedback({ tone: "error", message: toCommissionErrorMessage(error, t, "salesman") });
    }
  }, [applyPageData, supabase, t]);

  useWorkspaceSyncEffect(refreshCommissionBoard);

  const commissionsPagination = useDashboardPagination(commissions);
  const summary = useMemo(() => ({
    totalAmount: commissions.reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    pendingAmount: commissions.filter((commission) => commission.settlementStatus === "pending").reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    paidAmount: commissions.filter((commission) => commission.settlementStatus === "paid").reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
  }), [commissions]);
  const boardOptions = useMemo(() => [
    {
      key: "normal" as const,
      title: t("boards.normal.title"),
      description: t("boards.normal.description"),
      meta: t("boards.normal.meta", { count: commissions.length }),
      icon: <WalletCards className="size-4" />,
    },
    {
      key: "task" as const,
      title: t("boards.task.title"),
      description: t("boards.task.description"),
      meta: t("boards.task.meta", { count: taskCommissions.length }),
      icon: <Coins className="size-4" />,
    },
  ], [commissions.length, taskCommissions.length, t]);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner> : null}
      <DashboardSectionHeader
        badge={t("salesman.header.badge")}
        description={t("salesman.header.description")}
        metrics={[
          {
            accent: "blue",
            icon: <WalletCards className="size-5" />,
            key: "totalAmount",
            label: t("salesman.summary.totalAmount"),
            labelClassName: "sm:min-h-10 sm:leading-5",
            value: formatCommissionMoney(summary.totalAmount, locale),
          },
          {
            accent: "gold",
            icon: <Coins className="size-5" />,
            key: "pendingAmount",
            label: t("salesman.summary.pendingAmount"),
            labelClassName: "sm:min-h-10 sm:leading-5",
            value: formatCommissionMoney(summary.pendingAmount, locale),
          },
          {
            accent: "green",
            icon: <BadgeDollarSign className="size-5" />,
            key: "paidAmount",
            label: t("salesman.summary.paidAmount"),
            labelClassName: "sm:min-h-10 sm:leading-5",
            value: formatCommissionMoney(summary.paidAmount, locale),
          },
        ]}
        metricsClassName="sm:grid-cols-3"
        metricsPlacement="below"
        title={t("salesman.header.title")}
      />
      {!hasPermission ? <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8"><EmptyState description={t("salesman.states.noPermissionDescription")} icon={<ShieldAlert className="size-6" />} title={t("salesman.states.noPermissionTitle")} /></section> : (
        <>
          <CommissionBoardSwitch
            onChange={setActiveBoard}
            options={boardOptions}
            value={activeBoard}
          />

          {activeBoard === "normal" ? (
            commissions.length === 0 ? <DashboardListSection><EmptyState description={t("salesman.states.emptyDescription")} icon={<ReceiptText className="size-6" />} title={t("salesman.states.emptyTitle")} /></DashboardListSection> : (
              <DashboardListSection
                description={t("salesman.table.description")}
                title={t("salesman.table.title")}
              >
                <DashboardTableFrame
                  footer={
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
                  }
                >
              <table className="min-w-[980px] w-full divide-y divide-[#e6e2db] text-sm">
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
                </DashboardTableFrame>
              </DashboardListSection>
            )
          ) : (
            <SalesmanTaskCommissionSection rows={taskCommissions} />
          )}
        </>
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
