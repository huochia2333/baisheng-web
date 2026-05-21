import { NextResponse } from "next/server";

import {
  getSalesmanVipRequestErrorCode,
  requestSalesmanVipRecharge,
} from "@/lib/salesman-people-vip-mutations";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { isVipMembershipScope } from "@/lib/vip-memberships";

const STATUS_BY_ERROR_CODE = {
  forbidden: 403,
  invalidInput: 400,
  notFound: 404,
  serviceUnavailable: 503,
  unknown: 500,
} as const;

export async function POST(request: Request) {
  try {
    const payload = normalizeRequestPayload(await request.json());
    const supabase = await getServerSupabaseClient();
    const customer = await requestSalesmanVipRecharge(supabase, payload);

    return NextResponse.json({ customer });
  } catch (error) {
    const code = getSalesmanVipRequestErrorCode(error);

    return NextResponse.json(
      { error: code },
      { status: STATUS_BY_ERROR_CODE[code] },
    );
  }
}

function normalizeRequestPayload(value: unknown) {
  if (!isRecord(value) || !isVipMembershipScope(value.vipScope)) {
    throw new Error("salesman_people_vip_invalid_input");
  }

  return {
    customerUserId:
      typeof value.customerUserId === "string" ? value.customerUserId : "",
    vipScope: value.vipScope,
    note: typeof value.note === "string" ? value.note : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
