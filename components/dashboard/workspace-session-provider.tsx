"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import {
  getDefaultWorkspaceBasePath,
  getWorkspaceBasePath,
} from "@/lib/auth-routing";
import { getRoleFromAuthClaims } from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useBrowserCloudSyncRecovery } from "@/lib/use-browser-cloud-sync-recovery";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

type WorkspaceSessionContextValue = {
  recoverCloudSync: () => void;
  syncVersion: number;
};

type WorkspaceSyncEffectContext = {
  isMounted: () => boolean;
  syncVersion: number;
};

const WorkspaceSessionContext = createContext<WorkspaceSessionContextValue>({
  recoverCloudSync: () => {},
  syncVersion: 0,
});

export function WorkspaceSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const { recoverCloudSync, syncGeneration } = useBrowserCloudSyncRecovery();
  const [syncVersion, setSyncVersion] = useState(0);
  const hasHandledInitialReadyRef = useRef(false);

  const bumpSyncVersion = useCallback(() => {
    setSyncVersion((current) => current + 1);
  }, []);

  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent: true,
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) => {
      if (!hasHandledInitialReadyRef.current) {
        hasHandledInitialReadyRef.current = true;
        return;
      }

      if (!isMounted()) {
        return;
      }

      bumpSyncVersion();
    },
    onAuthStateChange: async ({ event, isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      if (!supabase) {
        return;
      }

      const currentBasePath = getWorkspaceBasePath(pathname);

      if (currentBasePath) {
        const role = await getRoleFromAuthClaims(supabase, session.user);

        if (role) {
          const desiredBasePath = getDefaultWorkspaceBasePath(role);

          if (currentBasePath !== desiredBasePath) {
            const suffix = pathname.slice(currentBasePath.length) || "/my";
            router.replace(`${desiredBasePath}${suffix}`);
            return;
          }
        }
      }

      if (event === "INITIAL_SESSION") {
        return;
      }

      bumpSyncVersion();
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const value = useMemo(
    () => ({
      recoverCloudSync,
      syncVersion,
    }),
    [recoverCloudSync, syncVersion],
  );

  return (
    <WorkspaceSessionContext.Provider value={value}>
      {children}
    </WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceSyncVersion() {
  return useContext(WorkspaceSessionContext).syncVersion;
}

export function useWorkspaceRecoverCloudSync() {
  return useContext(WorkspaceSessionContext).recoverCloudSync;
}

export function useWorkspaceSyncEffect(
  effect: (context: WorkspaceSyncEffectContext) => Promise<void> | void,
) {
  const syncVersion = useWorkspaceSyncVersion();

  useEffect(() => {
    if (syncVersion === 0) {
      return;
    }

    let mounted = true;

    void effect({
      isMounted: () => mounted,
      syncVersion,
    });

    return () => {
      mounted = false;
    };
  }, [effect, syncVersion]);
}
