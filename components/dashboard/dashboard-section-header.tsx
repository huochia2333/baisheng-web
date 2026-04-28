"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { DashboardMetricCard } from "./dashboard-metric-card";

export type DashboardSectionHeaderMetric = {
  accent: "blue" | "gold" | "green";
  icon: ReactNode;
  key?: string;
  label: string;
  labelClassName?: string;
  value: ReactNode;
};

type DashboardSectionHeaderProps = {
  actions?: ReactNode;
  actionsClassName?: string;
  asideClassName?: string;
  asideFooter?: ReactNode;
  badge: ReactNode;
  badgeClassName?: string;
  badgeIcon?: ReactNode;
  className?: string;
  contentClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  layoutClassName?: string;
  metrics?: readonly DashboardSectionHeaderMetric[];
  metricsClassName?: string;
  metricsPlacement?: "aside" | "below";
  title: ReactNode;
  titleClassName?: string;
};

export function DashboardSectionHeader({
  actions,
  actionsClassName,
  asideClassName,
  asideFooter,
  badge,
  badgeClassName,
  badgeIcon,
  className,
  contentClassName,
  description,
  descriptionClassName,
  layoutClassName,
  metrics = [],
  metricsClassName,
  metricsPlacement = "aside",
  title,
  titleClassName,
}: DashboardSectionHeaderProps) {
  const asideMetrics = metricsPlacement === "aside" ? metrics : [];
  const belowMetrics = metricsPlacement === "below" ? metrics : [];
  const hasAside = asideMetrics.length > 0 || Boolean(actions) || Boolean(asideFooter);

  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/90 bg-[#f4f3f1]/92 p-5 shadow-[0_18px_45px_rgba(96,113,128,0.08)] sm:rounded-[28px] sm:p-6 xl:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-5 sm:gap-6 min-[1360px]:flex-row min-[1360px]:items-end min-[1360px]:justify-between",
          layoutClassName,
        )}
      >
        <div className={cn("max-w-3xl", contentClassName)}>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-[#e4edf3] px-2.5 py-1 text-[11px] font-semibold text-[#486782] sm:px-3 sm:text-xs",
              badgeClassName,
            )}
          >
            {badgeIcon}
            {badge}
          </span>
          <h2
            className={cn(
              "mt-3 text-3xl font-bold leading-tight tracking-tight text-[#1f2a32] sm:mt-4 sm:text-4xl",
              titleClassName,
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "mt-2 text-sm leading-7 text-[#65717b] sm:mt-3 sm:text-[15px] sm:leading-8",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {hasAside ? (
          <div
            className={cn(
              "flex w-full flex-col gap-4 min-[1360px]:w-auto min-[1360px]:items-end",
              asideClassName,
            )}
          >
            {asideMetrics.length > 0 ? (
              <HeaderMetricGrid
                className={metricsClassName}
                metrics={asideMetrics}
              />
            ) : null}
            {actions ? (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3",
                  actionsClassName,
                )}
              >
                {actions}
              </div>
            ) : null}
            {asideFooter}
          </div>
        ) : null}
      </div>

      {belowMetrics.length > 0 ? (
        <HeaderMetricGrid
          className={cn("mt-5 sm:mt-6", metricsClassName)}
          metrics={belowMetrics}
        />
      ) : null}
    </section>
  );
}

function HeaderMetricGrid({
  className,
  metrics,
}: {
  className?: string;
  metrics: readonly DashboardSectionHeaderMetric[];
}) {
  return (
    <div className={cn("grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3", className)}>
      {metrics.map((metric, index) => (
        <DashboardMetricCard
          accent={metric.accent}
          icon={metric.icon}
          key={metric.key ?? `${metric.label}-${index}`}
          label={metric.label}
          labelClassName={metric.labelClassName}
          value={metric.value}
        />
      ))}
    </div>
  );
}
