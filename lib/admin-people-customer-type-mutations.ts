import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAdminPersonRowById,
  isCustomerTypeMark,
  type AdminPersonRow,
  type CustomerTypeMark,
} from "./admin-people";
import {
  AdminPeopleMutationError,
} from "./admin-people-mutations";
import { withRequestTimeout } from "./request-timeout";
import { getCurrentSessionContext } from "./user-self-service";

export type AdminCustomerTypeUpdatePayload = {
  customerUserId: string;
  customerType: CustomerTypeMark;
};

const ADMIN_CUSTOMER_TYPE_MUTATION_TIMEOUT_MS = 30_000;

export async function updateAdminCustomerTypeMark(
  supabase: SupabaseClient,
  input: AdminCustomerTypeUpdatePayload,
): Promise<AdminPersonRow> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (
    !sessionContext.user ||
    sessionContext.role !== "administrator" ||
    sessionContext.status !== "active"
  ) {
    throw new AdminPeopleMutationError("forbidden");
  }

  const payload = normalizeAdminCustomerTypePayload(input);

  const { error } = await withRequestTimeout(
    supabase.rpc("admin_set_customer_type_mark", {
      _customer_type: payload.customerType,
      _customer_user_id: payload.customerUserId,
    }),
    {
      timeoutMs: ADMIN_CUSTOMER_TYPE_MUTATION_TIMEOUT_MS,
    },
  );

  if (error) {
    throw error;
  }

  const updatedPerson = await getAdminPersonRowById(
    supabase,
    payload.customerUserId,
  );

  if (!updatedPerson) {
    throw new AdminPeopleMutationError("notFound");
  }

  return updatedPerson;
}

function normalizeAdminCustomerTypePayload(
  input: AdminCustomerTypeUpdatePayload,
): AdminCustomerTypeUpdatePayload {
  const customerUserId =
    typeof input.customerUserId === "string" ? input.customerUserId.trim() : "";

  if (!customerUserId || !isCustomerTypeMark(input.customerType)) {
    throw new AdminPeopleMutationError("invalidInput");
  }

  return {
    customerType: input.customerType,
    customerUserId,
  };
}
