import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { getWorkspaceConfigByRouteSegment } from "@/lib/workspace-config";

import "../../workspace.css";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspace } = await params;

  if (!getWorkspaceConfigByRouteSegment(workspace)) {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}
