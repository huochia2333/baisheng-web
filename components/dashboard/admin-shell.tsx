import type { ReactNode } from "react";

import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";

import {
  AdminShellLogoutButton,
  AdminShellNav,
  AdminShellSessionSync,
  type AdminShellNavLink,
} from "@/components/dashboard/admin-shell-client";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import {
  getWorkspaceNavHref,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";

type WorkspaceConfig = {
  accountLabel: string;
  initials: string;
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
  const t = await getTranslations("DashboardShell");
  const workspace = getWorkspaceConfig(config, t);

  return (
    <ScopedIntlProvider namespaces={["DashboardShell", "LanguageToggle"]}>
      <div className="min-h-screen bg-[#faf9f7] text-[#1c262d]">
        <AdminShellSessionSync />

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute right-[-10%] top-[-18%] h-[30rem] w-[30rem] rounded-full bg-[rgba(187,208,223,0.24)] blur-3xl" />
          <div className="absolute bottom-[-14%] left-[-10%] h-[24rem] w-[24rem] rounded-full bg-[rgba(208,226,217,0.2)] blur-3xl" />
        </div>

        <div className="relative flex min-h-screen">
          <aside className="fixed inset-y-4 left-4 z-20 hidden w-[252px] rounded-[28px] border border-white/80 bg-[#f4f3f1]/92 px-4 py-6 shadow-[0_18px_45px_rgba(96,113,128,0.12)] backdrop-blur md:flex md:flex-col">
            <div className="mb-10 flex items-center gap-3 px-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6b8398,#4b6880)] text-sm font-semibold text-white shadow-sm">
                {workspace.initials}
              </div>
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

          <div className="flex min-h-screen flex-1 flex-col md:pl-[284px]">
            <header className="sticky top-0 z-10 border-b border-white/50 bg-[#faf9f7]/82 backdrop-blur">
              <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="min-w-0">
                  <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                    {workspace.workspaceLabel}
                  </p>
                  <h1 className="truncate text-2xl font-bold tracking-tight text-[#486782] sm:text-3xl">
                    {t("brandTitle")}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white"
                    type="button"
                  >
                    <Bell className="size-[18px]" />
                  </button>
                  <button
                    className="hidden items-center gap-3 rounded-full bg-[#f1efeb] py-1.5 pl-1.5 pr-4 transition-colors hover:bg-[#e8e5e0] sm:flex"
                    type="button"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5b7890] text-xs font-semibold text-white">
                      {workspace.initials}
                    </div>
                    <span className="text-sm font-medium text-[#486782]">
                      {workspace.accountLabel}
                    </span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto px-4 pb-4 md:hidden">
                <AdminShellNav items={workspace.navItems} mode="mobile" />
              </div>
            </header>

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </ScopedIntlProvider>
  );
}

function getWorkspaceConfig(
  config: WorkspaceRouteConfig,
  t: Translator,
): WorkspaceConfig {
  const roleKey = config.routeSegment;

  return {
    accountLabel: t(`roles.${roleKey}.accountLabel`),
    initials: config.initials,
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
