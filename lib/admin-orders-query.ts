import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type { AdminOrderRow } from "./admin-orders";

export const ADMIN_ORDER_SELECT =
  "id,order_number,original_currency,amount,daily_exchange_rate,transaction_rate,rmb_amount,order_entry_user,ordering_user,order_status,order_type,created_at,reviewed_at,deleted_at";

export type AdminOrderOverviewFilters = {
  orderEntryUserIds?: string[];
  orderNumber?: string;
  orderStatus?: string;
  orderingUserIds?: string[];
};

type AdminOrderQueryOptions = {
  filters?: AdminOrderOverviewFilters;
  range?: {
    from: number;
    to: number;
  };
};

type AdminOrderFilterQuery<TQuery> = {
  eq(column: string, value: string): TQuery;
  ilike(column: string, value: string): TQuery;
  in(column: string, values: string[]): TQuery;
};

export async function queryAdminOrders(
  supabase: SupabaseClient,
  options: AdminOrderQueryOptions = {},
): Promise<AdminOrderRow[]> {
  let query = supabase
    .from("order_overview")
    .select(ADMIN_ORDER_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  query = applyAdminOrderOverviewFilters(query, options.filters);

  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  }

  const { data, error } = await withRequestTimeout(query.returns<AdminOrderRow[]>());

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    ...item,
    cost_amount: null,
  }));
}

export async function getAdminOrderCount(
  supabase: SupabaseClient,
  filters?: AdminOrderOverviewFilters,
): Promise<number> {
  let query = supabase
    .from("order_overview")
    .select("id", {
      count: "exact",
      head: true,
    })
    .is("deleted_at", null);

  query = applyAdminOrderOverviewFilters(query, filters);

  const { count, error } = await withRequestTimeout(query);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function applyAdminOrderOverviewFilters<TQuery extends AdminOrderFilterQuery<TQuery>>(
  query: TQuery,
  filters?: AdminOrderOverviewFilters,
) {
  let nextQuery = query;

  if (filters?.orderStatus) {
    nextQuery = nextQuery.eq("order_status", filters.orderStatus);
  }

  if (filters?.orderNumber) {
    nextQuery = nextQuery.ilike("order_number", `%${filters.orderNumber}%`);
  }

  if (filters?.orderEntryUserIds && filters.orderEntryUserIds.length > 0) {
    nextQuery = nextQuery.in("order_entry_user", filters.orderEntryUserIds);
  }

  if (filters?.orderingUserIds && filters.orderingUserIds.length > 0) {
    nextQuery = nextQuery.in("ordering_user", filters.orderingUserIds);
  }

  return nextQuery;
}
