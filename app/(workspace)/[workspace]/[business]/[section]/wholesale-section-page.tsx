import { forbidden, notFound } from "next/navigation";
import dynamic from "next/dynamic";

import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getWholesalePageData } from "@/lib/wholesale";
import {
  isWorkspaceWholesaleSectionKey,
  type WorkspaceRouteConfig,
  type WorkspaceWholesaleSectionKey,
} from "@/lib/workspace-config";

const WholesaleClient = dynamic(
  () =>
    import("@/components/dashboard/wholesale/wholesale-client").then(
      (mod) => mod.WholesaleClient,
    ),
);

export async function renderWholesaleSectionPage(
  section: string,
  config: WorkspaceRouteConfig,
) {
  const wholesaleSection = getEnabledWholesaleSection(section, config);

  if (!wholesaleSection) {
    if (isWorkspaceWholesaleSectionKey(section)) {
      forbidden();
    }

    notFound();
  }

  const supabase = await getServerSupabaseClient();
  const initialData = await getWholesalePageData(supabase, wholesaleSection);

  return (
    <ScopedIntlProvider namespaces={["DashboardShared"]}>
      <WholesaleClient initialData={initialData} />
    </ScopedIntlProvider>
  );
}

function getEnabledWholesaleSection(
  section: string,
  config: WorkspaceRouteConfig,
): WorkspaceWholesaleSectionKey | null {
  if (!isWorkspaceWholesaleSectionKey(section)) {
    return null;
  }

  return config.wholesalePageVariants?.[section] ? section : null;
}
