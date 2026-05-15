import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeAppRole,
  normalizeUserStatus,
} from "./auth-metadata";
import { withRequestTimeout } from "./request-timeout";
import type {
  BusinessCategoryOption,
  OrderDiscountTypeOption,
  OrderUserOption,
  PurchaseOrderTypeOption,
  ServiceOrderTypeOption,
} from "./admin-orders-types";

export async function getOrderUserOptions(
  supabase: SupabaseClient,
): Promise<OrderUserOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_order_user_options"),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => ({
    user_id:
      typeof item === "object" && item !== null && "user_id" in item
        ? String(item.user_id)
        : "",
    name:
      typeof item === "object" && item !== null && "name" in item && typeof item.name === "string"
        ? item.name
        : null,
    email:
      typeof item === "object" && item !== null && "email" in item && typeof item.email === "string"
        ? item.email
        : null,
    status: normalizeUserStatus(
      typeof item === "object" && item !== null && "status" in item ? item.status : null,
    ),
    created_at:
      typeof item === "object" && item !== null && "created_at" in item
        ? String(item.created_at ?? "")
        : "",
    role: normalizeAppRole(
      typeof item === "object" && item !== null && "role" in item ? item.role : null,
    ),
  }));
}

export async function getOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<BusinessCategoryOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("business_category")
      .select("id,category")
      .order("category", { ascending: true })
      .returns<BusinessCategoryOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPurchaseOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<PurchaseOrderTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("purchase_order_type")
      .select("id,business_subcategory")
      .order("business_subcategory", { ascending: true })
      .returns<PurchaseOrderTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getServiceOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<ServiceOrderTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_order_type")
      .select("id,business_subcategory")
      .order("business_subcategory", { ascending: true })
      .returns<ServiceOrderTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrderDiscountTypeOptions(
  supabase: SupabaseClient,
): Promise<OrderDiscountTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_discount_type")
      .select("id,discount_ratio")
      .order("discount_ratio", { ascending: false })
      .returns<OrderDiscountTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}
