import type { ReactNode } from "react";
import "../workspace.css";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireWorkspaceAccess } from "@/lib/server-auth";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceAccess("/manager");

  return <AdminShell>{children}</AdminShell>;
}
