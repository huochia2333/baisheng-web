import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import { canReadOrderCostByRole } from "./admin-orders-viewer";
import type {
  AdminOrderCostRow,
  AdminOrderRow,
} from "./admin-orders-types";
import type { AppRole, UserStatus } from "./user-self-service";

export async function getAdminOrderCosts(
  supabase: SupabaseClient,
  orderOverviewIds: string[],
): Promise<AdminOrderCostRow[]> {
  if (orderOverviewIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_internal_cost")
      .select("order_overview_id,cost_amount")
      .in("order_overview_id", orderOverviewIds)
      .returns<AdminOrderCostRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function canViewOrderCosts(
  role: AppRole | null,
  status: UserStatus | null,
): boolean {
  return canReadOrderCostByRole(role, status);
}

export function mergeAdminOrdersWithCosts(
  orders: AdminOrderRow[],
  costRows: AdminOrderCostRow[],
): AdminOrderRow[] {
  const costByOrderId = new Map(
    costRows.map((item) => [item.order_overview_id, item.cost_amount]),
  );

  return orders.map((order) => ({
    ...order,
    cost_amount: costByOrderId.get(order.id) ?? null,
  }));
}
