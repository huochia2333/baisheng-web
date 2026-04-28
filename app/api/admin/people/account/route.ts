import { NextResponse } from "next/server";

import {
  getAdminPeopleUpdateErrorCode,
  updateAdminPersonAccount,
} from "@/lib/admin-people-mutations";
import {
  getAdminPeopleChangeLogs,
  isAdminPeopleRole,
  isAdminPeopleStatus,
  type AdminPersonAccountUpdatePayload,
} from "@/lib/admin-people";
import { getServerSupabaseClient } from "@/lib/supabase-server";

const STATUS_BY_ERROR_CODE = {
  forbidden: 403,
  invalidInput: 400,
  lastAdmin: 409,
  noChange: 409,
  notFound: 404,
  selfChange: 409,
  serviceUnavailable: 503,
  unknown: 500,
} as const;

export async function POST(request: Request) {
  try {
    const payload = normalizeRequestPayload(await request.json());
    const supabase = await getServerSupabaseClient();
    const person = await updateAdminPersonAccount(supabase, payload);
    const recentChanges = await getAdminPeopleChangeLogs(supabase);

    return NextResponse.json({ person, recentChanges });
  } catch (error) {
    const code = getAdminPeopleUpdateErrorCode(error);

    return NextResponse.json(
      {
        error: code,
      },
      {
        status: STATUS_BY_ERROR_CODE[code],
      },
    );
  }
}

function normalizeRequestPayload(value: unknown): AdminPersonAccountUpdatePayload {
  if (!isRecord(value)) {
    throw new Error("admin_people_invalid_input");
  }

  if (!isAdminPeopleRole(value.nextRole) || !isAdminPeopleStatus(value.nextStatus)) {
    throw new Error("admin_people_invalid_input");
  }

  return {
    targetUserId: typeof value.targetUserId === "string" ? value.targetUserId : "",
    nextRole: value.nextRole,
    nextStatus: value.nextStatus,
    note: typeof value.note === "string" ? value.note : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
