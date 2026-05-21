import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type {
  AdminOrderDetailValue,
  AdminOrderSupplementaryDetail,
  OrderOverviewReference,
} from "./admin-orders-types";
import { isVipMembershipScope } from "./vip-memberships";

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
  price_option_id: string;
  service_fee_type: string | null;
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

type ServiceOrderPriceOptionRecord = {
  display_name: string | null;
  amount_usd: number | string | null;
};

type VipRechargeOrderRecord = {
  order_overview_id: string;
  vip_scope: string;
  order_details: AdminOrderDetailValue;
};

type OrderSupplementaryOverviewReference = OrderOverviewReference & {
  rmb_amount: number | string | null;
  service_fee_type: string | null;
};

export async function getAdminOrderSupplementaryDetail(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<AdminOrderSupplementaryDetail | null> {
  const overview = await getOrderOverviewReference(supabase, orderNumber);

  if (!overview) {
    return null;
  }

  const [purchaseResult, serviceResult, vipResult] = await Promise.all([
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
        .select("order_overview_id,order_type,order_discount,price_option_id,service_fee_type,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<ServiceOrderRecord>(),
    ),
    withRequestTimeout(
      supabase
        .from("vip_recharge_order")
        .select("order_overview_id,vip_scope,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<VipRechargeOrderRecord>(),
    ),
  ]);

  if (purchaseResult.error) {
    throw purchaseResult.error;
  }

  if (serviceResult.error) {
    throw serviceResult.error;
  }

  if (vipResult.error) {
    throw vipResult.error;
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
    const serviceFeeTypeId =
      overview.service_fee_type ?? serviceResult.data.service_fee_type;
    const [serviceTypeResult, discountTypeResult, priceOptionResult, serviceFeeTypeResult] =
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
          .from("service_order_price_option")
          .select("display_name,amount_usd")
          .eq("id", serviceResult.data.price_option_id)
          .maybeSingle<ServiceOrderPriceOptionRecord>(),
      ),
      serviceFeeTypeId
        ? withRequestTimeout(
            supabase
              .from("service_fee_type")
              .select("fee_ratio")
              .eq("id", serviceFeeTypeId)
              .maybeSingle<ServiceFeeTypeRecord>(),
          )
        : Promise.resolve({ data: null, error: null }),
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

    if (priceOptionResult.error) {
      throw priceOptionResult.error;
    }

    return {
      kind: "service",
      orderNumber: overview.order_number,
      subtypeId: serviceResult.data.order_type,
      subtype: serviceTypeResult.data?.business_subcategory ?? null,
      discountId: serviceResult.data.order_discount,
      discountRatio: discountTypeResult.data?.discount_ratio ?? null,
      priceOptionId: serviceResult.data.price_option_id,
      priceOptionLabel: priceOptionResult.data?.display_name ?? null,
      priceAmountUsd: priceOptionResult.data?.amount_usd ?? null,
      serviceFeeAmount: calculateServiceFeeAmount(
        overview.rmb_amount,
        serviceFeeTypeResult.data?.fee_ratio ?? null,
      ),
      serviceFeeRatio: serviceFeeTypeResult.data?.fee_ratio ?? null,
      serviceFeeTypeId,
      details: serviceResult.data.order_details,
    };
  }

  if (vipResult.data) {
    return {
      kind: "vip_recharge",
      orderNumber: overview.order_number,
      vipScope: isVipMembershipScope(vipResult.data.vip_scope)
        ? vipResult.data.vip_scope
        : "retail",
      details: vipResult.data.order_details,
    };
  }

  return null;
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
): Promise<OrderSupplementaryOverviewReference | null> {
  const normalizedOrderNumber = orderNumber.trim();

  if (!normalizedOrderNumber) {
    return null;
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select("id,order_number,rmb_amount,service_fee_type")
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle<OrderSupplementaryOverviewReference>(),
  );

  if (error) {
    throw error;
  }

  return data ?? null;
}
