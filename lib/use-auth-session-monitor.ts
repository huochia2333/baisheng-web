import { useEffect, useEffectEvent } from "react";
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";

type AuthSessionContext = {
  isMounted: () => boolean;
};

type AuthStateChangeContext = AuthSessionContext & {
  event: AuthChangeEvent;
  session: Session | null;
};

type UseAuthSessionMonitorOptions = {
  includeInitialSessionEvent?: boolean;
  onAuthStateChange?: (context: AuthStateChangeContext) => Promise<void> | void;
  onReady?: (context: AuthSessionContext) => Promise<void> | void;
};

export function useAuthSessionMonitor(
  supabase: SupabaseClient | null,
  {
    includeInitialSessionEvent = false,
    onAuthStateChange,
    onReady,
  }: UseAuthSessionMonitorOptions,
) {
  const hasAuthStateChangeHandler = Boolean(onAuthStateChange);

  const runReady = useEffectEvent(async (context: AuthSessionContext) => {
    await onReady?.(context);
  });

  const runAuthStateChange = useEffectEvent(async (context: AuthStateChangeContext) => {
    await onAuthStateChange?.(context);
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    const pendingTimers = new Set<ReturnType<typeof globalThis.setTimeout>>();
    const context: AuthSessionContext = {
      isMounted: () => mounted,
    };

    void runReady(context);

    const authListener = hasAuthStateChangeHandler
      ? supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) {
            return;
          }

          if (event === "INITIAL_SESSION" && !includeInitialSessionEvent) {
            return;
          }

          // Defer follow-up work until the current auth callback has finished.
          const timerId = globalThis.setTimeout(() => {
            pendingTimers.delete(timerId);

            if (!mounted) {
              return;
            }

            void runAuthStateChange({
              ...context,
              event,
              session,
            });
          }, 0);

          pendingTimers.add(timerId);
        })
      : null;

    return () => {
      mounted = false;
      pendingTimers.forEach((timerId) => {
        globalThis.clearTimeout(timerId);
      });
      pendingTimers.clear();
      authListener?.data.subscription.unsubscribe();
    };
  }, [hasAuthStateChangeHandler, includeInitialSessionEvent, supabase]);
}
