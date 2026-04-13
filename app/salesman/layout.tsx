import type { ReactNode } from "react";
import "../workspace.css";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireWorkspaceAccess } from "@/lib/server-auth";

export default async function SalesmanLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceAccess("/salesman");

  return <AdminShell>{children}</AdminShell>;
}
