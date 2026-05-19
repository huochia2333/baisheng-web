import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

const SERVICE_FEE_TYPE_SELECT = "id,fee_ratio";

export type ServiceFeeTypeOption = {
  id: string;
  fee_ratio: number | string;
};

export async function getServiceFeeTypes(
  supabase: SupabaseClient,
): Promise<ServiceFeeTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .select(SERVICE_FEE_TYPE_SELECT)
      .order("fee_ratio", { ascending: false })
      .returns<ServiceFeeTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createServiceFeeType(
  supabase: SupabaseClient,
  feeRatio: number,
): Promise<ServiceFeeTypeOption> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .insert({ fee_ratio: feeRatio })
      .select(SERVICE_FEE_TYPE_SELECT)
      .single<ServiceFeeTypeOption>(),
  );

  if (error) {
    throw error;
  }

  return data;
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

export async function deleteServiceFeeType(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .delete()
      .eq("id", id),
  );

  if (error) {
    throw error;
  }
}
