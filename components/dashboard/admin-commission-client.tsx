"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Coins,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  canViewAdminCommissionBoard,
  getAdminCommissions,
  getCurrentCommissionViewerContext,
  type AdminCommissionRow,
  type CommissionCategory,
  type CommissionSettlementStatus,
} from "@/lib/admin-commission";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  PageBanner,
  formatDateTime,
  mapUserStatus,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";
import { Button } from "../ui/button";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type SettlementFilter = "all" | CommissionSettlementStatus;
type CategoryFilter = "all" | CommissionCategory;

type CommissionFilters = {
  searchText: string;
  beneficiaryUserId: string;
  orderNumber: string;
  settlementStatus: SettlementFilter;
  category: CategoryFilter;
};

type BeneficiarySummaryRow = {
  userId: string;
  label: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
  status: UserStatus | null;
  recordCount: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  lastCreatedAt: string | null;
};

const EMPTY_FILTERS: CommissionFilters = {
  searchText: "",
  beneficiaryUserId: "",
  orderNumber: "",
  settlementStatus: "all",
  category: "all",
};

const settlementOptions: Array<{ value: SettlementFilter; label: string }> = [
  { value: "all", label: "全部结算状态" },
  { value: "pending", label: "待结算" },
  { value: "paid", label: "已结算" },
  { value: "cancelled", label: "已取消" },
  { value: "reversed", label: "已冲销" },
];

const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "全部佣金类型" },
  { value: "salesman_purchase", label: "业务员采购佣金" },
  { value: "salesman_service", label: "业务员服务佣金" },
  { value: "referral_purchase", label: "推荐采购佣金" },
  { value: "referral_service", label: "推荐服务佣金" },
  { value: "referral_vip_first_year_bonus", label: "VIP 首年推荐奖励" },
  { value: "manual_adjustment", label: "手工调整" },
];

export function AdminCommissionClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [viewerRole, setViewerRole] = useState<AppRole | null>(null);
  const [viewerStatus, setViewerStatus] = useState<UserStatus | null>(null);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>([]);
  const [filters, setFilters] = useState<CommissionFilters>(EMPTY_FILTERS);
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const deferredSearchText = useDeferredValue(filters.searchText);

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

        const viewer = await getCurrentCommissionViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        setViewerRole(viewer.role);
        setViewerStatus(viewer.status);

        if (!canViewAdminCommissionBoard(viewer.role, viewer.status)) {
          setCommissions([]);
          setPageFeedback(null);
          return;
        }

        const nextCommissions = await getAdminCommissions(supabase);

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
          message: toCommissionErrorMessage(error),
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

  const hasPermission = canViewAdminCommissionBoard(viewerRole, viewerStatus);
  const beneficiaryOptions = useMemo(
    () => summarizeByBeneficiary(commissions),
    [commissions],
  );

  const filteredCommissions = useMemo(() => {
    const normalizedSearchValue = normalizeSearchText(deferredSearchText);
    const normalizedOrderNumber = normalizeSearchText(filters.orderNumber);

    return commissions.filter((commission) => {
      if (
        filters.beneficiaryUserId &&
        commission.beneficiary.userId !== filters.beneficiaryUserId
      ) {
        return false;
      }

      if (
        filters.settlementStatus !== "all" &&
        commission.settlementStatus !== filters.settlementStatus
      ) {
        return false;
      }

      if (filters.category !== "all" && commission.category !== filters.category) {
        return false;
      }

      if (
        normalizedOrderNumber &&
        !normalizeSearchText(commission.orderNumber).includes(normalizedOrderNumber)
      ) {
        return false;
      }

      if (!normalizedSearchValue) {
        return true;
      }

      const searchableFields = [
        commission.orderNumber,
        commission.beneficiary.label,
        commission.beneficiary.name,
        commission.beneficiary.email,
        commission.sourceCustomer?.label ?? "",
        commission.sourceCustomer?.name ?? "",
        commission.sourceCustomer?.email ?? "",
        commission.sourceSalesman?.label ?? "",
        commission.sourceSalesman?.name ?? "",
        commission.sourceSalesman?.email ?? "",
        commission.categoryLabel,
        commission.settlementStatusLabel,
      ];

      return searchableFields.some((value) =>
        normalizeSearchText(value).includes(normalizedSearchValue),
      );
    });
  }, [
    commissions,
    deferredSearchText,
    filters.beneficiaryUserId,
    filters.category,
    filters.orderNumber,
    filters.settlementStatus,
  ]);

  const beneficiarySummaries = useMemo(
    () => summarizeByBeneficiary(filteredCommissions),
    [filteredCommissions],
  );

  const summary = useMemo(
    () => ({
      recordCount: filteredCommissions.length,
      totalAmount: filteredCommissions.reduce(
        (sum, commission) => sum + commission.commissionAmountRmb,
        0,
      ),
      pendingAmount: filteredCommissions
        .filter((commission) => commission.settlementStatus === "pending")
        .reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
      paidAmount: filteredCommissions
        .filter((commission) => commission.settlementStatus === "paid")
        .reduce((sum, commission) => sum + commission.commissionAmountRmb, 0),
    }),
    [filteredCommissions],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.searchText ||
          filters.beneficiaryUserId ||
          filters.orderNumber ||
          filters.settlementStatus !== "all" ||
          filters.category !== "all",
      ),
    [
      filters.beneficiaryUserId,
      filters.category,
      filters.orderNumber,
      filters.searchText,
      filters.settlementStatus,
    ],
  );

  const handleFilterChange = useCallback(
    <Key extends keyof CommissionFilters>(
      key: Key,
      value: CommissionFilters[Key],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const drillDownToBeneficiary = useCallback((userId: string) => {
    setFilters({
      ...EMPTY_FILTERS,
      beneficiaryUserId: userId,
    });
  }, []);

  const focusOrderNumber = useCallback((orderNumber: string) => {
    setFilters((current) => ({
      ...current,
      orderNumber,
      searchText: "",
    }));
  }, []);

  if (!supabase || loading) {
    return <CommissionLoadingState />;
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
              管理员佣金中心
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              佣金板块
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
              查看平台全部佣金记录，按受益人、订单号、结算状态和佣金类型快速定位，
              同时保留订单与来源上下文，便于管理员核对每笔佣金归属。
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              accent="blue"
              icon={<ReceiptText className="size-5" />}
              label="佣金笔数"
              value={summary.recordCount.toString()}
            />
            <SummaryCard
              accent="green"
              icon={<WalletCards className="size-5" />}
              label="佣金总额"
              value={formatMoney(summary.totalAmount)}
            />
            <SummaryCard
              accent="gold"
              icon={<Coins className="size-5" />}
              label="待结算金额"
              value={formatMoney(summary.pendingAmount)}
            />
            <SummaryCard
              accent="blue"
              icon={<BadgeDollarSign className="size-5" />}
              label="已结算金额"
              value={formatMoney(summary.paidAmount)}
            />
          </div>
        </div>
      </section>

      {!hasPermission ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前登录账号不是已激活管理员，无法查看平台全部佣金记录。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无佣金查看权限"
          />
        </section>
      ) : (
        <>
          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                    筛选与定位
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#67727b]">
                    当前显示 {filteredCommissions.length} 条佣金记录，覆盖{" "}
                    {beneficiarySummaries.length} 名受益人。
                  </p>
                </div>

                <Button
                  className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
                  onClick={resetFilters}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" />
                  重置筛选
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SearchField
                  label="关键词"
                  onChange={(value) => handleFilterChange("searchText", value)}
                  placeholder="搜受益人、客户、业务员、订单号"
                  value={filters.searchText}
                />
                <SelectField
                  label="受益人"
                  onChange={(value) =>
                    handleFilterChange("beneficiaryUserId", value)
                  }
                  value={filters.beneficiaryUserId}
                >
                  <option value="">全部受益人</option>
                  {beneficiaryOptions.map((beneficiary) => (
                    <option key={beneficiary.userId} value={beneficiary.userId}>
                      {beneficiary.label}
                    </option>
                  ))}
                </SelectField>
                <SearchField
                  label="订单号"
                  onChange={(value) => handleFilterChange("orderNumber", value)}
                  placeholder="直接查某个订单"
                  value={filters.orderNumber}
                />
                <SelectField
                  label="结算状态"
                  onChange={(value) =>
                    handleFilterChange(
                      "settlementStatus",
                      value as SettlementFilter,
                    )
                  }
                  value={filters.settlementStatus}
                >
                  {settlementOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="佣金类型"
                  onChange={(value) =>
                    handleFilterChange("category", value as CategoryFilter)
                  }
                  value={filters.category}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              {hasActiveFilters ? (
                <div className="flex flex-wrap gap-2 text-sm text-[#66717a]">
                  <ActiveFilterChip
                    active={Boolean(filters.beneficiaryUserId)}
                    label={
                      filters.beneficiaryUserId
                        ? `受益人：${
                            beneficiaryOptions.find(
                              (item) => item.userId === filters.beneficiaryUserId,
                            )?.label ?? "已选择"
                          }`
                        : ""
                    }
                  />
                  <ActiveFilterChip
                    active={Boolean(filters.orderNumber)}
                    label={filters.orderNumber ? `订单号：${filters.orderNumber}` : ""}
                  />
                  <ActiveFilterChip
                    active={filters.settlementStatus !== "all"}
                    label={
                      filters.settlementStatus !== "all"
                        ? `结算：${
                            settlementOptions.find(
                              (item) => item.value === filters.settlementStatus,
                            )?.label ?? filters.settlementStatus
                          }`
                        : ""
                    }
                  />
                  <ActiveFilterChip
                    active={filters.category !== "all"}
                    label={
                      filters.category !== "all"
                        ? `类型：${
                            categoryOptions.find(
                              (item) => item.value === filters.category,
                            )?.label ?? filters.category
                          }`
                        : ""
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                  按人员汇总
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#67727b]">
                  点击某个受益人即可切换到该人的全部佣金记录。
                </p>
              </div>
            </div>

            {beneficiarySummaries.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  description="当前筛选条件下没有可汇总的佣金受益人。"
                  icon={<UsersRound className="size-6" />}
                  title="暂无人员汇总"
                />
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                      <th className="px-4 py-3">受益人</th>
                      <th className="px-4 py-3">角色与状态</th>
                      <th className="px-4 py-3">佣金笔数</th>
                      <th className="px-4 py-3">总佣金</th>
                      <th className="px-4 py-3">待结算</th>
                      <th className="px-4 py-3">已结算</th>
                      <th className="px-4 py-3">最近佣金</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efebe5]">
                    {beneficiarySummaries.map((beneficiary) => (
                      <tr
                        key={beneficiary.userId}
                        className="bg-white/50 transition-colors hover:bg-[#f7f7f5]"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-[#22313a]">
                            {beneficiary.label}
                          </div>
                          {beneficiary.email ? (
                            <div className="mt-1 text-xs text-[#79848d]">
                              {beneficiary.email}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <InlineChip tone="blue">
                              {getRoleLabel(beneficiary.role)}
                            </InlineChip>
                            <InlineChip
                              tone={
                                mapUserStatus(beneficiary.status).accent ===
                                "success"
                                  ? "green"
                                  : "gold"
                              }
                            >
                              {mapUserStatus(beneficiary.status).label}
                            </InlineChip>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#22313a]">
                          {beneficiary.recordCount}
                        </td>
                        <td className="px-4 py-4 text-[#22313a]">
                          {formatMoney(beneficiary.totalAmount)}
                        </td>
                        <td className="px-4 py-4 text-[#9a6a07]">
                          {formatMoney(beneficiary.pendingAmount)}
                        </td>
                        <td className="px-4 py-4 text-[#4c7259]">
                          {formatMoney(beneficiary.paidAmount)}
                        </td>
                        <td className="px-4 py-4 text-[#66727b]">
                          {formatDateTime(beneficiary.lastCreatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            className="rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                            onClick={() => drillDownToBeneficiary(beneficiary.userId)}
                            type="button"
                          >
                            查看该人全部佣金
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                  佣金明细
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#67727b]">
                  支持直接按订单定位，也保留客户、业务员和结算信息，方便逐笔核对。
                </p>
              </div>
            </div>

            {filteredCommissions.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  description="当前筛选条件下没有命中的佣金记录。"
                  icon={<Search className="size-6" />}
                  title="暂无佣金明细"
                />
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                      <th className="px-4 py-3">订单与状态</th>
                      <th className="px-4 py-3">受益人</th>
                      <th className="px-4 py-3">佣金类型</th>
                      <th className="px-4 py-3">来源</th>
                      <th className="px-4 py-3">金额快照</th>
                      <th className="px-4 py-3">佣金与结算</th>
                      <th className="px-4 py-3">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efebe5]">
                    {filteredCommissions.map((commission) => (
                      <tr
                        key={commission.id}
                        className="align-top transition-colors hover:bg-[#f7f7f5]"
                      >
                        <td className="px-4 py-4">
                          <button
                            className="text-left text-sm font-semibold text-[#486782] transition-colors hover:text-[#36546d]"
                            onClick={() => focusOrderNumber(commission.orderNumber)}
                            type="button"
                          >
                            {commission.orderNumber}
                          </button>
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
                          <div className="font-medium text-[#22313a]">
                            {commission.beneficiary.label}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <InlineChip tone="blue">
                              {getRoleLabel(commission.beneficiary.role)}
                            </InlineChip>
                            <InlineChip
                              tone={
                                mapUserStatus(commission.beneficiary.status).accent ===
                                "success"
                                  ? "green"
                                  : "gold"
                              }
                            >
                              {mapUserStatus(commission.beneficiary.status).label}
                            </InlineChip>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-[#22313a]">
                          {commission.categoryLabel}
                        </td>
                        <td className="px-4 py-4">
                          <DetailLine
                            label="客户"
                            value={commission.sourceCustomer?.label ?? "暂无"}
                          />
                          <DetailLine
                            label="业务员"
                            value={commission.sourceSalesman?.label ?? "暂无"}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <DetailLine
                            label="订单金额"
                            value={formatMoney(commission.orderAmountRmb)}
                          />
                          <DetailLine
                            label="内部成本"
                            value={formatNullableMoney(commission.costAmountRmb)}
                          />
                          <DetailLine
                            label="服务费"
                            value={formatNullableMoney(commission.serviceFeeAmountRmb)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#22313a]">
                            {formatMoney(commission.commissionAmountRmb)}
                          </div>
                          <div className="mt-2">
                            <InlineChip
                              tone={getSettlementTone(commission.settlementStatus)}
                            >
                              {commission.settlementStatusLabel}
                            </InlineChip>
                          </div>
                          {commission.settlementNote ? (
                            <p className="mt-2 max-w-xs text-xs leading-6 text-[#79848d]">
                              备注：{commission.settlementNote}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <DetailLine
                            label="创建"
                            value={formatDateTime(commission.createdAt)}
                          />
                          <DetailLine
                            label="结算"
                            value={formatDateTime(commission.settledAt)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function CommissionLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载佣金数据...
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

function SearchField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]">
        <Search className="size-4 text-[#7a8790]" />
        <input
          className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <select
        className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function ActiveFilterChip({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[#edf2f7] px-3 py-1 text-xs font-medium text-[#486782]">
      {label}
    </span>
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

function summarizeByBeneficiary(commissions: AdminCommissionRow[]) {
  const summaryByUserId = new Map<string, BeneficiarySummaryRow>();

  commissions.forEach((commission) => {
    const userId = commission.beneficiary.userId;

    if (!userId) {
      return;
    }

    const existing = summaryByUserId.get(userId);

    if (existing) {
      existing.recordCount += 1;
      existing.totalAmount += commission.commissionAmountRmb;
      if (commission.settlementStatus === "pending") {
        existing.pendingAmount += commission.commissionAmountRmb;
      }
      if (commission.settlementStatus === "paid") {
        existing.paidAmount += commission.commissionAmountRmb;
      }
      existing.lastCreatedAt = pickLaterDate(
        existing.lastCreatedAt,
        commission.createdAt,
      );
      return;
    }

    summaryByUserId.set(userId, {
      userId,
      label: commission.beneficiary.label,
      name: commission.beneficiary.name,
      email: commission.beneficiary.email,
      role: commission.beneficiary.role,
      status: commission.beneficiary.status,
      recordCount: 1,
      totalAmount: commission.commissionAmountRmb,
      pendingAmount:
        commission.settlementStatus === "pending"
          ? commission.commissionAmountRmb
          : 0,
      paidAmount:
        commission.settlementStatus === "paid"
          ? commission.commissionAmountRmb
          : 0,
      lastCreatedAt: commission.createdAt,
    });
  });

  return Array.from(summaryByUserId.values()).sort((left, right) => {
    if (right.totalAmount !== left.totalAmount) {
      return right.totalAmount - left.totalAmount;
    }

    return compareDateDesc(left.lastCreatedAt, right.lastCreatedAt);
  });
}

function pickLaterDate(current: string | null, next: string | null) {
  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

function compareDateDesc(left: string | null, right: string | null) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;
  return rightTime - leftTime;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNullableMoney(value: number | null) {
  return value === null ? "暂无" : formatMoney(value);
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getRoleLabel(role: AppRole | null) {
  switch (role) {
    case "administrator":
      return "管理员";
    case "operator":
      return "运营";
    case "manager":
      return "经理";
    case "recruiter":
      return "招聘";
    case "salesman":
      return "业务员";
    case "finance":
      return "财务";
    case "client":
      return "客户";
    default:
      return "未知角色";
  }
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

function toCommissionErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (
    baseMessage.includes("current user cannot") ||
    baseMessage.includes("row-level security")
  ) {
    return "当前账号暂无查看平台全部佣金的权限。";
  }

  return baseMessage;
}
