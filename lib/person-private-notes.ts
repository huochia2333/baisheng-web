import type { SupabaseClient } from "@supabase/supabase-js";

import { PERSON_PRIVATE_NOTE_MAX_LENGTH } from "./person-private-note-constants";
import { withRequestTimeout } from "./request-timeout";
import { getCurrentSessionContext } from "./user-self-service";
import { isSalesStaffRole } from "./sales-staff-roles";
import { normalizeOptionalString } from "./value-normalizers";

export type PersonPrivateNotePayload = {
  targetUserId: string;
  note: string | null;
};

export type PersonPrivateNoteResult = {
  targetUserId: string;
  note: string | null;
  updatedAt: string | null;
};

export type PersonPrivateNoteErrorCode =
  | "forbidden"
  | "invalidInput"
  | "notFound"
  | "serviceUnavailable"
  | "unknown";

export class PersonPrivateNoteMutationError extends Error {
  readonly code: PersonPrivateNoteErrorCode;

  constructor(code: PersonPrivateNoteErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function savePersonPrivateNote(
  supabase: SupabaseClient,
  input: PersonPrivateNotePayload,
): Promise<PersonPrivateNoteResult> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    sessionContext.status !== "active" ||
    (sessionContext.role !== "administrator" &&
      !isSalesStaffRole(sessionContext.role))
  ) {
    throw new PersonPrivateNoteMutationError("forbidden");
  }

  const payload = normalizePayload(input);
  const { data, error } = await withRequestTimeout(
    supabase.rpc("save_person_private_note", {
      _note: payload.note,
      _target_user_id: payload.targetUserId,
    }),
  );

  if (error) {
    throw error;
  }

  const savedNote = Array.isArray(data)
    ? normalizePersonPrivateNoteResult(data[0])
    : normalizePersonPrivateNoteResult(data);

  if (!savedNote) {
    throw new PersonPrivateNoteMutationError("notFound");
  }

  return savedNote;
}

export function getPersonPrivateNoteErrorCode(
  error: unknown,
): PersonPrivateNoteErrorCode {
  if (error instanceof PersonPrivateNoteMutationError) {
    return error.code;
  }

  const message = getRawErrorMessage(error).toLowerCase();

  if (
    message.includes("person_private_note_forbidden") ||
    message.includes("forbidden") ||
    message.includes("unauthorized")
  ) {
    return "forbidden";
  }

  if (
    message.includes("person_private_note_invalid_input") ||
    message.includes("invalid input")
  ) {
    return "invalidInput";
  }

  if (message.includes("not found")) {
    return "notFound";
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
  input: PersonPrivateNotePayload,
): PersonPrivateNotePayload {
  const targetUserId =
    typeof input.targetUserId === "string" ? input.targetUserId.trim() : "";
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!targetUserId || note.length > PERSON_PRIVATE_NOTE_MAX_LENGTH) {
    throw new PersonPrivateNoteMutationError("invalidInput");
  }

  return {
    targetUserId,
    note: note.length > 0 ? note : null,
  };
}

function normalizePersonPrivateNoteResult(
  value: unknown,
): PersonPrivateNoteResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const targetUserId = normalizeOptionalString(value.target_user_id);

  if (!targetUserId) {
    return null;
  }

  return {
    targetUserId,
    note: normalizeOptionalString(value.private_note),
    updatedAt: normalizeOptionalString(value.updated_at),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
