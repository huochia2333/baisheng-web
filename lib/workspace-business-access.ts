import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentSessionContext } from "./current-session-context";
import {
  workspaceBusinessKeys,
  type WorkspaceBusinessKey,
} from "./workspace-config";
import { withRequestTimeout } from "./request-timeout";

export type { WorkspaceBusinessKey } from "./workspace-config";

export const WORKSPACE_BUSINESS_ACCESS_OPTIONS = workspaceBusinessKeys;

export type WorkspaceBusinessAccessLabels = Record<WorkspaceBusinessKey, string>;

export function isWorkspaceBusinessAccessKey(
  value: unknown,
): value is WorkspaceBusinessKey {
  return (
    typeof value === "string" &&
    workspaceBusinessKeys.includes(value as WorkspaceBusinessKey)
  );
}

export function normalizeWorkspaceBusinessAccess(
  value: unknown,
): WorkspaceBusinessKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueWorkspaceBusinessAccess(
    value.filter(isWorkspaceBusinessAccessKey),
  );
}

export function uniqueWorkspaceBusinessAccess(
  businesses: readonly WorkspaceBusinessKey[],
): WorkspaceBusinessKey[] {
  return workspaceBusinessKeys.filter((business) =>
    businesses.includes(business),
  );
}

export function areWorkspaceBusinessAccessListsEqual(
  left: readonly WorkspaceBusinessKey[],
  right: readonly WorkspaceBusinessKey[],
) {
  const normalizedLeft = uniqueWorkspaceBusinessAccess(left);
  const normalizedRight = uniqueWorkspaceBusinessAccess(right);

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((business, index) => business === normalizedRight[index])
  );
}

export function workspaceBusinessAccessIncludes(
  businesses: readonly WorkspaceBusinessKey[],
  business: WorkspaceBusinessKey,
) {
  return businesses.includes(business);
}

export function getDefaultWorkspaceBusinessAccessForRole(
  role: string | null | undefined,
): WorkspaceBusinessKey[] {
  switch (role) {
    case "administrator":
    case "finance":
      // 管理员和财务都需要同时核对旅游与批发两条业务线。
      return ["tourism", "wholesale"];
    case "salesman":
      return ["wholesale"];
    case "promoter":
      return ["tourism"];
    default:
      return ["tourism"];
  }
}

export async function getCurrentWorkspaceBusinessAccess(
  supabase: SupabaseClient,
): Promise<WorkspaceBusinessKey[]> {
  const fallbackAccess = await getFallbackWorkspaceBusinessAccess(supabase);

  try {
    const { data, error } = await withRequestTimeout(
      supabase.rpc("get_current_workspace_business_access"),
    );

    if (error || !Array.isArray(data)) {
      return fallbackAccess;
    }

    const normalizedAccess = normalizeWorkspaceBusinessAccess(
      data.map((item) =>
        typeof item === "object" && item !== null && "business_key" in item
          ? item.business_key
          : null,
      ),
    );

    return normalizedAccess.length > 0 ? normalizedAccess : fallbackAccess;
  } catch {
    return fallbackAccess;
  }
}

async function getFallbackWorkspaceBusinessAccess(
  supabase: SupabaseClient,
): Promise<WorkspaceBusinessKey[]> {
  try {
    const { user, role, status } = await getCurrentSessionContext(supabase);

    if (!user || status !== "active") {
      return [];
    }

    return getDefaultWorkspaceBusinessAccessForRole(role);
  } catch {
    return [];
  }
}
