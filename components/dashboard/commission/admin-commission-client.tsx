"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";

import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  Coins,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

import {
  getAdminCommissionPageData,
  type AdminCommissionPageData,
  type AdminCommissionRow,
} from "@/lib/admin-commission";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";
import { useLocale } from "@/components/i18n/locale-provider";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import {
  EmptyState,
  PageBanner,
  normalizeSearchText,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

import {
  AdminCommissionTableSection,
  CategoryFilter,
  CommissionBeneficiarySummarySection,
  CommissionFilters,
  CommissionFiltersSection,
  SettlementFilter,
  summarizeByBeneficiary,
} from "./admin-commission-sections";
import { AdminTaskCommissionSection } from "./admin-task-commission-section";
import { CommissionBoardSwitch } from "./commission-board-switch";
import {
  formatCommissionMoney,
  getCommissionCategoryLabel,
  getCommissionSettlementStatusLabel,
  toCommissionErrorMessage,
} from "./commission-display";
import { useManagedCommissionSettlement } from "./use-managed-commission-settlement";

type PageFeedback = { message: string; tone: NoticeTone } | null;
type CommissionBoard = "normal" | "task";

const EMPTY_FILTERS: CommissionFilters = {
  beneficiaryUserId: "",
  category: "all",
  orderNumber: "",
  searchText: "",
  settlementStatus: "all",
};

export function AdminCommissionClient({
  initialData,
}: {
  initialData: AdminCommissionPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Commission");
  const { locale } = useLocale();
  const settlementOptions = useMemo(
    () => [
      { value: "all" as SettlementFilter, label: t("options.settlement.all") },
      {
        value: "pending" as SettlementFilter,
        label: t("options.settlement.pending"),
      },
      { value: "paid" as SettlementFilter, label: t("options.settlement.paid") },
      {
        value: "cancelled" as SettlementFilter,
        label: t("options.settlement.cancelled"),
      },
      {
        value: "reversed" as SettlementFilter,
        label: t("options.settlement.reversed"),
      },
    ],
    [t],
  );
  const categoryOptions = useMemo(
    () => [
      { value: "all" as CategoryFilter, label: t("options.category.all") },
      {
        value: "salesman_purchase" as CategoryFilter,
        label: t("options.category.salesmanPurchase"),
      },
      {
        value: "salesman_service" as CategoryFilter,
        label: t("options.category.salesmanService"),
      },
      {
        value: "referral_purchase" as CategoryFilter,
        label: t("options.category.referralPurchase"),
      },
      {
        value: "referral_service" as CategoryFilter,
        label: t("options.category.referralService"),
      },
      {
        value: "referral_vip_first_year_bonus" as CategoryFilter,
        label: t("options.category.referralVipFirstYearBonus"),
      },
      {
        value: "manual_adjustment" as CategoryFilter,
        label: t("options.category.manualAdjustment"),
      },
    ],
    [t],
  );

  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>(
    initialData.commissions,
  );
  const [taskCommissions, setTaskCommissions] = useState(initialData.taskCommissions);
  const [activeBoard, setActiveBoard] = useState<CommissionBoard>("normal");
  const [filters, setFilters] = useState<CommissionFilters>(EMPTY_FILTERS);
  const deferredSearchText = useDeferredValue(filters.searchText);

  const applyPageData = useCallback((pageData: AdminCommissionPageData) => {
    setHasPermission(pageData.hasPermission);
    setCommissions(pageData.commissions);
    setTaskCommissions(pageData.taskCommissions);
  }, []);

  const reloadCommissionBoard = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const nextPageData = await getAdminCommissionPageData(supabase);
    applyPageData(nextPageData);
    setPageFeedback(null);
  }, [applyPageData, supabase]);

  const refreshCommissionBoard = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getAdminCommissionPageData(supabase);

        if (!isMounted()) {
          return;
        }

        applyPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toCommissionErrorMessage(error, t, "admin"),
        });
      }
    },
    [applyPageData, supabase, t],
  );

  useWorkspaceSyncEffect(refreshCommissionBoard);

  const beneficiaryOptions = useMemo(
    () => summarizeByBeneficiary(commissions),
    [commissions],
  );
  const filteredCommissions = useMemo(() => {
    const searchValue = normalizeSearchText(deferredSearchText);
    const orderValue = normalizeSearchText(filters.orderNumber);

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
        orderValue &&
        !normalizeSearchText(commission.orderNumber).includes(orderValue)
      ) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableValues = [
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
        getCommissionCategoryLabel(commission.category, t),
        getCommissionSettlementStatusLabel(commission.settlementStatus, t),
      ];

      return searchableValues.some((value) =>
        normalizeSearchText(value).includes(searchValue),
      );
    });
  }, [
    commissions,
    deferredSearchText,
    filters.beneficiaryUserId,
    filters.category,
    filters.orderNumber,
    filters.settlementStatus,
    t,
  ]);
  const beneficiarySummaries = useMemo(
    () => summarizeByBeneficiary(filteredCommissions),
    [filteredCommissions],
  );
  const commissionsPagination = useDashboardPagination(filteredCommissions);
  const summary = useMemo(
    () => ({
      recordCount: filteredCommissions.length,
      totalAmount: filteredCommissions.reduce(
        (sum, item) => sum + item.commissionAmountRmb,
        0,
      ),
      pendingAmount: filteredCommissions
        .filter((item) => item.settlementStatus === "pending")
        .reduce((sum, item) => sum + item.commissionAmountRmb, 0),
      paidAmount: filteredCommissions
        .filter((item) => item.settlementStatus === "paid")
        .reduce((sum, item) => sum + item.commissionAmountRmb, 0),
    }),
    [filteredCommissions],
  );
  const boardOptions = useMemo(
    () => [
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
    ],
    [commissions.length, taskCommissions.length, t],
  );
  const hasActiveFilters = Boolean(
    filters.searchText ||
      filters.beneficiaryUserId ||
      filters.orderNumber ||
      filters.settlementStatus !== "all" ||
      filters.category !== "all",
  );
  const handleFilterChange = useCallback(
    <Key extends keyof CommissionFilters>(
      key: Key,
      value: CommissionFilters[Key],
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );
  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const drillDownToBeneficiary = useCallback(
    (userId: string) => {
      setFilters({ ...EMPTY_FILTERS, beneficiaryUserId: userId });
    },
    [],
  );
  const focusOrderNumber = useCallback((orderNumber: string) => {
    setFilters((current) => ({ ...current, orderNumber, searchText: "" }));
  }, []);

  const {
    handleMarkCommissionAsPaid,
    handleMarkTaskCommissionAsPaid,
    settlingCommissionId,
    settlingTaskCommissionId,
  } = useManagedCommissionSettlement({
    onPageFeedback: (feedback) => setPageFeedback(feedback),
    refreshCommissionBoard: reloadCommissionBoard,
    supabase,
  });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}
      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
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
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              accent="blue"
              icon={<ReceiptText className="size-5" />}
              label={t("summary.recordCount")}
              labelClassName="min-h-10 leading-5"
              value={summary.recordCount.toString()}
            />
            <DashboardMetricCard
              accent="green"
              icon={<WalletCards className="size-5" />}
              label={t("summary.totalAmount")}
              labelClassName="min-h-10 leading-5"
              value={formatCommissionMoney(summary.totalAmount, locale)}
            />
            <DashboardMetricCard
              accent="gold"
              icon={<Coins className="size-5" />}
              label={t("summary.pendingAmount")}
              labelClassName="min-h-10 leading-5"
              value={formatCommissionMoney(summary.pendingAmount, locale)}
            />
            <DashboardMetricCard
              accent="blue"
              icon={<BadgeDollarSign className="size-5" />}
              label={t("summary.paidAmount")}
              labelClassName="min-h-10 leading-5"
              value={formatCommissionMoney(summary.paidAmount, locale)}
            />
          </div>
        </div>
      </section>
      {!hasPermission ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : (
        <>
          <CommissionBoardSwitch
            onChange={setActiveBoard}
            options={boardOptions}
            value={activeBoard}
          />

          {activeBoard === "normal" ? (
            <>
              <CommissionFiltersSection
                beneficiaryCount={beneficiarySummaries.length}
                beneficiaryOptions={beneficiaryOptions}
                categoryOptions={categoryOptions}
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                onFilterChange={handleFilterChange}
                onResetFilters={resetFilters}
                recordCount={filteredCommissions.length}
                settlementOptions={settlementOptions}
              />
              <CommissionBeneficiarySummarySection
                onViewAll={drillDownToBeneficiary}
                rows={beneficiarySummaries}
              />
              <AdminCommissionTableSection
                onFocusOrderNumber={focusOrderNumber}
                onMarkAsPaid={handleMarkCommissionAsPaid}
                pagination={commissionsPagination}
                rows={filteredCommissions}
                settlingCommissionId={settlingCommissionId}
              />
            </>
          ) : (
            <AdminTaskCommissionSection
              onMarkAsPaid={handleMarkTaskCommissionAsPaid}
              rows={taskCommissions}
              settlingTaskCommissionId={settlingTaskCommissionId}
            />
          )}
        </>
      )}
    </section>
  );
}
