"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const portalHost = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousTouchAction = document.body.style.touchAction;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!portalHost) {
    return null;
  }

  const overlayTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: "easeOut" as const };

  const dialogTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.button
            aria-label="Close dialog"
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[rgba(24,31,38,0.34)]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            style={{ willChange: "opacity" }}
            transition={overlayTransition}
            type="button"
          />

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/85 bg-[#fbfaf8] shadow-[0_20px_60px_rgba(35,49,58,0.18)]"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: 16 }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: 20 }}
            role="dialog"
            style={{
              backfaceVisibility: "hidden",
              willChange: "transform, opacity",
            }}
            transition={dialogTransition}
          >
            <div className="flex items-start justify-between gap-6 border-b border-[#ebe7e1] px-6 py-5 sm:px-8">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#23313a]" id={titleId}>
                  {title}
                </h3>
                {description ? (
                  <p className="mt-2 text-sm leading-7 text-[#69747d]" id={descriptionId}>
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#486782] transition-colors duration-200 hover:bg-[#eef3f6]"
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

            <div className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-8">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    portalHost,
  );
}
