import { useEffect, useEffectEvent } from "react";
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  isPageVisibilityAbortError,
  waitForPageVisible,
} from "./page-visibility";

type AuthSyncContext = {
  isMounted: () => boolean;
  signal: AbortSignal;
};

type AuthStateChangeContext = AuthSyncContext & {
  event: AuthChangeEvent;
  session: Session | null;
};

type UseSupabaseAuthSyncOptions = {
  onAuthStateChange?: (context: AuthStateChangeContext) => Promise<void> | void;
  onError?: (error: unknown, context: AuthSyncContext) => void;
  onReady?: (context: AuthSyncContext) => Promise<void> | void;
  refreshKey?: unknown;
  waitForVisibleOnAuthStateChange?: boolean;
};

export function useSupabaseAuthSync(
  supabase: SupabaseClient | null,
  {
    onAuthStateChange,
    onError,
    onReady,
    refreshKey,
    waitForVisibleOnAuthStateChange = true,
  }: UseSupabaseAuthSyncOptions,
) {
  const runReady = useEffectEvent(async (context: AuthSyncContext) => {
    await onReady?.(context);
  });

  const runAuthStateChange = useEffectEvent(async (context: AuthStateChangeContext) => {
    await onAuthStateChange?.(context);
  });

  const handleError = useEffectEvent((error: unknown, context: AuthSyncContext) => {
    onError?.(error, context);
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    const abortController = new AbortController();
    const context: AuthSyncContext = {
      isMounted: () => mounted,
      signal: abortController.signal,
    };

    const runSync = async (
      callback: (() => Promise<void> | void) | undefined,
      waitForVisible: boolean,
    ) => {
      if (!callback) {
        return;
      }

      try {
        if (waitForVisible) {
          await waitForPageVisible({ signal: abortController.signal });
        }

        if (!mounted) {
          return;
        }

        await callback();
      } catch (error) {
        if (isPageVisibilityAbortError(error) || !mounted) {
          return;
        }

        handleError(error, context);
      }
    };

    void runSync(() => runReady(context), true);

    const authListener = onAuthStateChange
      ? supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) {
            return;
          }

          void runSync(
            () =>
              runAuthStateChange({
                ...context,
                event,
                session,
              }),
            waitForVisibleOnAuthStateChange,
          );
        })
      : null;

    return () => {
      mounted = false;
      abortController.abort();
      authListener?.data.subscription.unsubscribe();
    };
  }, [
    onAuthStateChange,
    refreshKey,
    supabase,
    waitForVisibleOnAuthStateChange,
  ]);
}
