import type { SupabaseClient, User } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import { getCurrentSessionContext, type AppRole } from "./user-self-service";

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

type ExistingSupplementaryRecord =
  | {
      kind: "purchase";
      record: PurchaseOrderRecord;
    }
  | {
      kind: "service";
      record: ServiceOrderRecord;
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
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(ADMIN_ORDER_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<AdminOrderRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrderUserOptions(
  supabase: SupabaseClient,
): Promise<OrderUserOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_profiles")
      .select("user_id,name,email,status,created_at")
      .order("created_at", { ascending: true })
      .returns<OrderUserOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
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
  const supplementary = input.supplementary ?? null;
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
    })
    .select(ADMIN_ORDER_SELECT)
    .maybeSingle<AdminOrderRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("订单创建后未返回结果，请稍后刷新页面查看。");
  }

  if (supplementary) {
    try {
      await insertAdminOrderSupplementary(supabase, data.id, supplementary);
    } catch (supplementaryError) {
      const { error: rollbackError } = await supabase
        .from("order_overview")
        .delete()
        .eq("id", data.id);

      if (rollbackError) {
        throw new Error(
          `关联子表写入失败，且回滚订单总表失败：${String(rollbackError.message ?? rollbackError)}`,
        );
      }

      throw supplementaryError;
    }
  }

  return data;
}

export async function updateAdminOrder(
  supabase: SupabaseClient,
  input: UpdateAdminOrderInput,
): Promise<AdminOrderRow> {
  const previousOrder = await getAdminOrderByNumber(supabase, input.originalOrderNumber);

  if (!previousOrder) {
    throw new Error("未找到需要更新的订单，请刷新页面后重试。");
  }

  const previousSupplementary = await getExistingSupplementaryRecord(
    supabase,
    previousOrder.id,
  );
  const orderNumberChanged = input.originalOrderNumber !== input.orderNumber;
  const supplementary = input.supplementary ?? null;

  if (orderNumberChanged && previousSupplementary) {
    await deleteAdminOrderSupplementary(supabase, previousOrder.id);
  }

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
    })
    .eq("order_number", input.originalOrderNumber)
    .select(ADMIN_ORDER_SELECT)
    .maybeSingle<AdminOrderRow>();

  if (error) {
    if (orderNumberChanged && previousSupplementary) {
      await restoreExistingSupplementaryRecord(supabase, previousSupplementary);
    }

    throw error;
  }

  if (!data) {
    throw new Error("订单更新后未返回结果，请稍后刷新页面查看。");
  }

  try {
    if (!orderNumberChanged) {
      await deleteAdminOrderSupplementary(supabase, previousOrder.id);
    }

    if (supplementary) {
      await insertAdminOrderSupplementary(supabase, data.id, supplementary);
    }
  } catch (supplementaryError) {
    await rollbackUpdatedOrder(supabase, data.id, previousOrder, previousSupplementary);
    throw supplementaryError;
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

async function getAdminOrderByNumber(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<AdminOrderRow | null> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(ADMIN_ORDER_SELECT)
      .eq("order_number", orderNumber)
      .maybeSingle<AdminOrderRow>(),
  );

  if (error) {
    throw error;
  }

  return data ?? null;
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

async function getExistingSupplementaryRecord(
  supabase: SupabaseClient,
  orderOverviewId: string,
): Promise<ExistingSupplementaryRecord | null> {
  const [purchaseResult, serviceResult] = await Promise.all([
    withRequestTimeout(
      supabase
        .from("purchase_order")
        .select("order_overview_id,order_type,order_details")
        .eq("order_overview_id", orderOverviewId)
        .maybeSingle<PurchaseOrderRecord>(),
    ),
    withRequestTimeout(
      supabase
        .from("service_order")
        .select("order_overview_id,order_type,order_discount,order_details")
        .eq("order_overview_id", orderOverviewId)
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
    return {
      kind: "purchase",
      record: purchaseResult.data,
    };
  }

  if (serviceResult.data) {
    return {
      kind: "service",
      record: serviceResult.data,
    };
  }

  return null;
}

async function deleteAdminOrderSupplementary(
  supabase: SupabaseClient,
  orderOverviewId: string,
) {
  const [purchaseDeleteResult, serviceDeleteResult] = await Promise.all([
    withRequestTimeout(
      supabase.from("purchase_order").delete().eq("order_overview_id", orderOverviewId),
    ),
    withRequestTimeout(
      supabase.from("service_order").delete().eq("order_overview_id", orderOverviewId),
    ),
  ]);

  if (purchaseDeleteResult.error) {
    throw purchaseDeleteResult.error;
  }

  if (serviceDeleteResult.error) {
    throw serviceDeleteResult.error;
  }
}

async function restoreExistingSupplementaryRecord(
  supabase: SupabaseClient,
  previousSupplementary: ExistingSupplementaryRecord | null,
) {
  if (!previousSupplementary) {
    return;
  }

  if (previousSupplementary.kind === "purchase") {
    const { error } = await supabase.from("purchase_order").insert(previousSupplementary.record);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("service_order").insert(previousSupplementary.record);

  if (error) {
    throw error;
  }
}

async function rollbackUpdatedOrder(
  supabase: SupabaseClient,
  currentOrderId: string,
  previousOrder: AdminOrderRow,
  previousSupplementary: ExistingSupplementaryRecord | null,
) {
  await deleteAdminOrderSupplementary(supabase, currentOrderId);

  const { error } = await supabase
    .from("order_overview")
    .update({
      order_number: previousOrder.order_number,
      original_currency: previousOrder.original_currency,
      amount: previousOrder.amount,
      daily_exchange_rate: previousOrder.daily_exchange_rate,
      transaction_rate: previousOrder.transaction_rate,
      rmb_amount: previousOrder.rmb_amount,
      order_entry_user: previousOrder.order_entry_user,
      ordering_user: previousOrder.ordering_user,
      order_status: previousOrder.order_status,
      order_type: previousOrder.order_type,
      created_at: previousOrder.created_at,
      reviewed_at: previousOrder.reviewed_at,
      deleted_at: previousOrder.deleted_at,
    })
    .eq("id", currentOrderId);

  if (error) {
    throw new Error(`更新子表失败，且订单总表回滚失败：${String(error.message ?? error)}`);
  }

  await restoreExistingSupplementaryRecord(supabase, previousSupplementary);
}

async function insertAdminOrderSupplementary(
  supabase: SupabaseClient,
  orderOverviewId: string,
  supplementary: CreateAdminOrderSupplementaryInput,
) {
  if (supplementary.kind === "purchase") {
    const { error } = await supabase.from("purchase_order").insert({
      order_overview_id: orderOverviewId,
      order_type: supplementary.subtypeId,
      order_details: supplementary.details,
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("service_order").insert({
    order_overview_id: orderOverviewId,
    order_type: supplementary.subtypeId,
    order_discount: supplementary.discountId,
    order_details: supplementary.details,
  });

  if (error) {
    throw error;
  }
}
