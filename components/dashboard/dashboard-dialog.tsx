"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { X } from "lucide-react";

type DashboardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardDialog({
  open,
  onOpenChange,
  title,
  description,
  actions,
  children,
}: DashboardDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="关闭弹窗"
        className="absolute inset-0 animate-in fade-in duration-200 bg-[rgba(24,31,38,0.42)] backdrop-blur-[4px]"
        onClick={() => onOpenChange(false)}
        type="button"
      />

      <div
        aria-modal="true"
        className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex-col overflow-hidden rounded-[30px] border border-white/85 bg-[#fbfaf8] shadow-[0_26px_80px_rgba(35,49,58,0.24)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-6 border-b border-[#ebe7e1] px-6 py-5 sm:px-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 text-sm leading-7 text-[#69747d]">{description}</p>
            ) : null}
          </div>

          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#486782] transition-colors hover:bg-[#eef3f6]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[#ebe7e1] px-6 py-4 sm:px-8">
            {actions}
          </div>
        ) : null}

        <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
