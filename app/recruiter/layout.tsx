import type { ReactNode } from "react";
import "../workspace.css";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireWorkspaceAccess } from "@/lib/server-auth";

export default async function RecruiterLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceAccess("/recruiter");

  return <AdminShell>{children}</AdminShell>;
}
