import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import type { OrderViewerContext } from "./admin-orders-types";

export async function getCurrentOrderViewerContext(
  supabase: SupabaseClient,
): Promise<OrderViewerContext | null> {
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

export function canReadOrderByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman" ||
    role === "client"
  );
}

export function canReadOrderCostByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman"
  );
}
