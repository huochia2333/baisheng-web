"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import {
  normalizeOptionalString,
} from "../dashboard-shared-ui";
import { DashboardCenteredLoadingState } from "../dashboard-centered-loading-state";
import { DashboardMetricCard } from "../dashboard-metric-card";
import {
  createOrdersUiCopy,
  getOrderTypeMetaFromCategory,
  getStatusLabel,
} from "./admin-orders-utils";
import { OrderDetailsDialog } from "./admin-orders-details-dialog";
import { OrderFormDialog } from "./admin-orders-form-dialog";

function getOrderStatusOptions(t: ReturnType<typeof useTranslations>) {
  return [
    { value: "pending", label: t("status.pending") },
    { value: "in_progress", label: t("status.inProgress") },
    { value: "settled", label: t("status.settled") },
    { value: "completed", label: t("status.completed") },
    { value: "cancelled", label: t("status.cancelled") },
    { value: "refunding", label: t("status.refunding") },
  ] as const;
}

function OrdersLoadingState() {
  const t = useTranslations("OrdersUI");

  return <DashboardCenteredLoadingState message={t("loading")} />;
}

function OrderSummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <DashboardMetricCard
      accent={accent}
      icon={icon}
      label={label}
      value={String(count)}
    />
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">{label}</span>
      {children}
    </label>
  );
}

function OrderHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
      {children}
    </th>
  );
}

function OrderValueCell({
  value,
  strong,
}: {
  value: ReactNode;
  strong?: boolean;
}) {
  const title = typeof value === "string" ? value : undefined;

  return (
    <td
      className={cn(
        "max-w-[220px] px-5 py-4 text-sm text-[#2b3942]",
        strong ? "font-semibold text-[#223038]" : "font-medium",
      )}
      title={title}
    >
      <div className="truncate">{value}</div>
    </td>
  );
}

function OrderStatusChip({ status }: { status: string | null }) {
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);
  const normalizedStatus = normalizeOptionalString(status);
  const orderStatusOptions = getOrderStatusOptions(t);

  if (!normalizedStatus) {
    return <StatusTag tone="default">{t("status.notProvided")}</StatusTag>;
  }

  const matchedStatus = orderStatusOptions.find((option) => option.value === normalizedStatus);

  if (!matchedStatus) {
    return <StatusTag tone="default">{normalizedStatus}</StatusTag>;
  }

  return (
    <StatusTag
      tone={
        normalizedStatus === "pending"
          ? "gold"
          : normalizedStatus === "completed"
            ? "green"
            : normalizedStatus === "cancelled" || normalizedStatus === "refunding"
              ? "red"
              : "blue"
      }
    >
      {matchedStatus.label ?? getStatusLabel(normalizedStatus, orderUiCopy)}
    </StatusTag>
  );
}

function OrderTypeChip({
  meta,
}: {
  meta: ReturnType<typeof getOrderTypeMetaFromCategory>;
}) {
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
}

function StatusTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "default" | "gold" | "green" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "blue" && "bg-[#eef3f7] text-[#486782]",
        tone === "default" && "bg-[#f0efec] text-[#6d787f]",
        tone === "gold" && "bg-[#fff5db] text-[#9a6a07]",
        tone === "green" && "bg-[#e8f4ec] text-[#4c7259]",
        tone === "red" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {children}
    </span>
  );
}

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition placeholder:text-[#98a2aa] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export {
  FilterField,
  OrderDetailsDialog,
  OrderFormDialog,
  OrderHeaderCell,
  OrdersLoadingState,
  OrderStatusChip,
  OrderSummaryCard,
  OrderTypeChip,
  OrderValueCell,
  filterInputClassName,
};
