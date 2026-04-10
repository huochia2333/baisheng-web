"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Coins,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

import {
  canViewSalesmanCommissionBoard,
  getCurrentSalesmanCommissionViewerContext,
  getVisibleSalesmanCommissions,
} from "@/lib/salesman-commission";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AdminCommissionRow, CommissionSettlementStatus } from "@/lib/admin-commission";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  PageBanner,
  formatDateTime,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function SalesmanCommissionClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>([]);
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadCommissionBoard = useCallback(
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

        const viewer = await getCurrentSalesmanCommissionViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        setViewerRole(viewer.role);
        setViewerStatus(viewer.status);

        if (!canViewSalesmanCommissionBoard(viewer.role, viewer.status)) {
          setCommissions([]);
          setPageFeedback(null);
          return;
        }

        const nextCommissions = await getVisibleSalesmanCommissions(supabase);

        if (!isMounted()) {
          return;
        }

        setCommissions(nextCommissions);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toSalesmanCommissionErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadCommissionBoard({
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

      await loadCommissionBoard({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const hasPermission = canViewSalesmanCommissionBoard(viewerRole, viewerStatus);

  const summary = useMemo(
    () => ({
      totalAmount: commissions.reduce(
        (sum, commission) => sum + commission.commissionAmountRmb,
        0,
      ),
      pendingAmount: commissions
        .filter((commission) => commission.settlementStatus === "pending")
        .reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
      paidAmount: commissions
        .filter((commission) => commission.settlementStatus === "paid")
        .reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    }),
    [commissions],
  );

  if (!supabase || loading) {
    return <SalesmanCommissionLoadingState />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              我的佣金
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              业务员佣金
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              这里只展示当前登录业务员自己的佣金汇总和明细来历，方便快速确认每笔佣金来自哪位客户、哪张订单、哪种业务类型。
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              accent="blue"
              icon={<WalletCards className="size-5" />}
              label="佣金总计"
              value={formatMoney(summary.totalAmount)}
            />
            <SummaryCard
              accent="gold"
              icon={<Coins className="size-5" />}
              label="未结金额"
              value={formatMoney(summary.pendingAmount)}
            />
            <SummaryCard
              accent="green"
              icon={<BadgeDollarSign className="size-5" />}
              label="已结金额"
              value={formatMoney(summary.paidAmount)}
            />
          </div>
        </div>
      </section>

      {!hasPermission ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前登录账号不是已激活业务员，无法查看个人佣金明细。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无佣金查看权限"
          />
        </section>
      ) : commissions.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前账号还没有产生佣金记录，后续有佣金时会在这里显示总计、结算状态和来源明细。"
            icon={<ReceiptText className="size-6" />}
            title="暂无佣金记录"
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                佣金来历明细
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#67727b]">
                每条记录都会说明佣金来自哪张订单、哪位客户以及哪种佣金类型。
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                  <th className="px-4 py-3">来历</th>
                  <th className="px-4 py-3">订单与客户</th>
                  <th className="px-4 py-3">佣金类型</th>
                  <th className="px-4 py-3">金额</th>
                  <th className="px-4 py-3">结算状态</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efebe5]">
                {commissions.map((commission) => (
                  <tr
                    key={commission.id}
                    className="align-top transition-colors hover:bg-[#f7f7f5]"
                  >
                    <td className="px-4 py-4">
                      <div className="max-w-sm text-sm leading-7 text-[#22313a]">
                        {getCommissionOriginText(commission)}
                      </div>
                      {commission.settlementNote ? (
                        <p className="mt-2 max-w-sm text-xs leading-6 text-[#79848d]">
                          备注：{commission.settlementNote}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine label="订单号" value={commission.orderNumber} />
                      <DetailLine
                        label="客户"
                        value={commission.sourceCustomer?.label ?? "暂无"}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#22313a]">
                        {commission.categoryLabel}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InlineChip tone="blue">
                          {commission.orderStatusLabel}
                        </InlineChip>
                        {commission.isOrderDeleted ? (
                          <InlineChip tone="gold">已删除</InlineChip>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#22313a]">
                        {formatMoney(commission.commissionAmountRmb)}
                      </div>
                      <div className="mt-2 text-xs leading-6 text-[#79848d]">
                        订单金额：{formatMoney(commission.orderAmountRmb)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <InlineChip tone={getSettlementTone(commission.settlementStatus)}>
                        {commission.settlementStatusLabel}
                      </InlineChip>
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine
                        label="记录时间"
                        value={formatDateTime(commission.createdAt)}
                      />
                      <DetailLine
                        label="结算时间"
                        value={formatDateTime(commission.settledAt)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}

function SalesmanCommissionLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载我的佣金...
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={cn(
        "h-full rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
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
        <div className="min-w-0">
          <p className="min-h-10 text-[11px] font-semibold leading-5 tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 whitespace-nowrap text-2xl font-bold tracking-tight text-[#23313a]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InlineChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "green" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "blue" && "bg-[#e4edf3] text-[#486782]",
        tone === "green" && "bg-[#e7f3ea] text-[#4c7259]",
        tone === "gold" && "bg-[#fbf1d9] text-[#9a6a07]",
      )}
    >
      {children}
    </span>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="leading-7 text-[#66727b]">
      <span className="text-xs text-[#8a949c]">{label}：</span>
      <span>{value}</span>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getSettlementTone(status: CommissionSettlementStatus) {
  switch (status) {
    case "paid":
      return "green";
    case "pending":
      return "gold";
    case "cancelled":
      return "blue";
    case "reversed":
      return "gold";
    default:
      return "blue";
  }
}

function getCommissionOriginText(commission: AdminCommissionRow) {
  const customerLabel = commission.sourceCustomer?.label ?? "客户";

  switch (commission.category) {
    case "salesman_purchase":
      return `来自客户 ${customerLabel} 的采购订单 ${commission.orderNumber}。`;
    case "salesman_service":
      return `来自客户 ${customerLabel} 的服务订单 ${commission.orderNumber}。`;
    case "referral_purchase":
      return `来自被推荐客户 ${customerLabel} 的采购订单 ${commission.orderNumber}。`;
    case "referral_service":
      return `来自被推荐客户 ${customerLabel} 的服务订单 ${commission.orderNumber}。`;
    case "referral_vip_first_year_bonus":
      return `来自被推荐客户 ${customerLabel} 的首年 VIP 订单奖励 ${commission.orderNumber}。`;
    case "manual_adjustment":
      return `来自订单 ${commission.orderNumber} 的手工调整佣金。`;
    default:
      return `来自订单 ${commission.orderNumber} 的佣金记录。`;
  }
}

function toSalesmanCommissionErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (
    baseMessage.includes("current user cannot") ||
    baseMessage.includes("row-level security")
  ) {
    return "当前账号暂无查看个人佣金的权限。";
  }

  return baseMessage;
}
