"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronDown,
  ClipboardClock,
  ClipboardList,
  GitBranchPlus,
  Home,
  LoaderCircle,
  LogOut,
  Megaphone,
  MessageSquareWarning,
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
  feedback: MessageSquareWarning,
  home: Home,
  my: UserRound,
  orders: ShoppingCart,
  people: UserCog,
  records: ClipboardClock,
  referrals: GitBranchPlus,
  reviews: ShieldCheck,
  tasks: ClipboardList,
  team: UsersRound,
};

export function AdminShellNav({ items, mode }: AdminShellNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const resolvedPendingHref = pendingHref === pathname ? null : pendingHref;
  const activeItem = items.find((item) => item.href === pathname) ?? items[0] ?? null;

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
    if (!activeItem) {
      return null;
    }

    const ActiveIcon = NAV_ICONS[activeItem.icon];
    const activeIsPending = resolvedPendingHref === activeItem.href;

    return (
      <div className="relative">
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={activeItem.label}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] border border-white/90 bg-white/88 px-4 py-3 text-left text-[#486782] shadow-[0_12px_28px_rgba(72,103,130,0.1)] backdrop-blur transition-colors hover:bg-[#f2f5f7]"
          onClick={() => setMobileMenuOpen((value) => !value)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {activeIsPending ? (
              <LoaderCircle className="size-4 shrink-0 animate-spin" />
            ) : (
              <ActiveIcon className="size-4 shrink-0" />
            )}
            <span className="min-w-0 truncate text-sm font-semibold">
              {activeItem.label}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              mobileMenuOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        {mobileMenuOpen ? (
          <nav className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[62vh] overflow-y-auto rounded-[22px] border border-white/90 bg-[#fbfaf8]/98 p-2 shadow-[0_22px_50px_rgba(35,49,58,0.2)] backdrop-blur">
            <div className="grid gap-1.5">
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
                    onClick={(event) => {
                      handleNavClick(event, item.href);
                      setMobileMenuOpen(false);
                    }}
                    onFocus={() => prefetchRoute(item.href)}
                    onMouseEnter={() => prefetchRoute(item.href)}
                    prefetch
                    className={cn(
                      "flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-[#486782] text-white shadow-[0_10px_20px_rgba(72,103,130,0.18)]"
                        : isPending
                          ? "bg-[#dbe6ee] text-[#36536a]"
                          : "text-[#486782] hover:bg-[#eef3f6]",
                    )}
                  >
                    {isPending ? (
                      <LoaderCircle className="size-4 shrink-0 animate-spin" />
                    ) : (
                      <Icon className="size-4 shrink-0" />
                    )}
                    <span className="min-w-0 truncate font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
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
