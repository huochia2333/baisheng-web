"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  accent: "blue" | "green" | "gold";
  icon: ReactNode;
  label: string;
  labelClassName?: string;
  value: ReactNode;
};

export function DashboardMetricCard({
  accent,
  icon,
  label,
  labelClassName,
  value,
}: DashboardMetricCardProps) {
  return (
    <div
      className={cn(
        "h-full min-w-0 rounded-[20px] border px-3 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.06)] sm:rounded-[24px] sm:px-5 sm:py-4",
        accent === "blue" && "border-[#d9e3eb] bg-[#f4f8fb]",
        accent === "green" && "border-[#dce8df] bg-[#f2f7f3]",
        accent === "gold" && "border-[#eadfbf] bg-[#fbf5e8]",
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white sm:h-11 sm:w-11",
            accent === "blue" && "bg-[#486782]",
            accent === "green" && "bg-[#4c7259]",
            accent === "gold" && "bg-[#b7892f]",
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              "font-label text-[10px] font-semibold tracking-[0.12em] text-[#7d8890] uppercase sm:text-[11px] sm:tracking-[0.18em]",
              labelClassName,
            )}
          >
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight text-[#23313a] sm:whitespace-nowrap sm:text-2xl">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
