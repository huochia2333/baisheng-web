import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getSalesmanCustomerRowById,
  type SalesmanCustomerRow,
} from "./salesman-people";
import { withRequestTimeout } from "./request-timeout";
import { getCurrentSessionContext } from "./user-self-service";
import { isSalesStaffRole } from "./sales-staff-roles";
import {
  isVipMembershipScope,
  type VipMembershipScope,
} from "./vip-memberships";

export type SalesmanVipRequestPayload = {
  customerUserId: string;
  vipScope: VipMembershipScope;
  note?: string | null;
};

export type SalesmanVipRequestErrorCode =
  | "forbidden"
  | "invalidInput"
  | "notFound"
  | "serviceUnavailable"
  | "unknown";

export class SalesmanVipRequestError extends Error {
  readonly code: SalesmanVipRequestErrorCode;

  constructor(code: SalesmanVipRequestErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function requestSalesmanVipRecharge(
  supabase: SupabaseClient,
  input: SalesmanVipRequestPayload,
): Promise<SalesmanCustomerRow> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    !isSalesStaffRole(sessionContext.role) ||
    sessionContext.status !== "active"
  ) {
    throw new SalesmanVipRequestError("forbidden");
  }

  const payload = normalizePayload(input);
  const { error } = await withRequestTimeout(
    supabase.rpc("request_vip_recharge", {
      p_customer_user_id: payload.customerUserId,
      p_vip_scope: payload.vipScope,
      p_note: payload.note ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  const customer = await getSalesmanCustomerRowById(
    supabase,
    payload.customerUserId,
  );

  if (!customer) {
    throw new SalesmanVipRequestError("notFound");
  }

  return customer;
}

export function getSalesmanVipRequestErrorCode(
  error: unknown,
): SalesmanVipRequestErrorCode {
  if (error instanceof SalesmanVipRequestError) {
    return error.code;
  }

  const message = getRawErrorMessage(error).toLowerCase();

  if (
    message.includes("vip_request_forbidden") ||
    message.includes("forbidden") ||
    message.includes("unauthorized")
  ) {
    return "forbidden";
  }

  if (message.includes("salesman_people_customer_not_found")) {
    return "notFound";
  }

  if (
    message.includes("salesman_people_vip_invalid_input") ||
    message.includes("invalid input")
  ) {
    return "invalidInput";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return "serviceUnavailable";
  }

  return "unknown";
}

function normalizePayload(
  input: SalesmanVipRequestPayload,
): SalesmanVipRequestPayload {
  const customerUserId =
    typeof input.customerUserId === "string" ? input.customerUserId.trim() : "";

  if (!customerUserId || !isVipMembershipScope(input.vipScope)) {
    throw new SalesmanVipRequestError("invalidInput");
  }

  return {
    customerUserId,
    vipScope: input.vipScope,
    note:
      typeof input.note === "string" && input.note.trim()
        ? input.note.trim().slice(0, 500)
        : null,
  };
}

function getRawErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message).trim();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
}
