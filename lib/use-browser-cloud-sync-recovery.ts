"use client";

import { useCallback, useState } from "react";

import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
} from "./browser-sync-recovery";

export function useBrowserCloudSyncRecovery() {
  const [syncGeneration, setSyncGeneration] = useState(0);

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  return {
    recoverCloudSync,
    syncGeneration,
  };
}
