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
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

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
  serviceUnavailableMessage: string;
};

const NAV_ICONS: Record<WorkspaceNavItem["segment"], LucideIcon> = {
  announcements: Megaphone,
  commission: WalletCards,
  "exchange-rates": ArrowLeftRight,
  home: Home,
  my: UserRound,
  orders: ShoppingCart,
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
      <div className="flex w-max gap-2">
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
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
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
  serviceUnavailableMessage,
}: AdminShellLogoutButtonProps) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    if (pending) {
      return;
    }

    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage(serviceUnavailableMessage);
      return;
    }

    setPending(true);

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
      setErrorMessage(
        error instanceof Error ? error.message : serviceUnavailableMessage,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-auto px-1">
      {errorMessage ? (
        <p className="mb-3 rounded-2xl border border-[#f1d1d1] bg-[#fff2f2] px-4 py-3 text-xs leading-6 text-[#9f3535]">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fceaea] py-3 text-sm font-semibold text-[#c43d3d] transition-colors hover:bg-[#f8dddd] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={() => void handleLogout()}
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
