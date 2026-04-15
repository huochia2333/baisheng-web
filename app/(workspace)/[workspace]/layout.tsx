import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { requireWorkspaceAccess } from "@/lib/server-auth";
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
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    notFound();
  }

  await requireWorkspaceAccess(config.basePath);

  return <AdminShell config={config}>{children}</AdminShell>;
}
