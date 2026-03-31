import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getCurrentSessionContext, type AppRole } from "./user-self-service";

const ADMIN_ORDER_SELECT =
  "order_number,original_currency,amount,daily_exchange_rate,transaction_rate,rmb_amount,order_entry_user,ordering_user,order_status,order_type,created_at,reviewed_at,order_remark,deleted_at";

export type AdminOrderRow = {
  order_number: string;
  original_currency: string | null;
  amount: number | string | null;
  daily_exchange_rate: number | string | null;
  transaction_rate: number | string | null;
  rmb_amount: number | string | null;
  order_entry_user: string | null;
  ordering_user: string | null;
  order_status: string | null;
  order_type: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  order_remark: string | null;
  deleted_at: string | null;
};

export type OrderUserOption = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
};

export type BusinessCategoryOption = {
  id: string;
  category: string;
};

export type CreateAdminOrderInput = {
  orderNumber: string;
  originalCurrency: string;
  amount: number;
  dailyExchangeRate: number;
  transactionRate: number;
  rmbAmount: number;
  orderEntryUser: string;
  orderingUser: string;
  orderStatus: string;
  orderType: string;
  createdAt: string;
  reviewedAt: string;
  orderRemark: string | null;
};

export type UpdateAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber: string;
};

export async function getCurrentOrderViewerContext(
  supabase: SupabaseClient,
): Promise<{ user: User; role: AppRole | null } | null> {
  const { user, role } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return {
    user,
    role,
  };
}

export async function getAdminOrders(
  supabase: SupabaseClient,
): Promise<AdminOrderRow[]> {
  const { data, error } = await supabase
    .from("order_overview")
    .select(ADMIN_ORDER_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<AdminOrderRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrderUserOptions(
  supabase: SupabaseClient,
): Promise<OrderUserOption[]> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,name,email,status,created_at")
    .order("created_at", { ascending: true })
    .returns<OrderUserOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<BusinessCategoryOption[]> {
  const { data, error } = await supabase
    .from("business_category")
    .select("id,category")
    .order("category", { ascending: true })
    .returns<BusinessCategoryOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createAdminOrder(
  supabase: SupabaseClient,
  input: CreateAdminOrderInput,
): Promise<AdminOrderRow> {
  const { data, error } = await supabase
    .from("order_overview")
    .insert({
      order_number: input.orderNumber,
      original_currency: input.originalCurrency,
      amount: input.amount,
      daily_exchange_rate: input.dailyExchangeRate,
      transaction_rate: input.transactionRate,
      rmb_amount: input.rmbAmount,
      order_entry_user: input.orderEntryUser,
      ordering_user: input.orderingUser,
      order_status: input.orderStatus,
      order_type: input.orderType,
      created_at: input.createdAt,
      reviewed_at: input.reviewedAt,
      order_remark: input.orderRemark,
    })
    .select(ADMIN_ORDER_SELECT)
    .maybeSingle<AdminOrderRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("订单创建后未返回结果，请稍后刷新页面查看。");
  }

  return data;
}

export async function updateAdminOrder(
  supabase: SupabaseClient,
  input: UpdateAdminOrderInput,
): Promise<AdminOrderRow> {
  const { data, error } = await supabase
    .from("order_overview")
    .update({
      order_number: input.orderNumber,
      original_currency: input.originalCurrency,
      amount: input.amount,
      daily_exchange_rate: input.dailyExchangeRate,
      transaction_rate: input.transactionRate,
      rmb_amount: input.rmbAmount,
      order_entry_user: input.orderEntryUser,
      ordering_user: input.orderingUser,
      order_status: input.orderStatus,
      order_type: input.orderType,
      created_at: input.createdAt,
      reviewed_at: input.reviewedAt,
      order_remark: input.orderRemark,
    })
    .eq("order_number", input.originalOrderNumber)
    .select(ADMIN_ORDER_SELECT)
    .maybeSingle<AdminOrderRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("订单更新后未返回结果，请稍后刷新页面查看。");
  }

  return data;
}

export async function deleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<void> {
  const { error } = await supabase
    .from("order_overview")
    .delete()
    .eq("order_number", orderNumber);

  if (error) {
    throw error;
  }
}
