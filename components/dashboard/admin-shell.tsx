import type { ReactNode } from "react";

import { getLocale, getTranslations } from "next-intl/server";

import { AdminShellNav } from "@/components/dashboard/admin-shell-nav";
import { AdminShellLogoutButton } from "@/components/dashboard/admin-shell-client";
import type {
  AdminShellNavGroup,
  AdminShellNavLink,
} from "@/components/dashboard/admin-shell-nav-types";
import { AiAssistantClient } from "@/components/dashboard/ai-assistant/ai-assistant-client";
import { BrandMark } from "@/components/brand/brand-mark";
import { WorkspaceHeaderActions } from "@/components/dashboard/workspace-header-actions";
import { WorkspaceSessionProvider } from "@/components/dashboard/workspace-session-provider";
import {
  WorkspaceCustomizationSidebarProvider,
  WorkspaceDesktopSidebar,
} from "@/components/dashboard/workspace-customization-sidebar";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getCompanyText } from "@/lib/company-config";
import { normalizeLocale } from "@/lib/locale";
import {
  getWorkspaceBusinessNavHref,
  getWorkspaceNavHref,
  type WorkspaceBusinessKey,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import {
  getCurrentWorkspaceBusinessAccess,
  workspaceBusinessAccessIncludes,
} from "@/lib/workspace-business-access";
import {
  EMPTY_WORKSPACE_ANNOUNCEMENTS_STATE,
  getWorkspaceAnnouncementsState,
} from "@/lib/workspace-announcements";

type WorkspaceConfig = {
  accountLabel: string;
  globalNavItems: AdminShellNavLink[];
  initials: string;
  myHref: string;
  navGroups: AdminShellNavGroup[];
  subtitle: string;
  title: string;
  workspaceLabel: string;
};

type Translator = (key: string) => string;

type AdminShellProps = {
  children: ReactNode;
  config: WorkspaceRouteConfig;
};

export async function AdminShell({ children, config }: AdminShellProps) {
  const [t, initialAnnouncementsState, workspaceBusinessAccess, locale] = await Promise.all([
    getTranslations("DashboardShell"),
    getInitialWorkspaceAnnouncementsState(),
    getShellWorkspaceBusinessAccess(),
    getLocale(),
  ]);
  const companyText = getCompanyText(normalizeLocale(locale));
  const workspace = getWorkspaceConfig(config, t, workspaceBusinessAccess);

  return (
    <ScopedIntlProvider namespaces={["DashboardShell", "LanguageToggle"]}>
      <WorkspaceSessionProvider>
        <WorkspaceCustomizationSidebarProvider>
        <div className="min-h-screen bg-[#faf9f7] text-[#1c262d]">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute right-[-10%] top-[-18%] h-[30rem] w-[30rem] rounded-full bg-[rgba(187,208,223,0.24)] blur-3xl" />
            <div className="absolute bottom-[-14%] left-[-10%] h-[24rem] w-[24rem] rounded-full bg-[rgba(208,226,217,0.2)] blur-3xl" />
          </div>

          <div className="relative flex min-h-screen">
            <WorkspaceDesktopSidebar
              defaultContent={
                <>
                  <div className="mb-10 flex items-center gap-3 px-3">
                    <BrandMark priority size={48} />
                    <div>
                      <h2 className="text-sm font-bold tracking-wide text-[#415f76]">
                        {workspace.title}
                      </h2>
                    <p className="text-xs text-[#415f76]/60">
                      {workspace.subtitle}
                    </p>
                    </div>
                  </div>

                  <AdminShellNav
                    emptyGroupsLabel={t("business.noAccess")}
                    globalItems={workspace.globalNavItems}
                    groups={workspace.navGroups}
                    mode="desktop"
                  />

                  <AdminShellLogoutButton label={t("logout")} />
                </>
              }
            />

            <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[284px]">
              <header className="sticky top-0 z-10 border-b border-white/50 bg-[#faf9f7]/82 backdrop-blur">
                <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:flex sm:justify-between sm:px-6 sm:py-4 lg:px-8">
                  <div className="min-w-[4.5rem] sm:min-w-0">
                    <p className="font-label whitespace-nowrap text-[10px] tracking-[0.08em] text-[#8e99a3] uppercase sm:text-[11px] sm:tracking-[0.2em]">
                      {workspace.workspaceLabel}
                    </p>
                    <h1 className="hidden text-xl font-bold tracking-tight text-[#486782] sm:block sm:text-3xl">
                      {companyText.productName}
                    </h1>
                  </div>

                  <div className="flex items-center justify-end gap-2 sm:gap-3">
                    <LanguageToggle />
                    <WorkspaceHeaderActions
                      accountLabel={workspace.accountLabel}
                      initialAnnouncementsState={initialAnnouncementsState}
                      initials={workspace.initials}
                      myHref={workspace.myHref}
                    />
                  </div>

                  <h1 className="col-span-2 break-words text-2xl font-bold tracking-tight text-[#486782] sm:hidden">
                    {companyText.productName}
                  </h1>
                </div>

                <div className="px-3 pb-3 md:hidden">
                  <AdminShellNav
                    emptyGroupsLabel={t("business.noAccess")}
                    globalItems={workspace.globalNavItems}
                    groups={workspace.navGroups}
                    mode="mobile"
                  />
                </div>
              </header>

              <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
              <AiAssistantClient />
            </div>
          </div>
        </div>
        </WorkspaceCustomizationSidebarProvider>
      </WorkspaceSessionProvider>
    </ScopedIntlProvider>
  );
}

async function getInitialWorkspaceAnnouncementsState() {
  try {
    const supabase = await getServerSupabaseClient();

    return await getWorkspaceAnnouncementsState(supabase);
  } catch {
    return EMPTY_WORKSPACE_ANNOUNCEMENTS_STATE;
  }
}

function getWorkspaceConfig(
  config: WorkspaceRouteConfig,
  t: Translator,
  workspaceBusinessAccess: readonly WorkspaceBusinessKey[],
): WorkspaceConfig {
  const roleKey = config.routeSegment;
  const globalNavItems = config.globalNavItems;
  const navGroups = config.navGroups
    .filter((group) =>
      workspaceBusinessAccessIncludes(workspaceBusinessAccess, group.business),
    )
    .map((group) => {
      return {
        items: group.navItems.map((item) => {
          const business = item.business ?? group.business;

          return {
            groupKey: group.business,
            groupLabel: t(`business.${group.labelKey}`),
            href: getWorkspaceBusinessNavHref(config, business, item.segment),
            icon: item.segment,
            label: t(`nav.${item.labelKey}`),
          };
        }),
        key: group.business,
        label: t(`business.${group.labelKey}`),
      };
    })
    .filter((group) => group.items.length > 0);

  return {
    accountLabel: t(`roles.${roleKey}.accountLabel`),
    globalNavItems: globalNavItems.map((item) => ({
      href: getWorkspaceNavHref(config, item.segment),
      icon: item.segment,
      label: t(`nav.${item.labelKey}`),
    })),
    initials: config.initials,
    myHref: getWorkspaceNavHref(config, "my"),
    navGroups,
    subtitle: t(`roles.${roleKey}.subtitle`),
    title: t(`roles.${roleKey}.title`),
    workspaceLabel: t(`roles.${roleKey}.workspaceLabel`),
  };
}

async function getShellWorkspaceBusinessAccess() {
  try {
    const supabase = await getServerSupabaseClient();

    return await getCurrentWorkspaceBusinessAccess(supabase);
  } catch {
    return [];
  }
}
