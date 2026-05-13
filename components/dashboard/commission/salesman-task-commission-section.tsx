"use client";

import { useMemo } from "react";

import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  Coins,
  ReceiptText,
  Search,
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
import {
  getTaskScopeLabel,
  getTaskTypeLabel,
} from "@/components/dashboard/tasks/tasks-display";

import {
  formatCommissionMoney,
  getCommissionSettlementStatusLabel,
} from "./commission-display";

export function SalesmanTaskCommissionSection({
  rows,
}: {
  rows: TaskCommissionRow[];
}) {
  const t = useTranslations("Commission");
  const sharedTaskT = useTranslations("Tasks.shared");
  const { locale } = useLocale();

  const summary = useMemo(
    () => ({
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
      description={t("salesmanTaskSection.description")}
      title={t("salesmanTaskSection.title")}
    >
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <DashboardMetricCard
            accent="blue"
            icon={<Coins className="size-5" />}
            label={t("salesmanTaskSection.summary.totalAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.totalAmount, locale)}
          />
          <DashboardMetricCard
            accent="gold"
            icon={<ReceiptText className="size-5" />}
            label={t("salesmanTaskSection.summary.pendingAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.pendingAmount, locale)}
          />
          <DashboardMetricCard
            accent="green"
            icon={<BadgeDollarSign className="size-5" />}
            label={t("salesmanTaskSection.summary.paidAmount")}
            labelClassName="sm:min-h-10 sm:leading-5"
            value={formatCommissionMoney(summary.paidAmount, locale)}
          />
        </div>

      {rows.length === 0 ? (
        <EmptyState
          description={t("salesmanTaskSection.emptyDescription")}
          icon={<Search className="size-6" />}
          title={t("salesmanTaskSection.emptyTitle")}
        />
      ) : (
        <DashboardTableFrame>
          <table className="min-w-[900px] w-full divide-y divide-[#e6e2db] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[#8b959c] uppercase">
                <th className="px-4 py-3">{t("salesmanTaskSection.table.columns.task")}</th>
                <th className="px-4 py-3">{t("salesmanTaskSection.table.columns.typeScope")}</th>
                <th className="px-4 py-3">{t("salesmanTaskSection.table.columns.amount")}</th>
                <th className="px-4 py-3">{t("salesmanTaskSection.table.columns.settlement")}</th>
                <th className="px-4 py-3">{t("salesmanTaskSection.table.columns.time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe5]">
              {rows.map((row) => (
                <tr key={row.id} className="align-top transition-colors hover:bg-[#f7f7f5]">
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#22313a]">{row.taskName}</div>
                    {row.settlementNote ? (
                      <p className="mt-2 max-w-sm text-xs leading-6 text-[#79848d]">
                        {t("shared.note", { note: row.settlementNote })}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#22313a]">
                      {getTaskTypeLabel(row.taskTypeName, row.taskTypeCode, sharedTaskT)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <InlineChip tone="blue">
                        {row.taskScope === "team" && row.teamName
                          ? `${getTaskScopeLabel(row.taskScope, sharedTaskT)} 路 ${row.teamName}`
                          : getTaskScopeLabel(row.taskScope, sharedTaskT)}
                      </InlineChip>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#22313a]">
                      {formatCommissionMoney(row.commissionAmountRmb, locale)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <InlineChip tone={getSettlementTone(row.settlementStatus)}>
                      {getCommissionSettlementStatusLabel(row.settlementStatus, t)}
                    </InlineChip>
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
