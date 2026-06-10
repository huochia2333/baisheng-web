import { NextResponse } from "next/server";

import {
  getPersonPrivateNoteErrorCode,
  savePersonPrivateNote,
  type PersonPrivateNotePayload,
} from "@/lib/person-private-notes";
import { getServerSupabaseClient } from "@/lib/supabase-server";

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
    const savedNote = await savePersonPrivateNote(supabase, payload);

    return NextResponse.json(savedNote);
  } catch (error) {
    const code = getPersonPrivateNoteErrorCode(error);

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

function normalizeRequestPayload(
  value: unknown,
): PersonPrivateNotePayload {
  if (!isRecord(value)) {
    throw new Error("person_private_note_invalid_input");
  }

  return {
    targetUserId:
      typeof value.targetUserId === "string" ? value.targetUserId : "",
    note: typeof value.note === "string" ? value.note : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
