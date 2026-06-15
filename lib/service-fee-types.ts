import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

const SERVICE_FEE_TYPE_SELECT =
  "id,fee_code,fee_scope,display_name,rule_description,fee_ratio,sort_order";

export type ServiceFeeScope = "retail" | "wholesale" | "service";

export type ServiceFeeTypeOption = {
  id: string;
  fee_code: string;
  fee_scope: ServiceFeeScope;
  display_name: string;
  rule_description: string;
  fee_ratio: number | string;
  sort_order: number;
};

export type OrderServiceFeePreviewInput = {
  existingOrderNumber?: string | null;
  orderType: string;
  orderingUser: string;
  rmbAmount: number;
};

export async function getServiceFeeTypes(
  supabase: SupabaseClient,
): Promise<ServiceFeeTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .select(SERVICE_FEE_TYPE_SELECT)
      .in("fee_scope", ["retail", "service"])
      .order("sort_order", { ascending: true })
      .returns<ServiceFeeTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateServiceFeeType(
  supabase: SupabaseClient,
  id: string,
  feeRatio: number,
): Promise<ServiceFeeTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .update({ fee_ratio: feeRatio })
      .eq("id", id)
      .select(SERVICE_FEE_TYPE_SELECT)
      .single<ServiceFeeTypeOption>(),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function previewOrderServiceFeeType(
  supabase: SupabaseClient,
  input: OrderServiceFeePreviewInput,
): Promise<ServiceFeeTypeOption | null> {
  const { data, error } = await withRequestTimeout(
    supabase
      .rpc("preview_order_service_fee_type", {
        p_existing_order_number: input.existingOrderNumber ?? null,
        p_order_type: input.orderType,
        p_ordering_user: input.orderingUser,
        p_rmb_amount: input.rmbAmount,
      })
      .maybeSingle<ServiceFeeTypeOption>(),
  );

  if (error) {
    throw error;
  }

  if (data?.fee_scope === "wholesale") {
    return null;
  }

  return data ?? null;
}
