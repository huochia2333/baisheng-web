import type { ReactNode } from "react";

import { AdminShell } from "@/components/dashboard/admin-shell";

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
