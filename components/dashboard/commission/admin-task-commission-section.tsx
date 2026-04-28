"use client";

import { useMemo } from "react";

import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  Coins,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { TaskCommissionRow } from "@/lib/task-commissions";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import {
  DashboardListSection,
  DashboardTableFrame,
} from "@/components/dashboard/dashboard-section-panel";
import {
  EmptyState,
  formatDateTime,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import {
  getTaskScopeLabel,
  getTaskTypeLabel,
} from "@/components/dashboard/tasks/tasks-display";

import {
  formatCommissionMoney,
  getCommissionSettlementStatusLabel,
} from "./commission-display";

export function AdminTaskCommissionSection({
  onMarkAsPaid,
  rows,
  settlingTaskCommissionId = null,
}: {
  onMarkAsPaid?: (row: TaskCommissionRow) => void;
  rows: TaskCommissionRow[];
  settlingTaskCommissionId?: string | null;
}) {
  const t = useTranslations("Commission");
  const sharedTaskT = useTranslations("Tasks.shared");
  const { locale } = useLocale();
  const showActions = typeof onMarkAsPaid === "function";

  const summary = useMemo(
    () => ({
      recordCount: rows.length,
      totalAmount: rows.reduce((sum, row) => sum + row.commissionAmountRmb, 0),
      pendingAmount: rows
        .filter((row) => row.settlementStatus === "pending")
        .reduce((sum, row) => sum + row.commissionAmountRmb, 0),
      paidAmount: rows
        .filter((row) => row.settlementStatus === "paid")
        .reduce((sum, row) => sum + row.commissionAmountRmb, 0),
    }),
    [rows],
  );

  return (
    <DashboardListSection
      bodyClassName="space-y-6"
      description={t("taskSection.description")}
      title={t("taskSection.title")}
    >
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            accent="blue"
            icon={<ReceiptText className="size-5" />}
            label={t("taskSection.summary.recordCount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={summary.recordCount.toString()}
          />
          <DashboardMetricCard
            accent="green"
            icon={<Coins className="size-5" />}
            label={t("taskSection.summary.totalAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.totalAmount, locale)}
          />
          <DashboardMetricCard
            accent="gold"
            icon={<BadgeDollarSign className="size-5" />}
            label={t("taskSection.summary.pendingAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.pendingAmount, locale)}
          />
          <DashboardMetricCard
            accent="blue"
            icon={<ShieldCheck className="size-5" />}
            label={t("taskSection.summary.paidAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.paidAmount, locale)}
          />
        </div>

      {rows.length === 0 ? (
        <EmptyState
          description={t("taskSection.emptyDescription")}
          icon={<Search className="size-6" />}
          title={t("taskSection.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                <th className="px-4 py-3">{t("taskSection.table.columns.task")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.beneficiary")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.approvedBy")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.commission")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.time")}</th>
                {showActions ? (
                  <th className="px-4 py-3 text-right">
                    {t("taskSection.table.columns.actions")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe5]">
              {rows.map((row) => {
                const isSettling = settlingTaskCommissionId === row.id;

                return (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-[#f7f7f5]"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#22313a]">{row.taskName}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <InlineChip tone="blue">
                          {getTaskTypeLabel(row.taskTypeName, row.taskTypeCode, sharedTaskT)}
                        </InlineChip>
                        <InlineChip tone="blue">
                          {row.taskScope === "team" && row.teamName
                            ? `${getTaskScopeLabel(row.taskScope, sharedTaskT)} 璺?${row.teamName}`
                            : getTaskScopeLabel(row.taskScope, sharedTaskT)}
                        </InlineChip>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#22313a]">
                        {row.beneficiary.label}
                      </div>
                      {row.beneficiary.email ? (
                        <div className="mt-2 text-xs text-[#79848d]">
                          {row.beneficiary.email}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 text-[#22313a]">
                        <UserRound className="size-4 text-[#486782]" />
                        <span>{row.approvedBy?.label ?? t("shared.fallback.none")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#22313a]">
                        {formatCommissionMoney(row.commissionAmountRmb, locale)}
                      </div>
                      <div className="mt-2">
                        <InlineChip tone={getSettlementTone(row.settlementStatus)}>
                          {getCommissionSettlementStatusLabel(row.settlementStatus, t)}
                        </InlineChip>
                      </div>
                      {row.settlementNote ? (
                        <p className="mt-2 max-w-xs text-xs leading-6 text-[#79848d]">
                          {t("shared.note", { note: row.settlementNote })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <DetailLine
                        label={t("shared.fields.createdAt")}
                        value={formatDateTime(row.createdAt, locale)}
                      />
                      <DetailLine
                        label={t("shared.fields.settledAt")}
                        value={formatDateTime(row.settledAt, locale)}
                      />
                    </td>
                    {showActions ? (
                      <td className="px-4 py-4 text-right">
                        {row.settlementStatus === "pending" && onMarkAsPaid ? (
                          <Button
                            className="rounded-full bg-[#4c7259] text-white hover:bg-[#3f604a]"
                            disabled={isSettling}
                            onClick={() => onMarkAsPaid(row)}
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
                    ) : null}
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
  children: string;
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

function getSettlementTone(status: TaskCommissionRow["settlementStatus"]) {
  if (status === "paid") {
    return "green";
  }

  if (status === "pending" || status === "reversed") {
    return "gold";
  }

  return "blue";
}
