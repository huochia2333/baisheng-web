import type { ReactNode } from "react";

import { getTranslations } from "next-intl/server";

import {
  AdminShellLogoutButton,
  AdminShellNav,
  type AdminShellNavLink,
} from "@/components/dashboard/admin-shell-client";
import { BrandMark } from "@/components/brand/brand-mark";
import { WorkspaceHeaderActions } from "@/components/dashboard/workspace-header-actions";
import { WorkspaceSessionProvider } from "@/components/dashboard/workspace-session-provider";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import {
  getWorkspaceNavHref,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import {
  EMPTY_WORKSPACE_ANNOUNCEMENTS_STATE,
  getWorkspaceAnnouncementsState,
} from "@/lib/workspace-announcements";

type WorkspaceConfig = {
  accountLabel: string;
  initials: string;
  myHref: string;
  navItems: AdminShellNavLink[];
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
  const [t, initialAnnouncementsState] = await Promise.all([
    getTranslations("DashboardShell"),
    getInitialWorkspaceAnnouncementsState(),
  ]);
  const workspace = getWorkspaceConfig(config, t);

  return (
    <ScopedIntlProvider namespaces={["DashboardShell", "LanguageToggle"]}>
      <WorkspaceSessionProvider>
        <div className="min-h-screen bg-[#faf9f7] text-[#1c262d]">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute right-[-10%] top-[-18%] h-[30rem] w-[30rem] rounded-full bg-[rgba(187,208,223,0.24)] blur-3xl" />
            <div className="absolute bottom-[-14%] left-[-10%] h-[24rem] w-[24rem] rounded-full bg-[rgba(208,226,217,0.2)] blur-3xl" />
          </div>

          <div className="relative flex min-h-screen">
            <aside className="fixed inset-y-4 left-4 z-20 hidden w-[252px] rounded-[28px] border border-white/80 bg-[#f4f3f1]/92 px-4 py-6 shadow-[0_18px_45px_rgba(96,113,128,0.12)] backdrop-blur md:flex md:flex-col">
              <div className="mb-10 flex items-center gap-3 px-3">
                <BrandMark priority size={48} />
                <div>
                  <h2 className="text-sm font-bold tracking-wide text-[#415f76]">
                    {workspace.title}
                  </h2>
                  <p className="text-xs text-[#415f76]/60">{workspace.subtitle}</p>
                </div>
              </div>

              <AdminShellNav items={workspace.navItems} mode="desktop" />

              <AdminShellLogoutButton
                label={t("logout")}
                serviceUnavailableMessage={t("serviceUnavailable")}
              />
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[284px]">
              <header className="sticky top-0 z-10 border-b border-white/50 bg-[#faf9f7]/82 backdrop-blur">
                <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
                  <div className="min-w-0">
                    <p className="font-label text-[10px] tracking-[0.16em] text-[#8e99a3] uppercase sm:text-[11px] sm:tracking-[0.2em]">
                      {workspace.workspaceLabel}
                    </p>
                    <h1 className="truncate text-xl font-bold tracking-tight text-[#486782] sm:text-3xl">
                      {t("brandTitle")}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <LanguageToggle />
                    <WorkspaceHeaderActions
                      accountLabel={workspace.accountLabel}
                      initialAnnouncementsState={initialAnnouncementsState}
                      initials={workspace.initials}
                      myHref={workspace.myHref}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto px-3 pb-3 md:hidden">
                  <AdminShellNav items={workspace.navItems} mode="mobile" />
                </div>
              </header>

              <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
            </div>
          </div>
        </div>
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
): WorkspaceConfig {
  const roleKey = config.routeSegment;

  return {
    accountLabel: t(`roles.${roleKey}.accountLabel`),
    initials: config.initials,
    myHref: getWorkspaceNavHref(config, "my"),
    navItems: config.navItems.map((item) => ({
      href: getWorkspaceNavHref(config, item.segment),
      icon: item.segment,
      label: t(`nav.${item.labelKey}`),
    })),
    subtitle: t(`roles.${roleKey}.subtitle`),
    title: t(`roles.${roleKey}.title`),
    workspaceLabel: t(`roles.${roleKey}.workspaceLabel`),
  };
}
