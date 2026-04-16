"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
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

import {
  getDefaultWorkspaceBasePath,
  getWorkspaceBasePath,
} from "@/lib/auth-routing";
import { getRoleFromAuthClaims } from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
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
  commission: WalletCards,
  "exchange-rates": ArrowLeftRight,
  my: UserRound,
  orders: ShoppingCart,
  referrals: GitBranchPlus,
  reviews: ShieldCheck,
  tasks: ClipboardList,
  team: UsersRound,
};

export function AdminShellSessionSync() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent: true,
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      const authClient = supabase;

      if (!authClient) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const currentBasePath = getWorkspaceBasePath(pathname);

      if (!currentBasePath) {
        return;
      }

      const role = await getRoleFromAuthClaims(authClient, session.user);

      if (!role) {
        return;
      }

      const desiredBasePath = getDefaultWorkspaceBasePath(role);

      if (currentBasePath === desiredBasePath) {
        return;
      }

      const suffix = pathname.slice(currentBasePath.length) || "/my";
      router.replace(`${desiredBasePath}${suffix}`);
    },
  });

  return null;
}

export function AdminShellNav({ items, mode }: AdminShellNavProps) {
  const pathname = usePathname();

  if (mode === "mobile") {
    return (
      <div className="flex w-max gap-2">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
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
    );
  }

  return (
    <nav className="flex-1 space-y-1.5">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
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
