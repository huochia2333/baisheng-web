import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  ADMIN_PEOPLE_CITY_MAX_LENGTH,
  getAdminPersonRowById,
  isAdminPeopleRole,
  isAdminPeopleStatus,
  type AdminPersonAccountUpdatePayload,
  type AdminPersonRow,
} from "./admin-people";
import { getSupabaseServiceRoleClient } from "./supabase-admin-server";
import { withRequestTimeout } from "./request-timeout";
import {
  type SalesmanBusinessBoard,
} from "./salesman-business-access";
import { isSalesStaffRole } from "./sales-staff-roles";
import { getCurrentSessionContext } from "./user-self-service";
import {
  areWorkspaceBusinessAccessListsEqual,
  getDefaultWorkspaceBusinessAccessForRole,
  isWorkspaceBusinessAccessKey,
  uniqueWorkspaceBusinessAccess,
  type WorkspaceBusinessKey,
} from "./workspace-business-access";

export type AdminPeopleUpdateErrorCode =
  | "forbidden"
  | "invalidInput"
  | "lastAdmin"
  | "noChange"
  | "notFound"
  | "selfChange"
  | "serviceUnavailable"
  | "unknown";

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
  const currentPerson = await getAdminPersonRowById(
    supabase,
    payload.targetUserId,
  );

  if (!currentPerson) {
    throw new AdminPeopleMutationError("notFound");
  }

  if (currentPerson.user_id === sessionContext.user.id) {
    throw new AdminPeopleMutationError("selfChange");
  }

  const accountWillChange =
    currentPerson.role !== payload.nextRole ||
    currentPerson.status !== payload.nextStatus;
  const cityWillChange =
    normalizeAccountCity(currentPerson.city) !== payload.nextCity;
  const workspaceBusinessAccess = resolveWorkspaceBusinessAccessForUpdate(
    currentPerson,
    payload,
  );
  const businessAccessWillChange =
    !areWorkspaceBusinessAccessListsEqual(
      currentPerson.workspace_business_access,
      workspaceBusinessAccess,
    );

  if (!accountWillChange && !cityWillChange && !businessAccessWillChange) {
    throw new AdminPeopleMutationError("noChange");
  }

  if (accountWillChange || cityWillChange) {
    await prepareAdminPersonAccountChange(supabase, payload);
    await applyAdminPersonAccountChange(supabase, payload);
    if (accountWillChange) {
      await syncTargetAuthMetadata(payload);
    }
  }

  if (businessAccessWillChange || accountWillChange) {
    await setWorkspaceBusinessAccess(
      supabase,
      payload.targetUserId,
      workspaceBusinessAccess,
    );
  }

  if (isSalesStaffRole(currentPerson.role) || isSalesStaffRole(payload.nextRole)) {
    await setSalesmanBusinessAccess(
      supabase,
      payload.targetUserId,
      getSalesmanBusinessBoardsForRole(payload.nextRole),
    );
  }

  const updatedPerson = await getAdminPersonRowById(
    supabase,
    payload.targetUserId,
  );

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
    message.includes("admin_people_invalid_workspace_business_access") ||
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
  const nextCity = normalizeAccountCity(input.nextCity);

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
    nextCity,
    salesmanBusinessBoards:
      input.salesmanBusinessBoards === null ||
      input.salesmanBusinessBoards === undefined
        ? null
        : input.salesmanBusinessBoards,
    workspaceBusinessAccess:
      input.workspaceBusinessAccess === null ||
      input.workspaceBusinessAccess === undefined
        ? null
        : normalizeInputWorkspaceBusinessAccess(input.workspaceBusinessAccess),
    note,
  };
}

function normalizeInputWorkspaceBusinessAccess(
  value: unknown,
): WorkspaceBusinessKey[] {
  if (!Array.isArray(value) || !value.every(isWorkspaceBusinessAccessKey)) {
    throw new AdminPeopleMutationError("invalidInput");
  }

  return uniqueWorkspaceBusinessAccess(value);
}

function resolveWorkspaceBusinessAccessForUpdate(
  currentPerson: AdminPersonRow,
  input: AdminPersonAccountUpdatePayload,
): WorkspaceBusinessKey[] {
  if (isFixedWorkspaceBusinessAccessRole(input.nextRole)) {
    return getDefaultWorkspaceBusinessAccessForRole(input.nextRole);
  }

  if (!input.workspaceBusinessAccess) {
    if (currentPerson.role !== input.nextRole) {
      return getDefaultWorkspaceBusinessAccessForRole(input.nextRole);
    }

    return currentPerson.workspace_business_access.length > 0
      ? currentPerson.workspace_business_access
      : getDefaultWorkspaceBusinessAccessForRole(input.nextRole);
  }

  return uniqueWorkspaceBusinessAccess(input.workspaceBusinessAccess);
}

function isFixedWorkspaceBusinessAccessRole(role: string) {
  return role === "administrator" || role === "salesman" || role === "promoter";
}

function getSalesmanBusinessBoardsForRole(
  nextRole: AdminPersonAccountUpdatePayload["nextRole"],
): SalesmanBusinessBoard[] {
  if (nextRole === "salesman") {
    return ["wholesale"];
  }

  if (nextRole === "promoter") {
    return ["tourism"];
  }

  return [];
}

async function prepareAdminPersonAccountChange(
  supabase: SupabaseClient,
  input: AdminPersonAccountUpdatePayload,
): Promise<void> {
  const { error } = await withRequestTimeout(
    supabase.rpc("admin_prepare_person_account_change", {
      _target_user_id: input.targetUserId,
      _next_role: input.nextRole,
      _next_status: input.nextStatus,
      _next_city: input.nextCity,
    }),
    {
      timeoutMs: ADMIN_PEOPLE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw error;
  }
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
      _next_city: input.nextCity,
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

async function setWorkspaceBusinessAccess(
  supabase: SupabaseClient,
  targetUserId: string,
  workspaceBusinessAccess: WorkspaceBusinessKey[],
) {
  const { error } = await withRequestTimeout(
    supabase.rpc("admin_set_workspace_business_access", {
      _target_user_id: targetUserId,
      _business_keys: workspaceBusinessAccess,
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
    const authUser = await getTargetAuthUser(
      serviceSupabase,
      input.targetUserId,
    );
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

function normalizeAccountCity(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, ADMIN_PEOPLE_CITY_MAX_LENGTH);
  return normalized.length > 0 ? normalized : null;
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
