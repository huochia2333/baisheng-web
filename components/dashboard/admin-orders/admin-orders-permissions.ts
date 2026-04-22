import type { AppRole, UserStatus } from "@/lib/user-self-service";

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
    role === "salesman" ||
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
    role === "salesman"
  );
}

export function canCreateOrderByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  if (status !== "active") {
    return false;
  }

  return role === "administrator" || role === "manager" || role === "salesman";
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
