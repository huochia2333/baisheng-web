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
  onAuthStateChange?: (context: AuthStateChangeContext) => Promise<void> | void;
  onReady?: (context: AuthSessionContext) => Promise<void> | void;
};

export function useAuthSessionMonitor(
  supabase: SupabaseClient | null,
  { onAuthStateChange, onReady }: UseAuthSessionMonitorOptions,
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
    const context: AuthSessionContext = {
      isMounted: () => mounted,
    };

    void runReady(context);

    const authListener = hasAuthStateChangeHandler
      ? supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) {
            return;
          }

          void runAuthStateChange({
            ...context,
            event,
            session,
          });
        })
      : null;

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, [hasAuthStateChangeHandler, supabase]);
}
