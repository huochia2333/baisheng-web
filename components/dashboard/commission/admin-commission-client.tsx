"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BadgeDollarSign, Coins, ReceiptText, RefreshCcw, Search, ShieldAlert, UsersRound, WalletCards } from "lucide-react";

import { getAdminCommissionPageData, type AdminCommissionPageData, type AdminCommissionRow, type CommissionCategory, type CommissionSettlementStatus } from "@/lib/admin-commission";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useDashboardPagination } from "@/lib/use-dashboard-pagination";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { EmptyState, PageBanner, formatDateTime, mapUserStatus, normalizeSearchText, type NoticeTone } from "@/components/dashboard/dashboard-shared-ui";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

import { AdminTaskCommissionSection } from "./admin-task-commission-section";
import { CommissionBoardSwitch } from "./commission-board-switch";
import { formatCommissionMoney, formatNullableCommissionMoney, getCommissionCategoryLabel, getCommissionOrderStatusLabel, getCommissionRoleLabel, getCommissionSettlementStatusLabel, toCommissionErrorMessage } from "./commission-display";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type SettlementFilter = "all" | CommissionSettlementStatus;
type CategoryFilter = "all" | CommissionCategory;
type CommissionFilters = { searchText: string; beneficiaryUserId: string; orderNumber: string; settlementStatus: SettlementFilter; category: CategoryFilter };
type BeneficiarySummaryRow = { userId: string; label: string; name: string | null; email: string | null; role: AppRole | null; status: UserStatus | null; recordCount: number; totalAmount: number; pendingAmount: number; paidAmount: number; lastCreatedAt: string | null };
type CommissionBoard = "normal" | "task";

const EMPTY_FILTERS: CommissionFilters = { searchText: "", beneficiaryUserId: "", orderNumber: "", settlementStatus: "all", category: "all" };

export function AdminCommissionClient({
  initialData,
}: {
  initialData: AdminCommissionPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Commission");
  const { locale } = useLocale();
  const settlementOptions = useMemo(() => [
    { value: "all" as SettlementFilter, label: t("options.settlement.all") },
    { value: "pending" as SettlementFilter, label: t("options.settlement.pending") },
    { value: "paid" as SettlementFilter, label: t("options.settlement.paid") },
    { value: "cancelled" as SettlementFilter, label: t("options.settlement.cancelled") },
    { value: "reversed" as SettlementFilter, label: t("options.settlement.reversed") },
  ], [t]);
  const categoryOptions = useMemo(() => [
    { value: "all" as CategoryFilter, label: t("options.category.all") },
    { value: "salesman_purchase" as CategoryFilter, label: t("options.category.salesmanPurchase") },
    { value: "salesman_service" as CategoryFilter, label: t("options.category.salesmanService") },
    { value: "referral_purchase" as CategoryFilter, label: t("options.category.referralPurchase") },
    { value: "referral_service" as CategoryFilter, label: t("options.category.referralService") },
    { value: "referral_vip_first_year_bonus" as CategoryFilter, label: t("options.category.referralVipFirstYearBonus") },
    { value: "manual_adjustment" as CategoryFilter, label: t("options.category.manualAdjustment") },
  ], [t]);

  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [hasPermission, setHasPermission] = useState(initialData.hasPermission);
  const [commissions, setCommissions] = useState<AdminCommissionRow[]>(initialData.commissions);
  const [taskCommissions, setTaskCommissions] = useState(initialData.taskCommissions);
  const [activeBoard, setActiveBoard] = useState<CommissionBoard>("normal");
  const [filters, setFilters] = useState<CommissionFilters>(EMPTY_FILTERS);
  const deferredSearchText = useDeferredValue(filters.searchText);

  const applyPageData = useCallback((pageData: AdminCommissionPageData) => {
    setHasPermission(pageData.hasPermission);
    setCommissions(pageData.commissions);
    setTaskCommissions(pageData.taskCommissions);
  }, []);

  const refreshCommissionBoard = useCallback(async ({ isMounted }: { isMounted: () => boolean }) => {
    if (!supabase) return;

    try {
      const nextPageData = await getAdminCommissionPageData(supabase);
      if (!isMounted()) return;
      applyPageData(nextPageData);
      setPageFeedback(null);
    } catch (error) {
      if (!isMounted()) return;
      setPageFeedback({ tone: "error", message: toCommissionErrorMessage(error, t, "admin") });
    }
  }, [applyPageData, supabase, t]);

  useWorkspaceSyncEffect(refreshCommissionBoard);
  const beneficiaryOptions = useMemo(() => summarizeByBeneficiary(commissions), [commissions]);
  const filteredCommissions = useMemo(() => {
    const searchValue = normalizeSearchText(deferredSearchText);
    const orderValue = normalizeSearchText(filters.orderNumber);
    return commissions.filter((commission) => {
      if (filters.beneficiaryUserId && commission.beneficiary.userId !== filters.beneficiaryUserId) return false;
      if (filters.settlementStatus !== "all" && commission.settlementStatus !== filters.settlementStatus) return false;
      if (filters.category !== "all" && commission.category !== filters.category) return false;
      if (orderValue && !normalizeSearchText(commission.orderNumber).includes(orderValue)) return false;
      if (!searchValue) return true;
      const searchable = [commission.orderNumber, commission.beneficiary.label, commission.beneficiary.name, commission.beneficiary.email, commission.sourceCustomer?.label ?? "", commission.sourceCustomer?.name ?? "", commission.sourceCustomer?.email ?? "", commission.sourceSalesman?.label ?? "", commission.sourceSalesman?.name ?? "", commission.sourceSalesman?.email ?? "", getCommissionCategoryLabel(commission.category, t), getCommissionSettlementStatusLabel(commission.settlementStatus, t)];
      return searchable.some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [commissions, deferredSearchText, filters.beneficiaryUserId, filters.category, filters.orderNumber, filters.settlementStatus, t]);
  const beneficiarySummaries = useMemo(() => summarizeByBeneficiary(filteredCommissions), [filteredCommissions]);
  const commissionsPagination = useDashboardPagination(filteredCommissions);
  const summary = useMemo(() => ({
    recordCount: filteredCommissions.length,
    totalAmount: filteredCommissions.reduce((sum, item) => sum + item.commissionAmountRmb, 0),
    pendingAmount: filteredCommissions.filter((item) => item.settlementStatus === "pending").reduce((sum, item) => sum + item.commissionAmountRmb, 0),
    paidAmount: filteredCommissions.filter((item) => item.settlementStatus === "paid").reduce((sum, item) => sum + item.commissionAmountRmb, 0),
  }), [filteredCommissions]);
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
  const hasActiveFilters = Boolean(filters.searchText || filters.beneficiaryUserId || filters.orderNumber || filters.settlementStatus !== "all" || filters.category !== "all");
  const handleFilterChange = useCallback(<Key extends keyof CommissionFilters>(key: Key, value: CommissionFilters[Key]) => setFilters((current) => ({ ...current, [key]: value })), []);
  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const drillDownToBeneficiary = useCallback((userId: string) => setFilters({ ...EMPTY_FILTERS, beneficiaryUserId: userId }), []);
  const focusOrderNumber = useCallback((orderNumber: string) => setFilters((current) => ({ ...current, orderNumber, searchText: "" })), []);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner> : null}
      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">{t("header.badge")}</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">{t("header.title")}</h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{t("header.description")}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard accent="blue" icon={<ReceiptText className="size-5" />} label={t("summary.recordCount")} labelClassName="min-h-10 leading-5" value={summary.recordCount.toString()} />
            <DashboardMetricCard accent="green" icon={<WalletCards className="size-5" />} label={t("summary.totalAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.totalAmount, locale)} />
            <DashboardMetricCard accent="gold" icon={<Coins className="size-5" />} label={t("summary.pendingAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.pendingAmount, locale)} />
            <DashboardMetricCard accent="blue" icon={<BadgeDollarSign className="size-5" />} label={t("summary.paidAmount")} labelClassName="min-h-10 leading-5" value={formatCommissionMoney(summary.paidAmount, locale)} />
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
              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                        {t("filters.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#67727b]">
                        {t("filters.description", {
                          beneficiaries: beneficiarySummaries.length,
                          records: filteredCommissions.length,
                        })}
                      </p>
                    </div>
                    <Button
                      className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
                      onClick={resetFilters}
                      type="button"
                      variant="outline"
                    >
                      <RefreshCcw className="size-4" />
                      {t("filters.reset")}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <SearchField
                      label={t("filters.keywordLabel")}
                      onChange={(value) => handleFilterChange("searchText", value)}
                      placeholder={t("filters.keywordPlaceholder")}
                      value={filters.searchText}
                    />
                    <SelectField
                      label={t("filters.beneficiaryLabel")}
                      onChange={(value) => handleFilterChange("beneficiaryUserId", value)}
                      value={filters.beneficiaryUserId}
                    >
                      <option value="">{t("filters.allBeneficiaries")}</option>
                      {beneficiaryOptions.map((beneficiary) => (
                        <option key={beneficiary.userId} value={beneficiary.userId}>
                          {beneficiary.label}
                        </option>
                      ))}
                    </SelectField>
                    <SearchField
                      label={t("filters.orderNumberLabel")}
                      onChange={(value) => handleFilterChange("orderNumber", value)}
                      placeholder={t("filters.orderNumberPlaceholder")}
                      value={filters.orderNumber}
                    />
                    <SelectField
                      label={t("filters.settlementStatusLabel")}
                      onChange={(value) => handleFilterChange("settlementStatus", value as SettlementFilter)}
                      value={filters.settlementStatus}
                    >
                      {settlementOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label={t("filters.categoryLabel")}
                      onChange={(value) => handleFilterChange("category", value as CategoryFilter)}
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
                            ? `${t("chips.beneficiaryPrefix")}${
                                beneficiaryOptions.find((item) => item.userId === filters.beneficiaryUserId)?.label ?? t("chips.selected")
                              }`
                            : ""
                        }
                      />
                      <ActiveFilterChip
                        active={Boolean(filters.orderNumber)}
                        label={filters.orderNumber ? `${t("chips.orderNumberPrefix")}${filters.orderNumber}` : ""}
                      />
                      <ActiveFilterChip
                        active={filters.settlementStatus !== "all"}
                        label={
                          filters.settlementStatus !== "all"
                            ? `${t("chips.settlementPrefix")}${
                                settlementOptions.find((item) => item.value === filters.settlementStatus)?.label ?? filters.settlementStatus
                              }`
                            : ""
                        }
                      />
                      <ActiveFilterChip
                        active={filters.category !== "all"}
                        label={
                          filters.category !== "all"
                            ? `${t("chips.categoryPrefix")}${
                                categoryOptions.find((item) => item.value === filters.category)?.label ?? filters.category
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
                      {t("beneficiaries.title")}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#67727b]">
                      {t("beneficiaries.description")}
                    </p>
                  </div>
                </div>
                {beneficiarySummaries.length === 0 ? (
                  <div className="mt-6">
                    <EmptyState
                      description={t("beneficiaries.emptyDescription")}
                      icon={<UsersRound className="size-6" />}
                      title={t("beneficiaries.emptyTitle")}
                    />
                  </div>
                ) : (
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                          <th className="px-4 py-3">{t("beneficiaries.columns.beneficiary")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.roleStatus")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.recordCount")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.totalAmount")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.pendingAmount")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.paidAmount")}</th>
                          <th className="px-4 py-3">{t("beneficiaries.columns.latestRecord")}</th>
                          <th className="px-4 py-3 text-right">{t("beneficiaries.columns.actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#efebe5]">
                        {beneficiarySummaries.map((beneficiary) => {
                          const beneficiaryStatus = mapUserStatus(beneficiary.status, locale);
                          return (
                            <tr key={beneficiary.userId} className="bg-white/50 transition-colors hover:bg-[#f7f7f5]">
                              <td className="px-4 py-4">
                                <div className="font-medium text-[#22313a]">{beneficiary.label}</div>
                                {beneficiary.email ? <div className="mt-1 text-xs text-[#79848d]">{beneficiary.email}</div> : null}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <InlineChip tone="blue">{getCommissionRoleLabel(beneficiary.role, t)}</InlineChip>
                                  <InlineChip tone={beneficiaryStatus.accent === "success" ? "green" : "gold"}>
                                    {beneficiaryStatus.label}
                                  </InlineChip>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-[#22313a]">{beneficiary.recordCount}</td>
                              <td className="px-4 py-4 text-[#22313a]">{formatCommissionMoney(beneficiary.totalAmount, locale)}</td>
                              <td className="px-4 py-4 text-[#9a6a07]">{formatCommissionMoney(beneficiary.pendingAmount, locale)}</td>
                              <td className="px-4 py-4 text-[#4c7259]">{formatCommissionMoney(beneficiary.paidAmount, locale)}</td>
                              <td className="px-4 py-4 text-[#66727b]">{formatDateTime(beneficiary.lastCreatedAt, locale)}</td>
                              <td className="px-4 py-4 text-right">
                                <Button
                                  className="rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                                  onClick={() => drillDownToBeneficiary(beneficiary.userId)}
                                  type="button"
                                >
                                  {t("beneficiaries.actions.viewAll")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
                      {t("table.title")}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#67727b]">
                      {t("table.description")}
                    </p>
                  </div>
                </div>
                {filteredCommissions.length === 0 ? (
                  <div className="mt-6">
                    <EmptyState
                      description={t("table.emptyDescription")}
                      icon={<Search className="size-6" />}
                      title={t("table.emptyTitle")}
                    />
                  </div>
                ) : (
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                          <th className="px-4 py-3">{t("table.columns.orderStatus")}</th>
                          <th className="px-4 py-3">{t("table.columns.beneficiary")}</th>
                          <th className="px-4 py-3">{t("table.columns.category")}</th>
                          <th className="px-4 py-3">{t("table.columns.source")}</th>
                          <th className="px-4 py-3">{t("table.columns.amountSnapshot")}</th>
                          <th className="px-4 py-3">{t("table.columns.commissionSettlement")}</th>
                          <th className="px-4 py-3">{t("table.columns.timestamps")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#efebe5]">
                        {commissionsPagination.items.map((commission) => {
                          const beneficiaryStatus = mapUserStatus(commission.beneficiary.status, locale);
                          return (
                            <tr key={commission.id} className="align-top transition-colors hover:bg-[#f7f7f5]">
                              <td className="px-4 py-4">
                                <button
                                  className="text-left text-sm font-semibold text-[#486782] transition-colors hover:text-[#36546d]"
                                  onClick={() => focusOrderNumber(commission.orderNumber)}
                                  type="button"
                                >
                                  {commission.orderNumber}
                                </button>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <InlineChip tone="blue">{getCommissionOrderStatusLabel(commission.orderStatus, t)}</InlineChip>
                                  {commission.isOrderDeleted ? <InlineChip tone="gold">{t("shared.deletedOrder")}</InlineChip> : null}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-medium text-[#22313a]">{commission.beneficiary.label}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <InlineChip tone="blue">{getCommissionRoleLabel(commission.beneficiary.role, t)}</InlineChip>
                                  <InlineChip tone={beneficiaryStatus.accent === "success" ? "green" : "gold"}>{beneficiaryStatus.label}</InlineChip>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-[#22313a]">{getCommissionCategoryLabel(commission.category, t)}</td>
                              <td className="px-4 py-4">
                                <DetailLine label={t("shared.fields.customer")} value={commission.sourceCustomer?.label ?? t("shared.fallback.none")} />
                                <DetailLine label={t("shared.fields.salesman")} value={commission.sourceSalesman?.label ?? t("shared.fallback.none")} />
                              </td>
                              <td className="px-4 py-4">
                                <DetailLine label={t("shared.fields.orderAmount")} value={formatCommissionMoney(commission.orderAmountRmb, locale)} />
                                <DetailLine label={t("shared.fields.costAmount")} value={formatNullableCommissionMoney(commission.costAmountRmb, locale, t)} />
                                <DetailLine label={t("shared.fields.serviceFee")} value={formatNullableCommissionMoney(commission.serviceFeeAmountRmb, locale, t)} />
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-semibold text-[#22313a]">{formatCommissionMoney(commission.commissionAmountRmb, locale)}</div>
                                <div className="mt-2">
                                  <InlineChip tone={getSettlementTone(commission.settlementStatus)}>{getCommissionSettlementStatusLabel(commission.settlementStatus, t)}</InlineChip>
                                </div>
                                {commission.settlementNote ? <p className="mt-2 max-w-xs text-xs leading-6 text-[#79848d]">{t("shared.note", { note: commission.settlementNote })}</p> : null}
                              </td>
                              <td className="px-4 py-4">
                                <DetailLine label={t("shared.fields.createdAt")} value={formatDateTime(commission.createdAt, locale)} />
                                <DetailLine label={t("shared.fields.settledAt")} value={formatDateTime(commission.settledAt, locale)} />
                              </td>
                            </tr>
                          );
                        })}
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
                )}
              </section>
            </>
          ) : (
            <AdminTaskCommissionSection rows={taskCommissions} />
          )}
        </>
      )}
    </section>
  );
}

function SearchField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">{label}</span><div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]"><Search className="size-4 text-[#7a8790]" /><input className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" value={value} /></div></label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">{label}</span><select className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30" onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}

function ActiveFilterChip({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return <span className="inline-flex items-center rounded-full bg-[#edf2f7] px-3 py-1 text-xs font-medium text-[#486782]">{label}</span>;
}

function InlineChip({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "gold" }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", tone === "blue" && "bg-[#e4edf3] text-[#486782]", tone === "green" && "bg-[#e7f3ea] text-[#4c7259]", tone === "gold" && "bg-[#fbf1d9] text-[#9a6a07]")}>{children}</span>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <div className="leading-7 text-[#66727b]"><span className="text-xs text-[#8a949c]">{label}: </span><span>{value}</span></div>;
}

function summarizeByBeneficiary(commissions: AdminCommissionRow[]) {
  const summaryByUserId = new Map<string, BeneficiarySummaryRow>();
  commissions.forEach((commission) => {
    const userId = commission.beneficiary.userId;
    if (!userId) return;
    const existing = summaryByUserId.get(userId);
    if (existing) {
      existing.recordCount += 1;
      existing.totalAmount += commission.commissionAmountRmb;
      if (commission.settlementStatus === "pending") existing.pendingAmount += commission.commissionAmountRmb;
      if (commission.settlementStatus === "paid") existing.paidAmount += commission.commissionAmountRmb;
      existing.lastCreatedAt = pickLaterDate(existing.lastCreatedAt, commission.createdAt);
      return;
    }
    summaryByUserId.set(userId, { userId, label: commission.beneficiary.label, name: commission.beneficiary.name, email: commission.beneficiary.email, role: commission.beneficiary.role, status: commission.beneficiary.status, recordCount: 1, totalAmount: commission.commissionAmountRmb, pendingAmount: commission.settlementStatus === "pending" ? commission.commissionAmountRmb : 0, paidAmount: commission.settlementStatus === "paid" ? commission.commissionAmountRmb : 0, lastCreatedAt: commission.createdAt });
  });
  return Array.from(summaryByUserId.values()).sort((left, right) => right.totalAmount !== left.totalAmount ? right.totalAmount - left.totalAmount : compareDateDesc(left.lastCreatedAt, right.lastCreatedAt));
}

function pickLaterDate(current: string | null, next: string | null) { if (!current) return next; if (!next) return current; return new Date(next).getTime() > new Date(current).getTime() ? next : current; }
function compareDateDesc(left: string | null, right: string | null) { return (right ? new Date(right).getTime() : 0) - (left ? new Date(left).getTime() : 0); }
function getSettlementTone(status: CommissionSettlementStatus) { if (status === "paid") return "green"; if (status === "pending" || status === "reversed") return "gold"; return "blue"; }
