import { NextResponse } from "next/server";

import {
  getAdminPeopleVipRequestErrorCode,
  handleAdminVipRequest,
  type AdminVipRequestAction,
} from "@/lib/admin-people-vip-mutations";
import { getServerSupabaseClient } from "@/lib/supabase-server";

const STATUS_BY_ERROR_CODE = {
  forbidden: 403,
  invalidInput: 400,
  notFound: 404,
  processed: 409,
  serviceUnavailable: 503,
  unknown: 500,
} as const;

export async function POST(request: Request) {
  try {
    const payload = normalizeRequestPayload(await request.json());
    const supabase = await getServerSupabaseClient();
    const person = await handleAdminVipRequest(supabase, payload);

    return NextResponse.json({ person });
  } catch (error) {
    const code = getAdminPeopleVipRequestErrorCode(error);

    return NextResponse.json(
      { error: code },
      { status: STATUS_BY_ERROR_CODE[code] },
    );
  }
}

function normalizeRequestPayload(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("admin_people_vip_invalid_input");
  }

  return {
    requestId: typeof value.requestId === "string" ? value.requestId : "",
    action: normalizeAction(value.action),
    note: typeof value.note === "string" ? value.note : null,
  };
}

function normalizeAction(value: unknown): AdminVipRequestAction {
  if (value === "approve" || value === "reject") {
    return value;
  }

  throw new Error("admin_people_vip_invalid_input");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
