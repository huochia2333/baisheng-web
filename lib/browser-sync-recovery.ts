import { resetCurrentSessionCache } from "./user-self-service";

const DEFAULT_STALE_BROWSER_CLOUD_SYNC_MS = 180_000;

let lastBrowserCloudSyncActivityAt = 0;

export function resetBrowserCloudSyncState() {
  resetCurrentSessionCache();
}

export function markBrowserCloudSyncActivity() {
  lastBrowserCloudSyncActivityAt = Date.now();
}

export function shouldRecoverBrowserCloudSyncState(
  staleAfterMs = DEFAULT_STALE_BROWSER_CLOUD_SYNC_MS,
) {
  if (typeof window === "undefined") {
    return false;
  }

  const now = Date.now();

  if (lastBrowserCloudSyncActivityAt === 0) {
    lastBrowserCloudSyncActivityAt = now;
    return false;
  }

  const shouldRecover = now - lastBrowserCloudSyncActivityAt >= staleAfterMs;
  lastBrowserCloudSyncActivityAt = now;

  return shouldRecover;
}
