"use client";

import type { ReactNode } from "react";

import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardSegmentedTabOption<Key extends string> = {
  badge?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  key: Key;
  label: ReactNode;
};

type DashboardSegmentedTabsProps<Key extends string> = {
  className?: string;
  onChange: (value: Key) => void;
  options: Array<DashboardSegmentedTabOption<Key>>;
  pendingValue?: Key | null;
  value: Key;
};

export function DashboardSegmentedTabs<Key extends string>({
  className,
  onChange,
  options,
  pendingValue = null,
  value,
}: DashboardSegmentedTabsProps<Key>) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-[22px] border border-[#dfe5ea] bg-white/78 p-2 shadow-[0_12px_28px_rgba(96,113,128,0.06)] sm:flex-row",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.key === value;
        const isPending = option.key === pendingValue;

        return (
          <button
            aria-pressed={isActive}
            aria-busy={isPending}
            className={cn(
              "flex min-h-12 flex-1 items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm transition-colors",
              isActive
                ? "bg-[#486782] text-white shadow-[0_12px_24px_rgba(72,103,130,0.18)]"
                : "bg-[#f5f7f8] text-[#52616d] hover:bg-[#edf2f5] hover:text-[#23313a]",
            )}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.icon || isPending ? (
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                  isActive ? "bg-white/16 text-white" : "bg-white text-[#486782]",
                )}
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  option.icon
                )}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-semibold">{option.label}</span>
                {option.badge ? (
                  <span
                    className={cn(
                      "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      isActive
                        ? "bg-white/18 text-white"
                        : "bg-white text-[#486782]",
                    )}
                  >
                    {option.badge}
                  </span>
                ) : null}
              </span>
              {option.description ? (
                <span
                  className={cn(
                    "mt-1 block text-xs leading-5",
                    isActive ? "text-white/78" : "text-[#72808a]",
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
