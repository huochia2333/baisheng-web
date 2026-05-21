import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAdminPersonRowById,
  type AdminPersonRow,
} from "./admin-people";
import { withRequestTimeout } from "./request-timeout";
import { getCurrentSessionContext } from "./user-self-service";

export type AdminVipRequestAction = "approve" | "reject";

export type AdminPeopleVipRequestPayload = {
  requestId: string;
  action: AdminVipRequestAction;
  note?: string | null;
};

export type AdminPeopleVipRequestErrorCode =
  | "forbidden"
  | "invalidInput"
  | "notFound"
  | "processed"
  | "serviceUnavailable"
  | "unknown";

export class AdminPeopleVipRequestError extends Error {
  readonly code: AdminPeopleVipRequestErrorCode;

  constructor(code: AdminPeopleVipRequestErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function handleAdminVipRequest(
  supabase: SupabaseClient,
  input: AdminPeopleVipRequestPayload,
): Promise<AdminPersonRow> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    sessionContext.role !== "administrator" ||
    sessionContext.status !== "active"
  ) {
    throw new AdminPeopleVipRequestError("forbidden");
  }

  const payload = normalizePayload(input);
  const targetUserId = await getVipRequestCustomerId(supabase, payload.requestId);

  if (!targetUserId) {
    throw new AdminPeopleVipRequestError("notFound");
  }

  const rpcName =
    payload.action === "approve"
      ? "approve_vip_recharge_request"
      : "reject_vip_recharge_request";

  const { error } = await withRequestTimeout(
    supabase.rpc(rpcName, {
      p_request_id: payload.requestId,
      p_review_note: payload.note ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  const person = await getAdminPersonRowById(supabase, targetUserId);

  if (!person) {
    throw new AdminPeopleVipRequestError("notFound");
  }

  return person;
}

export function getAdminPeopleVipRequestErrorCode(
  error: unknown,
): AdminPeopleVipRequestErrorCode {
  if (error instanceof AdminPeopleVipRequestError) {
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

  if (message.includes("vip_request_not_found")) {
    return "notFound";
  }

  if (message.includes("vip_request_already_processed")) {
    return "processed";
  }

  if (
    message.includes("admin_people_vip_invalid_input") ||
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

async function getVipRequestCustomerId(
  supabase: SupabaseClient,
  requestId: string,
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("vip_recharge_requests")
      .select("customer_user_id")
      .eq("id", requestId)
      .maybeSingle<{ customer_user_id: string | null }>(),
  );

  if (error) {
    throw error;
  }

  return typeof data?.customer_user_id === "string"
    ? data.customer_user_id
    : null;
}

function normalizePayload(
  input: AdminPeopleVipRequestPayload,
): AdminPeopleVipRequestPayload {
  const requestId =
    typeof input.requestId === "string" ? input.requestId.trim() : "";
  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, 500)
      : null;

  if (!requestId || (input.action !== "approve" && input.action !== "reject")) {
    throw new AdminPeopleVipRequestError("invalidInput");
  }

  return {
    requestId,
    action: input.action,
    note,
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
