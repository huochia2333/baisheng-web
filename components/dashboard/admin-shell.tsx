"use client";

import { useEffect, useState, type ReactNode } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Bell,
  ClipboardList,
  GitBranchPlus,
  LoaderCircle,
  LogOut,
  ShoppingCart,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import {
  getDefaultWorkspaceBasePath,
  getWorkspaceBasePath,
} from "@/lib/auth-routing";
import {
  getWorkspaceConfigByBasePath,
  getWorkspaceConfigForPathname,
  getWorkspaceNavHref,
  type WorkspaceNavItem,
  type WorkspaceRouteSegment,
} from "@/lib/workspace-config";
import {
  getRoleFromUser,
} from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type WorkspaceConfig = {
  accountLabel: string;
  initials: string;
  navItems: NavItem[];
  subtitle: string;
  title: string;
  workspaceLabel: string;
};

type Translator = (key: string) => string;

const NAV_ICONS: Record<WorkspaceNavItem["segment"], LucideIcon> = {
  commission: WalletCards,
  "exchange-rates": ArrowLeftRight,
  my: UserRound,
  orders: ShoppingCart,
  referrals: GitBranchPlus,
  reviews: ShieldCheck,
  tasks: ClipboardList,
  team: UsersRound,
};

function getWorkspaceConfig(pathname: string, t: Translator): WorkspaceConfig {
  const basePath = getWorkspaceBasePath(pathname) ?? getDefaultWorkspaceBasePath(null);
  const routeConfig = getWorkspaceConfigForPathname(pathname) ??
    getWorkspaceConfigByBasePath(basePath);

  if (!routeConfig) {
    return {
      accountLabel: t("roles.client.accountLabel"),
      initials: "CL",
      navItems: [],
      subtitle: t("roles.client.subtitle"),
      title: t("roles.client.title"),
      workspaceLabel: t("roles.client.workspaceLabel"),
    };
  }

  const roleKey: WorkspaceRouteSegment = routeConfig.routeSegment;

  return {
    accountLabel: t(`roles.${roleKey}.accountLabel`),
    initials: routeConfig.initials,
    navItems: routeConfig.navItems.map((item) => ({
      href: getWorkspaceNavHref(routeConfig, item.segment),
      icon: NAV_ICONS[item.segment],
      label: t(`nav.${item.labelKey}`),
    })),
    subtitle: t(`roles.${roleKey}.subtitle`),
    title: t(`roles.${roleKey}.title`),
    workspaceLabel: t(`roles.${roleKey}.workspaceLabel`),
  };
}

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("DashboardShell");
  const supabase = getBrowserSupabaseClient();
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const workspace = getWorkspaceConfig(pathname, t);

  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent: true,
    onAuthStateChange: ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        setLogoutError(null);
        router.replace("/login");
        return;
      }

      const currentBasePath = getWorkspaceBasePath(pathname);

      if (!currentBasePath) {
        return;
      }

      const desiredBasePath = getDefaultWorkspaceBasePath(
        getRoleFromUser(session.user),
      );

      if (currentBasePath === desiredBasePath) {
        return;
      }

      const suffix = pathname.slice(currentBasePath.length) || "/my";
      router.replace(`${desiredBasePath}${suffix}`);
    },
  });

  useEffect(() => {
    workspace.navItems.forEach((item) => {
      if (item.href === pathname) {
        return;
      }

      void router.prefetch(item.href);
    });
  }, [pathname, router, workspace.navItems]);

  const handleLogout = async () => {
    if (logoutPending) {
      return;
    }

    setLogoutError(null);

    if (!supabase) {
      setLogoutError(t("serviceUnavailable"));
      return;
    }

    setLogoutPending(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      if (typeof window !== "undefined") {
        window.location.replace("/login");
        return;
      }

      router.replace("/login");
    } catch (error) {
      setLogoutError(getErrorMessage(error, t("serviceUnavailable")));
    } finally {
      setLogoutPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1c262d]">
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

          <nav className="flex-1 space-y-1.5">
            {workspace.navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mx-1 flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition-all duration-200",
                    isActive
                      ? "translate-x-1 bg-[#486782] text-white shadow-[0_12px_24px_rgba(72,103,130,0.24)]"
                      : "text-[#415f76]/72 hover:bg-[#e5e3df] hover:text-[#314b61]",
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-1">
            {logoutError ? (
              <p className="mb-3 rounded-2xl border border-[#f1d1d1] bg-[#fff2f2] px-4 py-3 text-xs leading-6 text-[#9f3535]">
                {logoutError}
              </p>
            ) : null}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fceaea] py-3 text-sm font-semibold text-[#c43d3d] transition-colors hover:bg-[#f8dddd] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={logoutPending}
              onClick={() => void handleLogout()}
              type="button"
            >
              {logoutPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {t("logout")}
            </button>
          </div>
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
              <div className="flex w-max gap-2">
                {workspace.navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                        isActive
                          ? "bg-[#486782] text-white shadow-[0_10px_20px_rgba(72,103,130,0.22)]"
                          : "bg-white/80 text-[#486782] hover:bg-[#edf1f4]",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
