import type { ReactNode } from "react";
import "../workspace.css";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireWorkspaceAccess } from "@/lib/server-auth";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceAccess("/client");

  return <AdminShell>{children}</AdminShell>;
}
