"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  getDefaultWorkspaceBasePath,
  getRoleFromAccessToken,
  getRoleFromCurrentSession,
  type AppRole,
} from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

const sharedNavItems = [
  { segment: "my", label: "我的", icon: UserRound },
  { segment: "orders", label: "订单", icon: ShoppingCart },
  { segment: "referrals", label: "推荐树", icon: GitBranchPlus },
  { segment: "team", label: "团队", icon: UsersRound },
  { segment: "commission", label: "佣金", icon: WalletCards },
  { segment: "exchange-rates", label: "汇率", icon: ArrowLeftRight },
  { segment: "tasks", label: "任务", icon: ClipboardList },
] as const;

const adminNavItems = [
  ...sharedNavItems,
  { segment: "reviews", label: "审核", icon: ShieldCheck },
] as const;

function getWorkspaceConfig(
  role: AppRole | null,
  resolved: boolean,
  pathname: string,
) {
  const hintedBasePath = pathname.startsWith("/salesman") ? "/salesman" : "/admin";
  const basePath = resolved ? getDefaultWorkspaceBasePath(role) : hintedBasePath;
  const salesmanWorkspace = basePath === "/salesman";
  const navConfig = salesmanWorkspace ? sharedNavItems : adminNavItems;
  const navItems = navConfig.map((item) => ({
    ...item,
    href: `${basePath}/${item.segment}`,
  }));

  if (!resolved && !salesmanWorkspace) {
    return {
      accountLabel: "工作台账户",
      basePath,
      initials: "WS",
      navItems,
      subtitle: "正在识别当前角色",
      title: "工作台",
      workspaceLabel: "平台中心",
    };
  }

  if (salesmanWorkspace) {
    return {
      accountLabel: "业务员账户",
      basePath,
      initials: "YW",
      navItems,
      subtitle: "业务拓展岗",
      title: "业务员",
      workspaceLabel: "业务中心",
    };
  }

  return {
    accountLabel: "管理员账户",
    basePath,
    initials: "AD",
    navItems,
    subtitle: "系统管理层",
    title: "管理员",
    workspaceLabel: "管理中心",
  };
}

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const syncRole = async () => {
      try {
        const nextRole = await getRoleFromCurrentSession(supabase);

        if (!isMounted) {
          return;
        }

        setRole(nextRole);
      } finally {
        if (isMounted) {
          setRoleResolved(true);
        }
      }
    };

    void syncRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (!session?.user) {
          setRole(null);
          setRoleResolved(true);
          return;
        }

        setRole(getRoleFromAccessToken(session.access_token));
        setRoleResolved(true);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!roleResolved) {
      return;
    }

    const currentBasePath = pathname.startsWith("/salesman")
      ? "/salesman"
      : pathname.startsWith("/admin")
        ? "/admin"
        : null;

    if (!currentBasePath) {
      return;
    }

    const desiredBasePath = getDefaultWorkspaceBasePath(role);

    if (currentBasePath === desiredBasePath) {
      return;
    }

    const nextPath = `${desiredBasePath}${pathname.slice(currentBasePath.length)}`;
    router.replace(nextPath || `${desiredBasePath}/my`);
  }, [pathname, role, roleResolved, router]);

  const workspace = getWorkspaceConfig(role, roleResolved, pathname);

  const handleLogout = async () => {
    if (logoutPending) {
      return;
    }

    setLogoutError(null);

    if (!supabase) {
      setLogoutError("当前服务暂时不可用，请稍后再试。");
      return;
    }

    setLogoutPending(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setRole(null);
      setRoleResolved(true);

      if (typeof window !== "undefined") {
        window.location.replace("/login");
        return;
      }

      router.replace("/login");
    } catch (error) {
      setLogoutError(getErrorMessage(error));
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
              退出登录
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
                  柏盛管理系统
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white">
                  <Bell className="size-[18px]" />
                </button>
                <button className="hidden items-center gap-3 rounded-full bg-[#f1efeb] py-1.5 pl-1.5 pr-4 transition-colors hover:bg-[#e8e5e0] sm:flex">
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "当前服务暂时不可用，请稍后再试。";
}
