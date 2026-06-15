"use client";

import type { ReactNode } from "react";

export type WholesaleDetailGridRow = {
  label: string;
  value: ReactNode;
};

export function WholesaleDetailGrid({ rows }: { rows: WholesaleDetailGridRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          className="min-w-0 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3"
          key={row.label}
        >
          <p className="text-xs font-semibold text-[#71808d]">{row.label}</p>
          <div className="mt-1 min-w-0 break-words text-sm text-[#263640] [overflow-wrap:anywhere]">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}
