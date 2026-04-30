"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardSectionPanelProps = {
  children: ReactNode;
  className?: string;
};

type DashboardFilterPanelProps = DashboardSectionPanelProps & {
  gridClassName?: string;
  footer?: ReactNode;
  variant?: "inset" | "standalone";
};

type DashboardListHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

type DashboardListSectionProps = DashboardSectionPanelProps & {
  actions?: ReactNode;
  bodyClassName?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  headerClassName?: string;
  title?: ReactNode;
};

type DashboardTableFrameProps = DashboardSectionPanelProps & {
  footer?: ReactNode;
  innerClassName?: string;
};

type DashboardSearchInputProps = {
  className?: string;
  icon: ReactNode;
  inputClassName?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export function DashboardSectionPanel({
  children,
  className,
}: DashboardSectionPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:rounded-[28px] sm:p-6 xl:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DashboardFilterPanel({
  children,
  className,
  footer,
  gridClassName,
  variant = "inset",
}: DashboardFilterPanelProps) {
  return (
    <div
      className={cn(
        variant === "inset" &&
          "rounded-[20px] border border-[#ebe7e1] bg-[#fbfaf8] p-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)] sm:rounded-[24px] sm:p-4",
        variant === "standalone" &&
          "rounded-[24px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:rounded-[28px] sm:p-6",
        className,
      )}
    >
      <div className={cn("grid gap-3 sm:gap-4", gridClassName)}>{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

export function DashboardListHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: DashboardListHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h3
          className={cn(
            "text-xl font-bold tracking-tight text-[#23313a] sm:text-2xl",
            eyebrow ? "mt-2" : "",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-[#6f7b85] sm:mt-2 sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function DashboardListSection({
  actions,
  bodyClassName,
  children,
  className,
  description,
  eyebrow,
  headerClassName,
  title,
}: DashboardListSectionProps) {
  const hasHeader = title || description || eyebrow || actions;

  return (
    <DashboardSectionPanel className={className}>
      {hasHeader ? (
        <DashboardListHeader
          actions={actions}
          className={headerClassName}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
      ) : null}
      <div className={cn(hasHeader ? "mt-4 sm:mt-6" : "", bodyClassName)}>{children}</div>
    </DashboardSectionPanel>
  );
}

export function DashboardTableFrame({
  children,
  className,
  footer,
  innerClassName,
}: DashboardTableFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)] sm:rounded-[24px]",
        className,
      )}
    >
      <div className={cn("overflow-x-auto", innerClassName)}>{children}</div>
      {footer ? <div className="px-4 pb-4 sm:px-5 sm:pb-5">{footer}</div> : null}
    </div>
  );
}

export const dashboardFilterInputClassName =
  "h-11 w-full rounded-[16px] border border-[#dfe5ea] bg-white px-3 text-sm text-[#23313a] outline-none transition placeholder:text-[#8a949c] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 sm:h-12 sm:rounded-[18px] sm:px-4";

export function DashboardFilterField({
  children,
  label,
}: {
  children: ReactNode;
  label: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] text-[#88939b] uppercase sm:mb-2 sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function DashboardSearchInput({
  className,
  icon,
  inputClassName,
  onChange,
  placeholder,
  value,
}: DashboardSearchInputProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]",
        className,
      )}
    >
      {icon}
      <input
        className={cn(
          "h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]",
          inputClassName,
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}
