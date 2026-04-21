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

export type SalesmanCommissionPageData = {
  hasPermission: boolean;
  commissions: AdminCommissionRow[];
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

export async function getSalesmanCommissionPageData(
  supabase: SupabaseClient,
): Promise<SalesmanCommissionPageData> {
  const viewer = await getCurrentSalesmanCommissionViewerContext(supabase);

  if (!viewer || !canViewSalesmanCommissionBoard(viewer.role, viewer.status)) {
    return {
      hasPermission: false,
      commissions: [],
    };
  }

  return {
    hasPermission: true,
    commissions: await getVisibleSalesmanCommissions(supabase, viewer),
  };
}

export async function getVisibleSalesmanCommissions(
  supabase: SupabaseClient,
  viewer?: SalesmanCommissionViewerContext | null,
  limit?: number,
): Promise<AdminCommissionRow[]> {
  const effectiveViewer =
    viewer ?? (await getCurrentSalesmanCommissionViewerContext(supabase));

  if (
    !effectiveViewer ||
    !canViewSalesmanCommissionBoard(effectiveViewer.role, effectiveViewer.status)
  ) {
    return [];
  }

  return getAdminCommissions(supabase, {
    beneficiaryUserId: effectiveViewer.user.id,
    limit,
  });
}
