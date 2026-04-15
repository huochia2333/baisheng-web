"use client";

import { useEffect, useRef } from "react";

type UseResumeRecoveryOptions = {
  enabled?: boolean;
  minIntervalMs?: number;
  staleAfterMs?: number;
};

export function useResumeRecovery(
  onRecover: () => void,
  options: UseResumeRecoveryOptions = {},
) {
  const callbackRef = useRef(onRecover);
  const {
    enabled = true,
    minIntervalMs = 10_000,
    staleAfterMs = 180_000,
  } = options;
  const lastHiddenAtRef = useRef<number | null>(null);
  const lastRecoveryAtRef = useRef(0);

  useEffect(() => {
    callbackRef.current = onRecover;
  }, [onRecover]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    if (lastRecoveryAtRef.current === 0) {
      lastRecoveryAtRef.current = Date.now();
    }

    const maybeRecover = ({ requireStale }: { requireStale: boolean }) => {
      const now = Date.now();

      if (now - lastRecoveryAtRef.current < minIntervalMs) {
        return;
      }

      if (requireStale && now - lastRecoveryAtRef.current < staleAfterMs) {
        return;
      }

      lastRecoveryAtRef.current = now;
      callbackRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = lastHiddenAtRef.current;
      lastHiddenAtRef.current = null;

      if (hiddenAt === null) {
        return;
      }

      if (Date.now() - hiddenAt < staleAfterMs) {
        return;
      }

      maybeRecover({ requireStale: false });
    };

    const handleFocus = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      maybeRecover({ requireStale: true });
    };

    const handleOnline = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      maybeRecover({ requireStale: false });
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (document.visibilityState !== "visible") {
        return;
      }

      maybeRecover({ requireStale: !event.persisted });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [enabled, minIntervalMs, staleAfterMs]);
}
