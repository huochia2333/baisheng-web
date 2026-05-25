"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_STALE_FOCUS_RECOVERY_MS = 180_000;

export function useStaleFocusRecovery(
  staleAfterMs = DEFAULT_STALE_FOCUS_RECOVERY_MS,
) {
  const forceFullPageLoadRef = useRef(false);
  const lastInactiveAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const markInactive = () => {
      lastInactiveAtRef.current = Date.now();
    };

    const markActive = () => {
      const inactiveAt = lastInactiveAtRef.current;
      lastInactiveAtRef.current = null;

      if (inactiveAt === null) {
        return;
      }

      if (Date.now() - inactiveAt >= staleAfterMs) {
        forceFullPageLoadRef.current = true;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markInactive();
        return;
      }

      markActive();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        forceFullPageLoadRef.current = true;
        return;
      }

      markActive();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", markInactive);
    window.addEventListener("focus", markActive);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", markInactive);
      window.removeEventListener("focus", markActive);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [staleAfterMs]);

  return useCallback(() => {
    if (!forceFullPageLoadRef.current) {
      return false;
    }

    forceFullPageLoadRef.current = false;
    return true;
  }, []);
}
