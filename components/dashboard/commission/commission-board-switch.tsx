"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BoardOption<Key extends string> = {
  key: Key;
  title: string;
  description: string;
  meta: string;
  icon?: ReactNode;
};

export function CommissionBoardSwitch<Key extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<BoardOption<Key>>;
  value: Key;
  onChange: (value: Key) => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {options.map((option) => {
        const isActive = option.key === value;

        return (
          <button
            key={option.key}
            className={cn(
              "rounded-[26px] border px-5 py-5 text-left transition",
              isActive
                ? "border-[#bfd2e1] bg-[#f6fafc] shadow-[0_14px_30px_rgba(96,113,128,0.08)]"
                : "border-white/85 bg-white/72 shadow-[0_12px_28px_rgba(96,113,128,0.05)] hover:bg-[#fbfcfd]",
            )}
            onClick={() => onChange(option.key)}
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {option.icon ? (
                    <span
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-full",
                        isActive ? "bg-[#e4edf3] text-[#486782]" : "bg-[#f0f4f7] text-[#6d7c88]",
                      )}
                    >
                      {option.icon}
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold tracking-tight text-[#22313a]">
                    {option.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#67727b]">
                  {option.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                  isActive ? "bg-[#dfeaf2] text-[#486782]" : "bg-[#eef2f5] text-[#70808c]",
                )}
              >
                {option.meta}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
