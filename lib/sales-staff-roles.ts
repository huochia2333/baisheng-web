import type { AppRole } from "./auth-routing";

export const SALES_STAFF_ROLES = [
  "salesman",
  "promoter",
] as const satisfies readonly AppRole[];

export type SalesStaffRole = (typeof SALES_STAFF_ROLES)[number];

export function isSalesStaffRole(role: unknown): role is SalesStaffRole {
  return role === "salesman" || role === "promoter";
}
