import { notFound, redirect } from "next/navigation";

import { getWorkspaceConfigByRouteSegment } from "@/lib/workspace-config";

type WorkspacePageProps = {
  params: Promise<{ workspace: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace } = await params;
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    notFound();
  }

  redirect(`${config.basePath}/home`);
}
