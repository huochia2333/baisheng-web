import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "./auth-routing";
import { normalizeUserStatus } from "./auth-metadata";
import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSalesmanBusinessBoards,
  salesmanBusinessBoardsInclude,
} from "./salesman-business-access";
import { getCurrentSessionContext, type UserStatus } from "./user-self-service";
import { normalizeOptionalString } from "./value-normalizers";

export const SALESMAN_CUSTOMER_TYPE_OPTIONS = [
  "retail",
  "wholesale",
] as const;

export type SalesmanCustomerType =
  (typeof SALESMAN_CUSTOMER_TYPE_OPTIONS)[number];

export type SalesmanCustomerRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: UserStatus;
  customer_type: SalesmanCustomerType | null;
  marked_at: string | null;
  created_at: string;
};

export type SalesmanPeoplePageData = {
  hasPermission: boolean;
  currentViewerId: string | null;
  customers: SalesmanCustomerRow[];
};

export function canViewSalesmanPeople(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return role === "salesman" && status === "active";
}

export function isSalesmanCustomerType(
  value: unknown,
): value is SalesmanCustomerType {
  return value === "retail" || value === "wholesale";
}

export async function getSalesmanPeoplePageData(
  supabase: SupabaseClient,
): Promise<SalesmanPeoplePageData> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    !canViewSalesmanPeople(sessionContext.role, sessionContext.status)
  ) {
    return {
      hasPermission: false,
      currentViewerId: sessionContext.user?.id ?? null,
      customers: [],
    };
  }

  const businessBoards = await getCurrentSalesmanBusinessBoards(supabase);

  if (!salesmanBusinessBoardsInclude(businessBoards, "dropshipping")) {
    return {
      hasPermission: false,
      currentViewerId: sessionContext.user.id,
      customers: [],
    };
  }

  return {
    hasPermission: true,
    currentViewerId: sessionContext.user.id,
    customers: await getSalesmanCustomerDirectory(supabase),
  };
}

export async function getSalesmanCustomerDirectory(
  supabase: SupabaseClient,
): Promise<SalesmanCustomerRow[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_salesman_customer_directory"),
  );

  if (error) {
    throw error;
  }

  return normalizeSalesmanCustomerRows(data);
}

function normalizeSalesmanCustomerRows(value: unknown): SalesmanCustomerRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeSalesmanCustomerRow(item))
    .filter((item): item is SalesmanCustomerRow => item !== null);
}

export function normalizeSalesmanCustomerRow(
  value: unknown,
): SalesmanCustomerRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const userId = normalizeOptionalString(value.user_id);
  const status = normalizeUserStatus(value.status);
  const createdAt = normalizeOptionalString(value.created_at);

  if (!userId || !status || !createdAt) {
    return null;
  }

  return {
    user_id: userId,
    name: normalizeOptionalString(value.name),
    email: normalizeOptionalString(value.email),
    phone: normalizeOptionalString(value.phone),
    city: normalizeOptionalString(value.city),
    status,
    customer_type: isSalesmanCustomerType(value.customer_type)
      ? value.customer_type
      : null,
    marked_at: normalizeOptionalString(value.marked_at),
    created_at: createdAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
