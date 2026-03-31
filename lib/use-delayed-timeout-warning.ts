"use client";

import { useCallback, useEffect, useRef } from "react";

import { isRequestTimeoutError } from "./request-timeout";

const DEFAULT_TIMEOUT_WARNING_DELAY_MS = 15_000;

export function useDelayedTimeoutWarning(
  delayMs = DEFAULT_TIMEOUT_WARNING_DELAY_MS,
) {
  const timerRef = useRef<number | null>(null);

  const clearPendingTimeoutWarning = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const scheduleTimeoutWarning = useCallback(
    (error: unknown, onShowWarning: () => void) => {
      clearPendingTimeoutWarning();

      if (!isRequestTimeoutError(error)) {
        return false;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        onShowWarning();
      }, delayMs);

      return true;
    },
    [clearPendingTimeoutWarning, delayMs],
  );

  useEffect(() => {
    return () => {
      clearPendingTimeoutWarning();
    };
  }, [clearPendingTimeoutWarning]);

  return {
    clearPendingTimeoutWarning,
    scheduleTimeoutWarning,
  };
}
