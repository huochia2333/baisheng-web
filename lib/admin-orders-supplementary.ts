import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type {
  AdminOrderDetailValue,
  AdminOrderSupplementaryDetail,
  OrderOverviewReference,
} from "./admin-orders-types";

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
  service_fee_type: string;
  order_details: AdminOrderDetailValue;
};

type ServiceOrderTypeRecord = {
  business_subcategory: string | null;
};

type OrderDiscountTypeRecord = {
  discount_ratio: number | string | null;
};

type ServiceFeeTypeRecord = {
  fee_ratio: number | string | null;
};

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
        .select("order_overview_id,order_type,order_discount,service_fee_type,order_details")
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
    const [serviceTypeResult, discountTypeResult, serviceFeeTypeResult] =
      await Promise.all([
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
      withRequestTimeout(
        supabase
          .from("service_fee_type")
          .select("fee_ratio")
          .eq("id", serviceResult.data.service_fee_type)
          .maybeSingle<ServiceFeeTypeRecord>(),
      ),
    ]);

    if (serviceTypeResult.error) {
      throw serviceTypeResult.error;
    }

    if (discountTypeResult.error) {
      throw discountTypeResult.error;
    }

    if (serviceFeeTypeResult.error) {
      throw serviceFeeTypeResult.error;
    }

    return {
      kind: "service",
      orderNumber: overview.order_number,
      subtypeId: serviceResult.data.order_type,
      subtype: serviceTypeResult.data?.business_subcategory ?? null,
      discountId: serviceResult.data.order_discount,
      discountRatio: discountTypeResult.data?.discount_ratio ?? null,
      serviceFeeAmount: calculateServiceFeeAmount(
        await getOrderRmbAmount(supabase, overview.id),
        serviceFeeTypeResult.data?.fee_ratio ?? null,
      ),
      serviceFeeRatio: serviceFeeTypeResult.data?.fee_ratio ?? null,
      serviceFeeTypeId: serviceResult.data.service_fee_type,
      details: serviceResult.data.order_details,
    };
  }

  return null;
}

async function getOrderRmbAmount(
  supabase: SupabaseClient,
  orderId: string,
): Promise<number | string | null> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select("rmb_amount")
      .eq("id", orderId)
      .maybeSingle<{ rmb_amount: number | string | null }>(),
  );

  if (error) {
    throw error;
  }

  return data?.rmb_amount ?? null;
}

function calculateServiceFeeAmount(
  rmbAmount: number | string | null,
  serviceFeeRatio: number | string | null,
) {
  const amount = parseNumericValue(rmbAmount);
  const ratio = parseNumericValue(serviceFeeRatio);

  if (amount === null || ratio === null) {
    return null;
  }

  return Math.round(amount * ratio * 100) / 100;
}

function parseNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
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
