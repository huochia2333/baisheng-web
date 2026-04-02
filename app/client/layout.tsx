import type { ReactNode } from "react";

import { AdminShell } from "@/components/dashboard/admin-shell";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
