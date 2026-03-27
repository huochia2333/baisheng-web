"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  ClipboardList,
  GitBranchPlus,
  LogOut,
  ShoppingCart,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/my", label: "我的", icon: UserRound },
  { href: "/admin/orders", label: "订单", icon: ShoppingCart },
  { href: "/admin/referrals", label: "推荐树", icon: GitBranchPlus },
  { href: "/admin/team", label: "团队", icon: UsersRound },
  { href: "/admin/commission", label: "佣金", icon: WalletCards },
  { href: "/admin/exchange-rates", label: "汇率", icon: ArrowLeftRight },
  { href: "/admin/tasks", label: "任务", icon: ClipboardList },
  { href: "/admin/reviews", label: "审核", icon: ShieldCheck },
] as const;

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

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
              AD
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-[#415f76]">管理员</h2>
              <p className="text-xs text-[#415f76]/60">系统管理层</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {adminNavItems.map((item) => {
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
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fceaea] py-3 text-sm font-semibold text-[#c43d3d] transition-colors hover:bg-[#f8dddd]">
              <LogOut className="size-4" />
              退出登录
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col md:pl-[284px]">
          <header className="sticky top-0 z-10 border-b border-white/50 bg-[#faf9f7]/82 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                  Admin Workspace
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
                    AD
                  </div>
                  <span className="text-sm font-medium text-[#486782]">管理员账户</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto px-4 pb-4 md:hidden">
              <div className="flex w-max gap-2">
                {adminNavItems.map((item) => {
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
