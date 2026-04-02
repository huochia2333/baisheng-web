const PAGE_VISIBILITY_ABORT_ERROR_NAME = "PageVisibilityAbortError";

export function isPageVisible() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState !== "hidden";
}

export function waitForPageVisible(options: { signal?: AbortSignal } = {}) {
  const { signal } = options;

  if (isPageVisible()) {
    return Promise.resolve();
  }

  if (signal?.aborted) {
    const abortError = new Error("Page visibility wait aborted.");
    abortError.name = PAGE_VISIBILITY_ABORT_ERROR_NAME;
    return Promise.reject(abortError);
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      signal?.removeEventListener("abort", handleAbort);
    };

    const handleVisibilityChange = () => {
      if (!isPageVisible()) {
        return;
      }

      cleanup();
      resolve();
    };

    const handleAbort = () => {
      cleanup();

      const abortError = new Error("Page visibility wait aborted.");
      abortError.name = PAGE_VISIBILITY_ABORT_ERROR_NAME;
      reject(abortError);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

export function setPageVisibleTimeout(callback: () => void, delayMs: number) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    const timeoutId = globalThis.setTimeout(callback, delayMs);

    return {
      clear() {
        globalThis.clearTimeout(timeoutId);
      },
    };
  }

  let remainingMs = delayMs;
  let timeoutId: number | null = null;
  let timerStartedAt: number | null = null;
  let cleared = false;

  const clearTimer = () => {
    if (timeoutId === null) {
      return;
    }

    window.clearTimeout(timeoutId);
    timeoutId = null;
    timerStartedAt = null;
  };

  const cleanup = () => {
    if (cleared) {
      return;
    }

    cleared = true;
    clearTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const handleTimeout = () => {
    cleanup();
    callback();
  };

  const startTimer = () => {
    if (cleared || timeoutId !== null || !isPageVisible()) {
      return;
    }

    timerStartedAt = Date.now();
    timeoutId = window.setTimeout(handleTimeout, remainingMs);
  };

  const pauseTimer = () => {
    if (timeoutId === null || timerStartedAt === null) {
      return;
    }

    remainingMs = Math.max(0, remainingMs - (Date.now() - timerStartedAt));
    clearTimer();
  };

  const handleVisibilityChange = () => {
    if (isPageVisible()) {
      startTimer();
      return;
    }

    pauseTimer();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  startTimer();

  return {
    clear: cleanup,
  };
}

export function isPageVisibilityAbortError(error: unknown) {
  return error instanceof Error && error.name === PAGE_VISIBILITY_ABORT_ERROR_NAME;
}
