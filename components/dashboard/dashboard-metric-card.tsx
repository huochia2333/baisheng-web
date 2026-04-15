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
        "h-full rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" && "border-[#d9e3eb] bg-[#f4f8fb]",
        accent === "green" && "border-[#dce8df] bg-[#f2f7f3]",
        accent === "gold" && "border-[#eadfbf] bg-[#fbf5e8]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
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
              "font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase",
              labelClassName,
            )}
          >
            {label}
          </p>
          <p className="mt-1 whitespace-nowrap text-2xl font-bold tracking-tight text-[#23313a]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
