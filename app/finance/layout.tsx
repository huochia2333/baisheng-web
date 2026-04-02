import type { ReactNode } from "react";

import { AdminShell } from "@/components/dashboard/admin-shell";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
