"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { Search, UsersRound } from "lucide-react";

import type { AdminCommissionRow, CommissionSettlementStatus } from "@/lib/admin-commission";
import type { DashboardPaginationSlice } from "@/lib/dashboard-pagination";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import {
  DashboardListSection,
  DashboardTableFrame,
} from "@/components/dashboard/dashboard-section-panel";
import {
  EmptyState,
  formatDateTime,
  mapUserStatus,
} from "@/components/dashboard/dashboard-shared-ui";

import type { BeneficiarySummaryRow } from "./admin-commission-view-model";
import {
  formatCommissionMoney,
  formatNullableCommissionMoney,
  getCommissionCategoryLabel,
  getCommissionOrderStatusLabel,
  getCommissionRoleLabel,
  getCommissionSettlementStatusLabel,
} from "./commission-display";

type CommissionPagination = DashboardPaginationSlice<AdminCommissionRow> & {
  goToNextPage: () => void;
  goToPreviousPage: () => void;
};

export function CommissionBeneficiarySummarySection({
  rows,
  onViewAll,
}: {
  onViewAll: (userId: string) => void;
  rows: BeneficiarySummaryRow[];
}) {
  const t = useTranslations("Commission");
  const { locale } = useLocale();

  return (
    <DashboardListSection
      description={t("beneficiaries.description")}
      title={t("beneficiaries.title")}
    >
      {rows.length === 0 ? (
        <EmptyState
          description={t("beneficiaries.emptyDescription")}
          icon={<UsersRound className="size-6" />}
          title={t("beneficiaries.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-[980px] w-full divide-y divide-[#e6e2db] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                <th className="px-4 py-3">{t("beneficiaries.columns.beneficiary")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.roleStatus")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.recordCount")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.totalAmount")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.pendingAmount")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.paidAmount")}</th>
                <th className="px-4 py-3">{t("beneficiaries.columns.latestRecord")}</th>
                <th className="px-4 py-3 text-right">
                  {t("beneficiaries.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe5]">
              {rows.map((beneficiary) => {
                const beneficiaryStatus = mapUserStatus(beneficiary.status, locale);

                return (
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
                          {getCommissionRoleLabel(beneficiary.role, t)}
                        </InlineChip>
                        <InlineChip
                          tone={
                            beneficiaryStatus.accent === "success" ? "green" : "gold"
                          }
                        >
                          {beneficiaryStatus.label}
                        </InlineChip>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#22313a]">
                      {beneficiary.recordCount}
                    </td>
                    <td className="px-4 py-4 text-[#22313a]">
                      {formatCommissionMoney(beneficiary.totalAmount, locale)}
                    </td>
                    <td className="px-4 py-4 text-[#9a6a07]">
                      {formatCommissionMoney(beneficiary.pendingAmount, locale)}
                    </td>
                    <td className="px-4 py-4 text-[#4c7259]">
                      {formatCommissionMoney(beneficiary.paidAmount, locale)}
                    </td>
                    <td className="px-4 py-4 text-[#66727b]">
                      {formatDateTime(beneficiary.lastCreatedAt, locale)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        className="rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                        onClick={() => onViewAll(beneficiary.userId)}
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
        </DashboardTableFrame>
      )}
    </DashboardListSection>
  );
}

export function AdminCommissionTableSection({
  onFocusOrderNumber,
  onMarkAsPaid,
  pagination,
  rows,
  settlingCommissionId,
}: {
  onFocusOrderNumber: (orderNumber: string) => void;
  onMarkAsPaid: (commission: AdminCommissionRow) => void;
  pagination: CommissionPagination;
  rows: AdminCommissionRow[];
  settlingCommissionId: string | null;
}) {
  const t = useTranslations("Commission");
  const { locale } = useLocale();

  return (
    <DashboardListSection
      description={t("table.description")}
      title={t("table.title")}
    >
      {rows.length === 0 ? (
        <EmptyState
          description={t("table.emptyDescription")}
          icon={<Search className="size-6" />}
          title={t("table.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame
          footer={
            <DashboardPaginationControls
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onNextPage={pagination.goToNextPage}
              onPreviousPage={pagination.goToPreviousPage}
              page={pagination.page}
              pageCount={pagination.pageCount}
              startIndex={pagination.startIndex}
              totalItems={pagination.totalItems}
            />
          }
        >
          <table className="min-w-[1220px] w-full divide-y divide-[#e6e2db] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                <th className="px-4 py-3">{t("table.columns.orderStatus")}</th>
                <th className="px-4 py-3">{t("table.columns.beneficiary")}</th>
                <th className="px-4 py-3">{t("table.columns.category")}</th>
                <th className="px-4 py-3">{t("table.columns.source")}</th>
                <th className="px-4 py-3">{t("table.columns.amountSnapshot")}</th>
                <th className="px-4 py-3">
                  {t("table.columns.commissionSettlement")}
                </th>
                <th className="px-4 py-3">{t("table.columns.timestamps")}</th>
                <th className="px-4 py-3 text-right">{t("table.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe5]">
              {pagination.items.map((commission) => {
                const beneficiaryStatus = mapUserStatus(
                  commission.beneficiary.status,
                  locale,
                );
                const isSettling = settlingCommissionId === commission.id;

                return (
                  <tr
                    key={commission.id}
                    className="align-top transition-colors hover:bg-[#f7f7f5]"
                  >
                    <td className="px-4 py-4">
                      <button
                        className="text-left text-sm font-semibold text-[#486782] transition-colors hover:text-[#36546d]"
                        onClick={() => onFocusOrderNumber(commission.orderNumber)}
                        type="button"
                      >
                        {commission.orderNumber}
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InlineChip tone="blue">
                          {getCommissionOrderStatusLabel(commission.orderStatus, t)}
                        </InlineChip>
                        {commission.isOrderDeleted ? (
                          <InlineChip tone="gold">
                            {t("shared.deletedOrder")}
                          </InlineChip>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#22313a]">
                        {commission.beneficiary.label}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InlineChip tone="blue">
                          {getCommissionRoleLabel(commission.beneficiary.role, t)}
                        </InlineChip>
                        <InlineChip
                          tone={
                            beneficiaryStatus.accent === "success" ? "green" : "gold"
                          }
                        >
                          {beneficiaryStatus.label}
                        </InlineChip>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-[#22313a]">
                      {getCommissionCategoryLabel(commission.category, t)}
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine
                        label={t("shared.fields.customer")}
                        value={commission.sourceCustomer?.label ?? t("shared.fallback.none")}
                      />
                      <DetailLine
                        label={t("shared.fields.salesman")}
                        value={commission.sourceSalesman?.label ?? t("shared.fallback.none")}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine
                        label={t("shared.fields.orderAmount")}
                        value={formatCommissionMoney(commission.orderAmountRmb, locale)}
                      />
                      <DetailLine
                        label={t("shared.fields.costAmount")}
                        value={formatNullableCommissionMoney(
                          commission.costAmountRmb,
                          locale,
                          t,
                        )}
                      />
                      <DetailLine
                        label={t("shared.fields.serviceFee")}
                        value={formatNullableCommissionMoney(
                          commission.serviceFeeAmountRmb,
                          locale,
                          t,
                        )}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#22313a]">
                        {formatCommissionMoney(commission.commissionAmountRmb, locale)}
                      </div>
                      <div className="mt-2">
                        <InlineChip tone={getSettlementTone(commission.settlementStatus)}>
                          {getCommissionSettlementStatusLabel(
                            commission.settlementStatus,
                            t,
                          )}
                        </InlineChip>
                      </div>
                      {commission.settlementNote ? (
                        <p className="mt-2 max-w-xs text-xs leading-6 text-[#79848d]">
                          {t("shared.note", { note: commission.settlementNote })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine
                        label={t("shared.fields.createdAt")}
                        value={formatDateTime(commission.createdAt, locale)}
                      />
                      <DetailLine
                        label={t("shared.fields.settledAt")}
                        value={formatDateTime(commission.settledAt, locale)}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      {commission.settlementStatus === "pending" ? (
                        <Button
                          className="rounded-full bg-[#4c7259] text-white hover:bg-[#3f604a]"
                          disabled={isSettling}
                          onClick={() => onMarkAsPaid(commission)}
                          type="button"
                        >
                          {isSettling
                            ? t("actions.markingPaid")
                            : t("actions.markPaid")}
                        </Button>
                      ) : (
                        <span className="text-xs text-[#8a949c]">
                          {t("actions.noPendingAction")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DashboardTableFrame>
      )}
    </DashboardListSection>
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
      <span className="text-xs text-[#8a949c]">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function getSettlementTone(status: CommissionSettlementStatus) {
  if (status === "paid") {
    return "green";
  }

  if (status === "pending" || status === "reversed") {
    return "gold";
  }

  return "blue";
}
