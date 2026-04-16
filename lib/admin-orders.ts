import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";

const ADMIN_ORDER_SELECT =
  "id,order_number,original_currency,amount,daily_exchange_rate,transaction_rate,rmb_amount,order_entry_user,ordering_user,order_status,order_type,created_at,reviewed_at,deleted_at";

export type AdminOrderRow = {
  id: string;
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
  deleted_at: string | null;
  cost_amount: number | string | null;
};

export type OrderUserOption = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string;
  role: AppRole | null;
};

export type BusinessCategoryOption = {
  id: string;
  category: string;
};

export type PurchaseOrderTypeOption = {
  id: string;
  business_subcategory: string;
};

export type ServiceOrderTypeOption = {
  id: string;
  business_subcategory: string;
};

export type OrderDiscountTypeOption = {
  id: string;
  discount_ratio: number | string;
};

export type CreateAdminOrderInput = {
  originalCurrency: string;
  amount: number;
  dailyExchangeRate: number;
  transactionRate: number;
  rmbAmount: number;
  costAmount?: number | null;
  orderEntryUser: string;
  orderingUser: string;
  orderStatus: string;
  orderType: string;
  supplementary?: CreateAdminOrderSupplementaryInput | null;
};

export type UpdateAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber: string;
};

export type AdminOrderDetailValue =
  | string
  | number
  | boolean
  | null
  | AdminOrderDetailValue[]
  | { [key: string]: AdminOrderDetailValue };

export type AdminOrderSupplementaryDetail =
  | {
      kind: "purchase";
      orderNumber: string;
      subtypeId: string;
      subtype: string | null;
      details: AdminOrderDetailValue;
    }
  | {
      kind: "service";
      orderNumber: string;
      subtypeId: string;
      subtype: string | null;
      discountId: string;
      discountRatio: number | string | null;
      details: AdminOrderDetailValue;
    };

export type CreateAdminOrderSupplementaryInput =
  | {
      kind: "purchase";
      subtypeId: string;
      details: AdminOrderDetailValue;
    }
  | {
      kind: "service";
      subtypeId: string;
      discountId: string;
      details: AdminOrderDetailValue;
    };

type PurchaseOrderRecord = {
  order_overview_id: string;
  order_type: string;
  order_details: AdminOrderDetailValue;
};

type PurchaseOrderTypeRecord = {
  business_subcategory: string | null;
};

type ServiceOrderRecord = {
  order_overview_id: string;
  order_type: string;
  order_discount: string;
  order_details: AdminOrderDetailValue;
};

type ServiceOrderTypeRecord = {
  business_subcategory: string | null;
};

type OrderDiscountTypeRecord = {
  discount_ratio: number | string | null;
};

type OrderOverviewReference = {
  id: string;
  order_number: string;
};

type AdminOrderCostRow = {
  order_overview_id: string;
  cost_amount: number | string | null;
};

type SaveAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber?: string | null;
};

export type OrderViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

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

export async function getAdminOrders(
  supabase: SupabaseClient,
  limit = MAX_DASHBOARD_QUERY_ROWS,
): Promise<AdminOrderRow[]> {
  const { from, to } = getDashboardQueryRange(limit);
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(ADMIN_ORDER_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<AdminOrderRow[]>(),
  );

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    ...item,
    cost_amount: null,
  }));
}

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

export async function getAdminOrderSupplementaryDetail(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<AdminOrderSupplementaryDetail | null> {
  const overview = await getOrderOverviewReference(supabase, orderNumber);

  if (!overview) {
    return null;
  }

  const [purchaseResult, serviceResult] = await Promise.all([
    withRequestTimeout(
      supabase
        .from("purchase_order")
        .select("order_overview_id,order_type,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<PurchaseOrderRecord>(),
    ),
    withRequestTimeout(
      supabase
        .from("service_order")
        .select("order_overview_id,order_type,order_discount,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<ServiceOrderRecord>(),
    ),
  ]);

  if (purchaseResult.error) {
    throw purchaseResult.error;
  }

  if (serviceResult.error) {
    throw serviceResult.error;
  }

  if (purchaseResult.data) {
    const { data: purchaseType, error: purchaseTypeError } = await withRequestTimeout(
      supabase
        .from("purchase_order_type")
        .select("business_subcategory")
        .eq("id", purchaseResult.data.order_type)
        .maybeSingle<PurchaseOrderTypeRecord>(),
    );

    if (purchaseTypeError) {
      throw purchaseTypeError;
    }

    return {
      kind: "purchase",
      orderNumber: overview.order_number,
      subtypeId: purchaseResult.data.order_type,
      subtype: purchaseType?.business_subcategory ?? null,
      details: purchaseResult.data.order_details,
    };
  }

  if (serviceResult.data) {
    const [serviceTypeResult, discountTypeResult] = await Promise.all([
      withRequestTimeout(
        supabase
          .from("service_order_type")
          .select("business_subcategory")
          .eq("id", serviceResult.data.order_type)
          .maybeSingle<ServiceOrderTypeRecord>(),
      ),
      withRequestTimeout(
        supabase
          .from("order_discount_type")
          .select("discount_ratio")
          .eq("id", serviceResult.data.order_discount)
          .maybeSingle<OrderDiscountTypeRecord>(),
      ),
    ]);

    if (serviceTypeResult.error) {
      throw serviceTypeResult.error;
    }

    if (discountTypeResult.error) {
      throw discountTypeResult.error;
    }

    return {
      kind: "service",
      orderNumber: overview.order_number,
      subtypeId: serviceResult.data.order_type,
      subtype: serviceTypeResult.data?.business_subcategory ?? null,
      discountId: serviceResult.data.order_discount,
      discountRatio: discountTypeResult.data?.discount_ratio ?? null,
      details: serviceResult.data.order_details,
    };
  }

  return null;
}

export async function createAdminOrder(
  supabase: SupabaseClient,
  input: CreateAdminOrderInput,
): Promise<AdminOrderRow> {
  const savedOrderId = await saveAdminOrder(supabase, input);
  return getRequiredAdminOrderById(supabase, savedOrderId, "Order creation");
}

export async function updateAdminOrder(
  supabase: SupabaseClient,
  input: UpdateAdminOrderInput,
): Promise<AdminOrderRow> {
  const savedOrderId = await saveAdminOrder(supabase, input);
  return getRequiredAdminOrderById(supabase, savedOrderId, "Order update");
}

export async function deleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<void> {
  await runDeleteAdminOrder(supabase, orderNumber, false);
}

export async function forceDeleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<void> {
  await runDeleteAdminOrder(supabase, orderNumber, true);
}

async function runDeleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
  force: boolean,
): Promise<void> {
  const normalizedOrderNumber = orderNumber.trim();

  if (!normalizedOrderNumber) {
    throw new Error("Order number is required.");
  }

  const { error } = await withRequestTimeout(
    supabase.rpc("delete_order", {
      p_order_number: normalizedOrderNumber,
      p_force: force,
    }),
  );

  if (error) {
    throw error;
  }
}

async function getAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
): Promise<AdminOrderRow | null> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(ADMIN_ORDER_SELECT)
      .eq("id", orderId)
      .maybeSingle<AdminOrderRow>(),
  );

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const viewer = await getCurrentOrderViewerContext(supabase);

  if (!viewer || !canViewOrderCosts(viewer.role, viewer.status)) {
    return {
      ...data,
      cost_amount: null,
    };
  }

  const { data: costData, error: costError } = await withRequestTimeout(
    supabase
      .from("order_internal_cost")
      .select("order_overview_id,cost_amount")
      .eq("order_overview_id", orderId)
      .maybeSingle<AdminOrderCostRow>(),
  );

  if (costError) {
    throw costError;
  }

  return {
    ...data,
    cost_amount: costData?.cost_amount ?? null,
  };
}

async function getRequiredAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
  actionLabel: string,
): Promise<AdminOrderRow> {
  const data = await getAdminOrderById(supabase, orderId);

  if (!data) {
    throw new Error(`${actionLabel} succeeded, but the saved order could not be reloaded.`);
  }

  return data;
}

async function saveAdminOrder(
  supabase: SupabaseClient,
  input: SaveAdminOrderInput,
): Promise<string> {
  const hasCostAmount = Object.prototype.hasOwnProperty.call(input, "costAmount");

  const { data, error } = await withRequestTimeout(
    supabase.rpc("save_order", {
      p_original_currency: input.originalCurrency,
      p_amount: input.amount,
      p_daily_exchange_rate: input.dailyExchangeRate,
      p_transaction_rate: input.transactionRate,
      p_rmb_amount: input.rmbAmount,
      p_order_entry_user: input.orderEntryUser,
      p_ordering_user: input.orderingUser,
      p_order_status: input.orderStatus,
      p_order_type: input.orderType,
      p_supplementary: input.supplementary ?? null,
      p_original_order_number: input.originalOrderNumber ?? null,
      p_cost_amount: hasCostAmount ? (input.costAmount ?? null) : null,
      p_has_cost: hasCostAmount ? input.costAmount !== null : null,
    }),
  );

  if (error) {
    throw error;
  }

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("The order save RPC did not return a valid order id.");
  }

  return data.trim();
}

async function getOrderOverviewReference(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<OrderOverviewReference | null> {
  const normalizedOrderNumber = orderNumber.trim();

  if (!normalizedOrderNumber) {
    return null;
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select("id,order_number")
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle<OrderOverviewReference>(),
  );

  if (error) {
    throw error;
  }

  return data ?? null;
}

function normalizeAppRole(value: unknown): AppRole | null {
  if (
    value === "administrator" ||
    value === "operator" ||
    value === "manager" ||
    value === "recruiter" ||
    value === "salesman" ||
    value === "finance" ||
    value === "client"
  ) {
    return value;
  }

  return null;
}

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "inactive" || value === "active" || value === "suspended") {
    return value;
  }

  return null;
}
