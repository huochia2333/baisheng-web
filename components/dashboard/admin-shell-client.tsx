"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  GitBranchPlus,
  Home,
  LoaderCircle,
  LogOut,
  Megaphone,
  ShoppingCart,
  ShieldCheck,
  UserCog,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { signOutCurrentBrowserSession } from "@/lib/browser-auth-session";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { WorkspaceNavItem } from "@/lib/workspace-config";
import { cn } from "@/lib/utils";

export type AdminShellNavLink = {
  href: string;
  icon: WorkspaceNavItem["segment"];
  label: string;
};

type AdminShellNavProps = {
  items: readonly AdminShellNavLink[];
  mode: "desktop" | "mobile";
};

type AdminShellLogoutButtonProps = {
  label: string;
};

const NAV_ICONS: Record<WorkspaceNavItem["segment"], LucideIcon> = {
  announcements: Megaphone,
  commission: WalletCards,
  "exchange-rates": ArrowLeftRight,
  home: Home,
  my: UserRound,
  orders: ShoppingCart,
  people: UserCog,
  referrals: GitBranchPlus,
  reviews: ShieldCheck,
  tasks: ClipboardList,
  team: UsersRound,
};

export function AdminShellNav({ items, mode }: AdminShellNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const resolvedPendingHref = pendingHref === pathname ? null : pendingHref;

  useEffect(() => {
    items.forEach((item) => {
      if (item.href !== pathname) {
        void router.prefetch(item.href);
      }
    });
  }, [items, pathname, router]);

  const prefetchRoute = (href: string) => {
    if (href === pathname) {
      return;
    }

    void router.prefetch(href);
  };

  const handleNavClick = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      href === pathname
    ) {
      return;
    }

    setPendingHref(href);
  };

  if (mode === "mobile") {
    return (
      <div className="flex w-max gap-1.5 sm:gap-2">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const isActive = pathname === item.href;
          const isPending = resolvedPendingHref === item.href && !isActive;

          return (
            <Link
              aria-busy={isPending || undefined}
              key={item.href}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href)}
              onFocus={() => prefetchRoute(item.href)}
              onMouseEnter={() => prefetchRoute(item.href)}
              prefetch
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                isActive
                  ? "bg-[#486782] text-white shadow-[0_10px_20px_rgba(72,103,130,0.22)]"
                  : isPending
                    ? "bg-[#dbe6ee] text-[#36536a] shadow-[0_10px_20px_rgba(72,103,130,0.12)]"
                  : "bg-white/80 text-[#486782] hover:bg-[#edf1f4]",
              )}
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex-1 space-y-1.5">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const isActive = pathname === item.href;
        const isPending = resolvedPendingHref === item.href && !isActive;

        return (
          <Link
            aria-busy={isPending || undefined}
            aria-current={isActive ? "page" : undefined}
            key={item.href}
            href={item.href}
            onClick={(event) => handleNavClick(event, item.href)}
            onFocus={() => prefetchRoute(item.href)}
            onMouseEnter={() => prefetchRoute(item.href)}
            prefetch
            className={cn(
              "mx-1 flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition-all duration-200",
              isActive
                ? "translate-x-1 bg-[#486782] text-white shadow-[0_12px_24px_rgba(72,103,130,0.24)]"
                : isPending
                  ? "translate-x-1 bg-[#dbe6ee] text-[#36536a] shadow-[0_10px_20px_rgba(72,103,130,0.1)]"
                : "text-[#415f76]/72 hover:bg-[#e5e3df] hover:text-[#314b61]",
            )}
          >
            {isPending ? (
              <LoaderCircle className="size-[18px] animate-spin" />
            ) : (
              <Icon className="size-[18px]" />
            )}
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShellLogoutButton({
  label,
}: AdminShellLogoutButtonProps) {
  const supabase = getBrowserSupabaseClient();
  const [pending, setPending] = useState(false);

  const handleLogout = () => {
    if (pending) {
      return;
    }

    setPending(true);
    signOutCurrentBrowserSession(supabase);
  };

  return (
    <div className="mt-auto px-1">
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fceaea] py-3 text-sm font-semibold text-[#c43d3d] transition-colors hover:bg-[#f8dddd] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={handleLogout}
        type="button"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {label}
      </button>
    </div>
  );
}
