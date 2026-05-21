import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type {
  OrderDiscountTypeOption,
  ServiceOrderPriceOption,
} from "./admin-orders-types";

const SERVICE_ORDER_PRICE_SELECT =
  "id,service_order_type_id,price_code,display_name,amount_usd,sort_order,is_active";
const ORDER_DISCOUNT_SELECT = "id,discount_ratio";

export async function updateServiceOrderPriceOption(
  supabase: SupabaseClient,
  id: string,
  amountUsd: number,
): Promise<ServiceOrderPriceOption> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_order_price_option")
      .update({ amount_usd: amountUsd })
      .eq("id", id)
      .select(SERVICE_ORDER_PRICE_SELECT)
      .single<ServiceOrderPriceOption>(),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function updateOrderDiscountType(
  supabase: SupabaseClient,
  id: string,
  discountRatio: number,
): Promise<OrderDiscountTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_discount_type")
      .update({ discount_ratio: discountRatio })
      .eq("id", id)
      .select(ORDER_DISCOUNT_SELECT)
      .single<OrderDiscountTypeOption>(),
  );

  if (error) {
    throw error;
  }

  return data;
}
