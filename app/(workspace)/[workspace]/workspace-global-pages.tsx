import type { Metadata } from "next";

import dynamic from "next/dynamic";
import { forbidden, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAdminAnnouncementsPageData } from "@/lib/announcements";
import { getAdminSystemSettingsPageData } from "@/lib/admin-system-settings";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getAdminWorkspaceFeedbackPageData } from "@/lib/workspace-feedback";
import {
  getWorkspaceConfigByRouteSegment,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";

type WorkspaceGlobalPageProps = {
  params: Promise<{ workspace: string }>;
};

const AdminAnnouncementsClient = dynamic(
  () =>
    import("@/components/dashboard/announcements/announcements-client").then(
      (mod) => mod.AdminAnnouncementsClient,
    ),
);

const AdminFeedbackClient = dynamic(
  () =>
    import("@/components/dashboard/admin-feedback/admin-feedback-client").then(
      (mod) => mod.AdminFeedbackClient,
    ),
);

const AdminSystemSettingsClient = dynamic(
  () =>
    import(
      "@/components/dashboard/admin-system-settings/admin-system-settings-client"
    ).then((mod) => mod.AdminSystemSettingsClient),
);

export async function generateWorkspaceAnnouncementsMetadata(): Promise<Metadata> {
  const t = await getTranslations("Announcements.metadata");

  return {
    title: t("title"),
  };
}

export async function generateWorkspaceFeedbackMetadata(): Promise<Metadata> {
  const t = await getTranslations("WorkspaceFeedback.metadata");

  return {
    title: t("title"),
  };
}

export async function generateWorkspaceSettingsMetadata(): Promise<Metadata> {
  const t = await getTranslations("SystemSettings.metadata");

  return {
    title: t("title"),
  };
}

export async function renderWorkspaceAnnouncementsPage({
  params,
}: WorkspaceGlobalPageProps) {
  const config = await getGlobalPageConfig(params);

  if (!config.pageVariants.announcements) {
    forbidden();
  }

  const supabase = await getServerSupabaseClient();
  const initialData = await getAdminAnnouncementsPageData(supabase);

  return (
    <ScopedIntlProvider namespaces={["Announcements", "DashboardShared"]}>
      <AdminAnnouncementsClient initialData={initialData} />
    </ScopedIntlProvider>
  );
}

export async function renderWorkspaceFeedbackPage({
  params,
}: WorkspaceGlobalPageProps) {
  const config = await getGlobalPageConfig(params);

  if (!config.pageVariants.feedback) {
    forbidden();
  }

  const supabase = await getServerSupabaseClient();
  const initialData = await getAdminWorkspaceFeedbackPageData(supabase);

  return (
    <ScopedIntlProvider namespaces={["WorkspaceFeedback", "DashboardShared"]}>
      <AdminFeedbackClient initialData={initialData} />
    </ScopedIntlProvider>
  );
}

export async function renderWorkspaceSettingsPage({
  params,
}: WorkspaceGlobalPageProps) {
  const config = await getGlobalPageConfig(params);

  if (!config.pageVariants.settings) {
    forbidden();
  }

  const supabase = await getServerSupabaseClient();
  const initialData = await getAdminSystemSettingsPageData(supabase);

  return (
    <ScopedIntlProvider
      namespaces={[
        "Commission",
        "DashboardPagination",
        "ExchangeRates",
        "Orders",
        "OrdersUI",
        "SystemSettings",
      ]}
    >
      <AdminSystemSettingsClient initialData={initialData} />
    </ScopedIntlProvider>
  );
}

async function getGlobalPageConfig(
  params: WorkspaceGlobalPageProps["params"],
): Promise<WorkspaceRouteConfig> {
  const { workspace } = await params;
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    notFound();
  }

  return config;
}
