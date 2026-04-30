"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DashboardPillAccent = "blue" | "gold" | "green" | "orange" | "rose";

export function DashboardPill({
  accent = "blue",
  children,
  className,
}: {
  accent?: DashboardPillAccent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        accent === "blue" && "bg-[#e4edf3] text-[#486782]",
        accent === "gold" && "bg-[#fbf1d9] text-[#9a6a07]",
        accent === "green" && "bg-[#e7f3ea] text-[#4c7259]",
        accent === "orange" && "bg-[#fdebd2] text-[#a76516]",
        accent === "rose" && "bg-[#fae8e8] text-[#b13d3d]",
        className,
      )}
    >
      {children}
    </span>
  );
}
