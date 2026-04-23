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
  EmptyState,
  formatDateTime,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  getTaskScopeLabel,
  getTaskTypeLabel,
} from "@/components/dashboard/tasks/tasks-display";

import {
  formatCommissionMoney,
  getCommissionSettlementStatusLabel,
} from "./commission-display";

export function AdminTaskCommissionSection({
  rows,
}: {
  rows: TaskCommissionRow[];
}) {
  const t = useTranslations("Commission");
  const sharedTaskT = useTranslations("Tasks.shared");
  const { locale } = useLocale();

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
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
              {t("taskSection.title")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#67727b]">
              {t("taskSection.description")}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            accent="blue"
            icon={<ReceiptText className="size-5" />}
            label={t("taskSection.summary.recordCount")}
            labelClassName="min-h-10 leading-5"
            value={summary.recordCount.toString()}
          />
          <DashboardMetricCard
            accent="green"
            icon={<Coins className="size-5" />}
            label={t("taskSection.summary.totalAmount")}
            labelClassName="min-h-10 leading-5"
            value={formatCommissionMoney(summary.totalAmount, locale)}
          />
          <DashboardMetricCard
            accent="gold"
            icon={<BadgeDollarSign className="size-5" />}
            label={t("taskSection.summary.pendingAmount")}
            labelClassName="min-h-10 leading-5"
            value={formatCommissionMoney(summary.pendingAmount, locale)}
          />
          <DashboardMetricCard
            accent="blue"
            icon={<ShieldCheck className="size-5" />}
            label={t("taskSection.summary.paidAmount")}
            labelClassName="min-h-10 leading-5"
            value={formatCommissionMoney(summary.paidAmount, locale)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description={t("taskSection.emptyDescription")}
            icon={<Search className="size-6" />}
            title={t("taskSection.emptyTitle")}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e6e2db] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                <th className="px-4 py-3">{t("taskSection.table.columns.task")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.beneficiary")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.approvedBy")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.commission")}</th>
                <th className="px-4 py-3">{t("taskSection.table.columns.time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe5]">
              {rows.map((row) => (
                <tr key={row.id} className="align-top transition-colors hover:bg-[#f7f7f5]">
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#22313a]">{row.taskName}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <InlineChip tone="blue">
                        {getTaskTypeLabel(row.taskTypeName, row.taskTypeCode, sharedTaskT)}
                      </InlineChip>
                      <InlineChip tone="blue">
                        {row.taskScope === "team" && row.teamName
                          ? `${getTaskScopeLabel(row.taskScope, sharedTaskT)} · ${row.teamName}`
                          : getTaskScopeLabel(row.taskScope, sharedTaskT)}
                      </InlineChip>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#22313a]">{row.beneficiary.label}</div>
                    {row.beneficiary.email ? (
                      <div className="mt-2 text-xs text-[#79848d]">{row.beneficiary.email}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
