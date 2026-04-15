import { notFound } from "next/navigation";

import { DashboardSharedMyClient } from "@/components/dashboard/dashboard-shared-my-client";
import { getWorkspaceConfigByRouteSegment } from "@/lib/workspace-config";

type WorkspaceMyPageProps = {
  params: Promise<{ workspace: string }>;
};

export default async function WorkspaceMyPage({
  params,
}: WorkspaceMyPageProps) {
  const { workspace } = await params;

  if (!getWorkspaceConfigByRouteSegment(workspace)) {
    notFound();
  }

  return <DashboardSharedMyClient />;
}
