"use client";

import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";

import { useSupabaseAuthSync } from "./use-supabase-auth-sync";

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
  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent,
    onAuthStateChange: onAuthStateChange
      ? ({ event, isMounted, session }) =>
          onAuthStateChange({
            event,
            isMounted,
            session,
          })
      : undefined,
    onReady: onReady
      ? ({ isMounted }) =>
          onReady({
            isMounted,
          })
      : undefined,
  });
}
