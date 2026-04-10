import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getAdminCommissions,
  type AdminCommissionRow,
} from "./admin-commission";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";

export type SalesmanCommissionViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export async function getCurrentSalesmanCommissionViewerContext(
  supabase: SupabaseClient,
): Promise<SalesmanCommissionViewerContext | null> {
  const { user, role, status } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return {
    user,
    role,
    status,
  };
}

export function canViewSalesmanCommissionBoard(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return role === "salesman" && status === "active";
}

export async function getVisibleSalesmanCommissions(
  supabase: SupabaseClient,
): Promise<AdminCommissionRow[]> {
  return getAdminCommissions(supabase);
}
