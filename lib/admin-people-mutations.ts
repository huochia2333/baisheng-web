import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getAdminPersonRowById,
  isAdminPeopleRole,
  isAdminPeopleStatus,
  type AdminPersonAccountUpdatePayload,
  type AdminPersonRow,
  type AdminPeopleRole,
  type AdminPeopleStatus,
} from "./admin-people";
import { getSupabaseServiceRoleClient } from "./supabase-admin-server";
import { withRequestTimeout } from "./request-timeout";
import {
  areSalesmanBusinessBoardsEqual,
  isSalesmanBusinessBoard,
  uniqueSalesmanBusinessBoards,
  type SalesmanBusinessBoard,
} from "./salesman-business-access";
import { getCurrentSessionContext } from "./user-self-service";

export type AdminPeopleUpdateErrorCode =
  | "forbidden"
  | "invalidInput"
  | "lastAdmin"
  | "noChange"
  | "notFound"
  | "selfChange"
  | "serviceUnavailable"
  | "unknown";

type PreparedAccountChange = {
  target_user_id: string;
  previous_role: string | null;
  previous_status: string | null;
  next_role: AdminPeopleRole;
  next_status: AdminPeopleStatus;
};

const ADMIN_PEOPLE_MUTATION_TIMEOUT_MS = 30_000;

export class AdminPeopleMutationError extends Error {
  readonly code: AdminPeopleUpdateErrorCode;

  constructor(code: AdminPeopleUpdateErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function updateAdminPersonAccount(
  supabase: SupabaseClient,
  input: AdminPersonAccountUpdatePayload,
): Promise<AdminPersonRow> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    sessionContext.role !== "administrator" ||
    sessionContext.status !== "active"
  ) {
    throw new AdminPeopleMutationError("forbidden");
  }

  const payload = normalizeAdminPersonAccountUpdatePayload(input);
  const currentPerson = await getAdminPersonRowById(supabase, payload.targetUserId);

  if (!currentPerson) {
    throw new AdminPeopleMutationError("notFound");
  }

  const accountWillChange =
    currentPerson.role !== payload.nextRole ||
    currentPerson.status !== payload.nextStatus;
  const businessBoards = normalizePayloadBusinessBoards(payload);
  const businessAccessWillChange =
    currentPerson.role === "salesman" ||
    payload.nextRole === "salesman"
      ? !areSalesmanBusinessBoardsEqual(
          currentPerson.salesman_business_boards,
          businessBoards,
        )
      : false;

  if (!accountWillChange && !businessAccessWillChange) {
    throw new AdminPeopleMutationError("noChange");
  }

  if (accountWillChange) {
    await prepareAdminPersonAccountChange(supabase, payload);
    await applyAdminPersonAccountChange(supabase, payload);
    await syncTargetAuthMetadata(payload);
  }

  if (currentPerson.role === "salesman" || payload.nextRole === "salesman") {
    await setSalesmanBusinessAccess(supabase, payload.targetUserId, businessBoards);
  }

  const updatedPerson = await getAdminPersonRowById(supabase, payload.targetUserId);

  if (!updatedPerson) {
    throw new AdminPeopleMutationError("notFound");
  }

  return updatedPerson;
}

export function getAdminPeopleUpdateErrorCode(
  error: unknown,
): AdminPeopleUpdateErrorCode {
  if (error instanceof AdminPeopleMutationError) {
    return error.code;
  }

  const message = getRawErrorMessage(error).toLowerCase();

  if (
    message.includes("admin_people_forbidden") ||
    message.includes("permission") ||
    message.includes("forbidden") ||
    message.includes("unauthorized")
  ) {
    return "forbidden";
  }

  if (message.includes("admin_people_self_change_not_allowed")) {
    return "selfChange";
  }

  if (message.includes("admin_people_last_admin_not_allowed")) {
    return "lastAdmin";
  }

  if (message.includes("admin_people_target_not_found")) {
    return "notFound";
  }

  if (message.includes("admin_people_no_change")) {
    return "noChange";
  }

  if (
    message.includes("admin_people_invalid_input") ||
    message.includes("admin_people_invalid_business_access") ||
    message.includes("admin_people_business_access_requires_salesman") ||
    message.includes("admin_people_customer_type_requires_client") ||
    message.includes("admin_people_role_not_found") ||
    message.includes("invalid input")
  ) {
    return "invalidInput";
  }

  if (
    message.includes("supabase_service_role_key") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return "serviceUnavailable";
  }

  return "unknown";
}

function normalizeAdminPersonAccountUpdatePayload(
  input: AdminPersonAccountUpdatePayload,
): AdminPersonAccountUpdatePayload {
  const targetUserId =
    typeof input.targetUserId === "string" ? input.targetUserId.trim() : "";
  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim().slice(0, 500)
      : null;

  if (
    !targetUserId ||
    !isAdminPeopleRole(input.nextRole) ||
    !isAdminPeopleStatus(input.nextStatus)
  ) {
    throw new AdminPeopleMutationError("invalidInput");
  }

  return {
    targetUserId,
    nextRole: input.nextRole,
    nextStatus: input.nextStatus,
    salesmanBusinessBoards:
      input.salesmanBusinessBoards === null ||
      input.salesmanBusinessBoards === undefined
        ? null
        : normalizeInputBusinessBoards(input.salesmanBusinessBoards),
    note,
  };
}

function normalizeInputBusinessBoards(
  value: unknown,
): SalesmanBusinessBoard[] {
  if (!Array.isArray(value) || !value.every(isSalesmanBusinessBoard)) {
    throw new AdminPeopleMutationError("invalidInput");
  }

  return uniqueSalesmanBusinessBoards(value);
}

function normalizePayloadBusinessBoards(
  input: AdminPersonAccountUpdatePayload,
): SalesmanBusinessBoard[] {
  if (input.nextRole !== "salesman") {
    return [];
  }

  if (!input.salesmanBusinessBoards) {
    return ["tourism"];
  }

  return uniqueSalesmanBusinessBoards(input.salesmanBusinessBoards);
}

async function prepareAdminPersonAccountChange(
  supabase: SupabaseClient,
  input: AdminPersonAccountUpdatePayload,
): Promise<PreparedAccountChange> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("admin_prepare_person_account_change", {
      _target_user_id: input.targetUserId,
      _next_role: input.nextRole,
      _next_status: input.nextStatus,
    }),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw error;
  }

  const preparedChange = Array.isArray(data) ? data[0] : data;

  if (!isPreparedAccountChange(preparedChange)) {
    throw new AdminPeopleMutationError("unknown");
  }

  return preparedChange;
}

async function applyAdminPersonAccountChange(
  supabase: SupabaseClient,
  input: AdminPersonAccountUpdatePayload,
) {
  const { error } = await withRequestTimeout(
    supabase.rpc("admin_apply_person_account_change", {
      _target_user_id: input.targetUserId,
      _next_role: input.nextRole,
      _next_status: input.nextStatus,
      _note: input.note ?? null,
    }),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw error;
  }
}

async function setSalesmanBusinessAccess(
  supabase: SupabaseClient,
  targetUserId: string,
  businessBoards: SalesmanBusinessBoard[],
) {
  const { error } = await withRequestTimeout(
    supabase.rpc("admin_set_salesman_business_access", {
      _salesman_user_id: targetUserId,
      _business_boards: businessBoards,
    }),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw error;
  }
}

async function getTargetAuthUser(
  serviceSupabase: SupabaseClient,
  targetUserId: string,
) {
  const { data, error } = await withRequestTimeout(
    serviceSupabase.auth.admin.getUserById(targetUserId),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw new AdminPeopleMutationError(
      error.status === 404 ? "notFound" : "serviceUnavailable",
    );
  }

  if (!data.user) {
    throw new AdminPeopleMutationError("notFound");
  }

  return data.user;
}

async function updateTargetAuthMetadata(
  serviceSupabase: SupabaseClient,
  targetUserId: string,
  appMetadata: Record<string, unknown>,
) {
  const { error } = await withRequestTimeout(
    serviceSupabase.auth.admin.updateUserById(targetUserId, {
      app_metadata: appMetadata,
    }),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw new AdminPeopleMutationError("serviceUnavailable");
  }
}

async function syncTargetAuthMetadata(input: AdminPersonAccountUpdatePayload) {
  try {
    const serviceSupabase = getSupabaseServiceRoleClient();
    const authUser = await getTargetAuthUser(serviceSupabase, input.targetUserId);
    const previousAppMetadata = readAppMetadata(authUser);

    await updateTargetAuthMetadata(serviceSupabase, input.targetUserId, {
      ...previousAppMetadata,
      role: input.nextRole,
      status: input.nextStatus,
    });
  } catch {
    // The database tables and custom access token hook are the source of truth.
    // Auth metadata is kept as a compatibility cache when service credentials work.
  }
}

function readAppMetadata(user: User): Record<string, unknown> {
  return isRecord(user.app_metadata) ? user.app_metadata : {};
}

function isPreparedAccountChange(value: unknown): value is PreparedAccountChange {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.target_user_id === "string" &&
    (typeof value.previous_role === "string" || value.previous_role === null) &&
    (typeof value.previous_status === "string" || value.previous_status === null) &&
    isAdminPeopleRole(value.next_role) &&
    isAdminPeopleStatus(value.next_status)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
