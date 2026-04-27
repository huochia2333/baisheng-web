import { notFound, redirect } from "next/navigation";

import { DashboardHomeClient } from "@/components/dashboard/dashboard-home/dashboard-home-client";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getDashboardHomePageData } from "@/lib/dashboard-home";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getWorkspaceConfigByRouteSegment } from "@/lib/workspace-config";

type WorkspaceHomePageProps = {
  params: Promise<{ workspace: string }>;
};

export default async function WorkspaceHomePage({
  params,
}: WorkspaceHomePageProps) {
  const { workspace } = await params;

  if (!getWorkspaceConfigByRouteSegment(workspace)) {
    notFound();
  }

  const supabase = await getServerSupabaseClient();
  const initialData = await getDashboardHomePageData(supabase);

  if (!initialData) {
    redirect("/login");
  }

  return (
    <ScopedIntlProvider
      namespaces={["DashboardHome", "DashboardShared", "Announcements"]}
    >
      <DashboardHomeClient initialData={initialData} />
    </ScopedIntlProvider>
  );
}
