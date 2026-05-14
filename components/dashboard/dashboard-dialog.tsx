"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type DashboardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const DIALOG_FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const subscribeToClientReady = () => () => {};
const getClientReadySnapshot = () => true;
const getServerReadySnapshot = () => false;

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
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );
  const portalHost = clientReady ? document.body : null;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !portalHost) {
      return;
    }

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

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
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialogElement = dialogRef.current;

      if (!dialogElement) {
        return;
      }

      const focusableElements = getFocusableElements(dialogElement);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!activeElement || !dialogElement.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    };

    const focusInitialElement = () => {
      const dialogElement = dialogRef.current;

      if (!dialogElement) {
        return;
      }

      const focusableElements = getFocusableElements(dialogElement);
      const initialFocusTarget =
        focusableElements[0] ?? closeButtonRef.current ?? dialogElement;

      initialFocusTarget.focus();
    };

    const frameId = window.requestAnimationFrame(focusInitialElement);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [onOpenChange, open, portalHost]);

  if (!portalHost) {
    return null;
  }

  const overlayTransition = { duration: 0.18, ease: "easeOut" as const };
  const dialogTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

  return createPortal(
    <AnimatePresence>
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
            tabIndex={-1}
            transition={overlayTransition}
            type="button"
          />

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/85 bg-[#fbfaf8] shadow-[0_20px_60px_rgba(35,49,58,0.18)]"
            exit={{ opacity: 0, scale: 0.985, y: 16 }}
            initial={{ opacity: 0, scale: 0.985, y: 20 }}
            ref={dialogRef}
            role="dialog"
            style={{
              backfaceVisibility: "hidden",
              willChange: "transform, opacity",
            }}
            tabIndex={-1}
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
                aria-label="Close dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#486782] transition-colors duration-200 hover:bg-[#eef3f6]"
                onClick={() => onOpenChange(false)}
                ref={closeButtonRef}
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

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.tabIndex < 0) {
      return false;
    }

    return (
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true" &&
      (element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element.getClientRects().length > 0)
    );
  });
}
