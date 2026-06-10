import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { isSalesStaffRole } from "@/lib/sales-staff-roles";

export function canReadOrderByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    isSalesStaffRole(role) ||
    role === "client"
  );
}

export function canReadOrderCostByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    isSalesStaffRole(role)
  );
}

export function canCreateOrderByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  if (status !== "active") {
    return false;
  }

  return role === "administrator" || role === "manager" || isSalesStaffRole(role);
}

export function canUpdateOrderByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return canCreateOrderByRole(role, status);
}

export function canDeleteOrderByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return status === "active" && role === "administrator";
}
