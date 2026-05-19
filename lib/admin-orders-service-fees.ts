import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import type { AdminOrderRow } from "./admin-orders-types";
import type { ServiceFeeTypeOption } from "./service-fee-types";

type ServiceOrderFeeRow = {
  order_overview_id: string;
  service_fee_type: string | null;
};

export type AdminOrderServiceFeeRow = {
  order_overview_id: string;
  service_fee_amount: number | null;
  service_fee_ratio: number | string | null;
  service_fee_type_id: string | null;
};

export async function getAdminOrderServiceFees(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<AdminOrderServiceFeeRow[]> {
  if (orderIds.length === 0) {
    return [];
  }

  const { data: serviceRows, error: serviceRowsError } = await withRequestTimeout(
    supabase
      .from("service_order")
      .select("order_overview_id,service_fee_type")
      .in("order_overview_id", orderIds)
      .returns<ServiceOrderFeeRow[]>(),
  );

  if (serviceRowsError) {
    throw serviceRowsError;
  }

  const feeTypeIds = Array.from(
    new Set(
      (serviceRows ?? [])
        .map((row) => row.service_fee_type)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (feeTypeIds.length === 0) {
    return [];
  }

  const { data: feeTypes, error: feeTypesError } = await withRequestTimeout(
    supabase
      .from("service_fee_type")
      .select("id,fee_ratio")
      .in("id", feeTypeIds)
      .returns<ServiceFeeTypeOption[]>(),
  );

  if (feeTypesError) {
    throw feeTypesError;
  }

  const feeRatioById = new Map(
    (feeTypes ?? []).map((row) => [row.id, row.fee_ratio]),
  );

  return (serviceRows ?? []).map((row) => ({
    order_overview_id: row.order_overview_id,
    service_fee_amount: null,
    service_fee_ratio: row.service_fee_type
      ? (feeRatioById.get(row.service_fee_type) ?? null)
      : null,
    service_fee_type_id: row.service_fee_type,
  }));
}

export function mergeAdminOrdersWithServiceFees(
  orders: AdminOrderRow[],
  serviceFees: AdminOrderServiceFeeRow[],
): AdminOrderRow[] {
  if (orders.length === 0 || serviceFees.length === 0) {
    return orders.map((order) => ({
      ...order,
      service_fee_amount: order.service_fee_amount ?? null,
      service_fee_ratio: order.service_fee_ratio ?? null,
      service_fee_type_id: order.service_fee_type_id ?? null,
    }));
  }

  const feeByOrderId = new Map(
    serviceFees.map((row) => [row.order_overview_id, row]),
  );

  return orders.map((order) => {
    const serviceFee = feeByOrderId.get(order.id);
    const serviceFeeRatio = serviceFee?.service_fee_ratio ?? null;

    return {
      ...order,
      service_fee_amount: calculateOrderServiceFeeAmount(
        order.rmb_amount,
        serviceFeeRatio,
      ),
      service_fee_ratio: serviceFeeRatio,
      service_fee_type_id: serviceFee?.service_fee_type_id ?? null,
    };
  });
}

function calculateOrderServiceFeeAmount(
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
