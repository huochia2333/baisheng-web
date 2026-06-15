"use client";

import type { ChangeEventHandler, ReactNode } from "react";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardFilterField,
  DashboardListHeader,
  DashboardSectionPanel,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { EmptyState as DashboardEmptyState } from "../dashboard-shared-ui";

export const wholesaleStickyFirstThClassName =
  "sticky left-0 z-30 min-w-[180px] whitespace-normal border-r border-[#efebe5] bg-[#f7f5f2] shadow-[8px_0_16px_rgba(35,49,58,0.08)]";

export const wholesaleStickyFirstTdClassName =
  "sticky left-0 z-20 min-w-[180px] whitespace-normal border-r border-[#efebe5] bg-white shadow-[8px_0_16px_rgba(35,49,58,0.08)] group-hover:bg-[#fcfbf8]";

export function WholesalePageShell({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      <DashboardSectionHeader
        actions={actions}
        badge={eyebrow}
        contentClassName="max-w-3xl"
        description={description}
        title={title}
      />
      {children}
    </section>
  );
}

export function WholesalePanel({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const hasHeader = Boolean(title || description);

  return (
    <DashboardSectionPanel className="min-w-0 p-4 sm:p-6 xl:p-8">
      {title ? (
        <DashboardListHeader
          description={description}
          title={title}
        />
      ) : description ? (
        <p className="break-words text-sm leading-7 text-[#6f7b85] [overflow-wrap:anywhere]">
          {description}
        </p>
      ) : null}
      <div className={cn(hasHeader ? "mt-4 sm:mt-6" : "")}>{children}</div>
    </DashboardSectionPanel>
  );
}

export function WholesaleEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <DashboardEmptyState
      description={description}
      icon={icon}
      title={title}
    />
  );
}

export function WholesaleStatGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string; helper?: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          className="min-w-0 rounded-[24px] border border-[#ece8e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.06)] sm:p-6"
          key={stat.label}
        >
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {stat.label}
          </p>
          <p className="mt-4 break-words rounded-[20px] bg-[#f6f4f0] px-4 py-3 text-xl font-bold tracking-tight text-[#23313a] [overflow-wrap:anywhere] sm:px-5 sm:py-4 sm:text-2xl">
            {stat.value}
          </p>
          {stat.helper ? (
            <p className="mt-3 break-words text-xs leading-5 text-[#7a8791] [overflow-wrap:anywhere]">
              {stat.helper}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function WholesaleTable({
  children,
  minWidth = 980,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <DashboardTableFrame>
      <table
        className="w-full border-collapse text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#fcfbf8] [&_tbody_tr:last-child_td]:border-b-0"
        style={{ minWidth }}
      >
        {children}
      </table>
    </DashboardTableFrame>
  );
}

export function WholesaleTh({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-[#efebe5] bg-[#f7f5f2] px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function WholesaleTd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "whitespace-nowrap border-b border-[#efebe5] px-5 py-4 align-top text-sm text-[#2b3942]",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function WholesaleField({
  defaultValue,
  label,
  min,
  name,
  placeholder,
  required,
  step,
  type = "text",
}: {
  defaultValue?: string | number;
  label: string;
  min?: number;
  name: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: string;
}) {
  return (
    <DashboardFilterField label={label}>
      <input
        className={dashboardFilterInputClassName}
        defaultValue={defaultValue}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
      />
    </DashboardFilterField>
  );
}

export function WholesaleTextarea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <DashboardFilterField label={label}>
      <textarea
        className={cn(
          dashboardFilterInputClassName,
          "h-auto min-h-24 py-3 sm:h-auto",
        )}
        name={name}
        placeholder={placeholder}
      />
    </DashboardFilterField>
  );
}

export function WholesaleSelect({
  children,
  defaultValue,
  disabled,
  label,
  name,
  onChange,
  required,
  value,
}: {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  value?: string;
}) {
  return (
    <DashboardFilterField label={label}>
      <select
        className={dashboardFilterInputClassName}
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        onChange={onChange}
        required={required}
        value={value}
      >
        {children}
      </select>
    </DashboardFilterField>
  );
}

export function WholesaleSubmitButton({
  children,
  pending,
}: {
  children: string;
  pending: boolean;
}) {
  return (
    <Button
      className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function WholesaleStatusBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold leading-5",
        tone === "default" && "bg-[#f0efec] text-[#6d787f]",
        tone === "success" && "bg-[#e8f4ec] text-[#4c7259]",
        tone === "warning" && "bg-[#fff5db] text-[#9a6a07]",
        tone === "danger" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {children}
    </span>
  );
}
