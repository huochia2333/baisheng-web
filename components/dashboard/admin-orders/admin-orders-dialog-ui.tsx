"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function OrderField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#31424d]">
        <span>{label}</span>
        {required ? <span className="text-[#b13d3d]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

export function OrderSupplementaryFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#23313a]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#66717a]">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function OrderDetailCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#ebe7e1] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm leading-7 text-[#2b3942]",
          multiline ? "whitespace-pre-wrap break-words" : "truncate",
        )}
        title={multiline ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

export const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";
