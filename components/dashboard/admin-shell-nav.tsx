"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import {
  BadgeDollarSign,
  ChevronDown,
  ClipboardCheck,
  ClipboardClock,
  ClipboardList,
  GitBranchPlus,
  Home,
  LoaderCircle,
  Megaphone,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { WorkspaceNavSegment } from "@/lib/workspace-config";
import { cn } from "@/lib/utils";

import { useAdminShellNavigation } from "./use-admin-shell-navigation";
import type {
  AdminShellNavGroup,
  AdminShellNavLink,
} from "./admin-shell-nav-types";

type AdminShellNavProps = {
  emptyGroupsLabel: string;
  globalItems: readonly AdminShellNavLink[];
  groups: readonly AdminShellNavGroup[];
  mode: "desktop" | "mobile";
};

const NAV_ICONS: Record<WorkspaceNavSegment, LucideIcon> = {
  accounts: UserCog,
  announcements: Megaphone,
  commission: WalletCards,
  feedback: MessageSquareWarning,
  home: Home,
  incentives: BadgeDollarSign,
  logistics: Truck,
  my: UserRound,
  "order-claims": ClipboardCheck,
  orders: ShoppingCart,
  people: UsersRound,
  records: ClipboardClock,
  referrals: GitBranchPlus,
  reviews: ShieldCheck,
  settings: Settings,
  tasks: ClipboardList,
  team: UsersRound,
};

export function AdminShellNav({
  emptyGroupsLabel,
  globalItems,
  groups,
  mode,
}: AdminShellNavProps) {
  const items = useMemo(
    () => [...globalItems, ...groups.flatMap((group) => group.items)],
    [globalItems, groups],
  );
  const {
    activeItem,
    handleNavClick,
    pathname,
    prefetchRoute,
    resolvedPendingHref,
  } = useAdminShellNavigation(items);
  const activeGroupKey = activeItem?.groupKey ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(
    () => getInitialOpenGroupKeys(groups, activeGroupKey),
  );
  const [manuallyClosedGroups, setManuallyClosedGroups] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const visibleOpenGroups = useMemo(() => {
    if (
      !activeGroupKey ||
      openGroups.has(activeGroupKey) ||
      manuallyClosedGroups.has(activeGroupKey)
    ) {
      return openGroups;
    }

    return new Set([...openGroups, activeGroupKey]);
  }, [activeGroupKey, manuallyClosedGroups, openGroups]);

  const mobileGroups = activeGroupKey
    ? [
        ...groups.filter((group) => group.key === activeGroupKey),
        ...groups.filter((group) => group.key !== activeGroupKey),
      ]
    : groups;

  if (mode === "mobile") {
    if (!activeItem) {
      return null;
    }

    const ActiveIcon = NAV_ICONS[activeItem.icon];
    const activeIsPending = resolvedPendingHref === activeItem.href;
    const activeLabel = activeItem.groupLabel
      ? `${activeItem.groupLabel} / ${activeItem.label}`
      : activeItem.label;

    return (
      <div className="relative">
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={activeLabel}
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
              {activeLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              mobileMenuOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        <nav
          aria-hidden={!mobileMenuOpen}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[62vh] overflow-y-auto rounded-[22px] border border-white/90 bg-[#fbfaf8]/98 p-2 shadow-[0_22px_50px_rgba(35,49,58,0.2)] backdrop-blur transition-[opacity,transform,clip-path] duration-200 ease-out",
            mobileMenuOpen
              ? "pointer-events-auto translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]"
              : "pointer-events-none -translate-y-1 opacity-0 [clip-path:inset(0_0_100%_0)]",
          )}
        >
          <div className="grid gap-2">
            {globalItems.map((item) => (
              <MobileNavLink
                handleNavClick={handleNavClick}
                isFocusable={mobileMenuOpen}
                item={item}
                key={item.href}
                pathname={pathname}
                prefetchRoute={prefetchRoute}
                resolvedPendingHref={resolvedPendingHref}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            ))}
            {mobileGroups.length > 0 ? (
              mobileGroups.map((group) => (
                <div className="grid gap-1.5" key={group.key}>
                  <p className="px-3 pt-2 text-[11px] font-semibold tracking-[0.12em] text-[#82909b] uppercase">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <MobileNavLink
                      handleNavClick={handleNavClick}
                      isFocusable={mobileMenuOpen}
                      item={item}
                      key={item.href}
                      pathname={pathname}
                      prefetchRoute={prefetchRoute}
                      resolvedPendingHref={resolvedPendingHref}
                      setMobileMenuOpen={setMobileMenuOpen}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p className="px-3 py-3 text-sm leading-6 text-[#6d767c]">
                {emptyGroupsLabel}
              </p>
            )}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      {globalItems.map((item) => (
        <DesktopNavLink
          handleNavClick={handleNavClick}
          item={item}
          key={item.href}
          pathname={pathname}
          prefetchRoute={prefetchRoute}
          resolvedPendingHref={resolvedPendingHref}
        />
      ))}

      {groups.length === 0 ? (
        <p className="mx-1 rounded-[18px] border border-[#e2e7eb] bg-white/62 px-4 py-3 text-sm leading-6 text-[#6d767c]">
          {emptyGroupsLabel}
        </p>
      ) : null}

      {groups.map((group) => {
        const isOpen = visibleOpenGroups.has(group.key);
        const isGroupActive = group.items.some((item) => item.href === pathname);

        return (
          <div className="space-y-1" key={group.key}>
            <button
              aria-expanded={isOpen}
              className={cn(
                "mx-1 flex w-[calc(100%-0.5rem)] items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition-all duration-200",
                isGroupActive
                  ? "bg-[#eef3f6] text-[#314b61]"
                  : "text-[#415f76]/76 hover:bg-[#e5e3df] hover:text-[#314b61]",
              )}
              onClick={() => {
                setOpenGroups((current) => {
                  const next = new Set(current);
                  if (isOpen) {
                    next.delete(group.key);
                  } else {
                    next.add(group.key);
                  }
                  return next;
                });
                setManuallyClosedGroups((current) => {
                  const next = new Set(current);
                  if (isOpen) {
                    next.add(group.key);
                  } else {
                    next.delete(group.key);
                  }
                  return next;
                });
              }}
              type="button"
            >
              <span className="min-w-0 truncate">{group.label}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  isOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </button>

            <div
              aria-hidden={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out",
                isOpen
                  ? "grid-rows-[1fr] translate-y-0 opacity-100"
                  : "grid-rows-[0fr] -translate-y-1 opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cn(
                    "space-y-1 pl-3 pt-1 transition-opacity duration-150",
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  {group.items.map((item) => (
                    <DesktopNavLink
                      compact
                      handleNavClick={handleNavClick}
                      isFocusable={isOpen}
                      item={item}
                      key={item.href}
                      pathname={pathname}
                      prefetchRoute={prefetchRoute}
                      resolvedPendingHref={resolvedPendingHref}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function getInitialOpenGroupKeys(
  groups: readonly AdminShellNavGroup[],
  activeGroupKey: string | null,
) {
  const openGroupKeys = new Set(groups.slice(0, 1).map((group) => group.key));

  if (activeGroupKey) {
    openGroupKeys.add(activeGroupKey);
  }

  return openGroupKeys;
}

type NavLinkProps = {
  handleNavClick: ReturnType<typeof useAdminShellNavigation>["handleNavClick"];
  item: AdminShellNavLink;
  pathname: string;
  prefetchRoute: ReturnType<typeof useAdminShellNavigation>["prefetchRoute"];
  resolvedPendingHref: string | null;
};

function DesktopNavLink({
  compact = false,
  handleNavClick,
  isFocusable = true,
  item,
  pathname,
  prefetchRoute,
  resolvedPendingHref,
}: NavLinkProps & { compact?: boolean; isFocusable?: boolean }) {
  const Icon = NAV_ICONS[item.icon];
  const isActive = pathname === item.href;
  const isPending = resolvedPendingHref === item.href && !isActive;

  return (
    <Link
      aria-busy={isPending || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "mx-1 flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition-all duration-200",
        compact ? "py-2.5" : "",
        isActive
          ? "translate-x-1 bg-[#486782] text-white shadow-[0_12px_24px_rgba(72,103,130,0.24)]"
          : isPending
            ? "translate-x-1 bg-[#dbe6ee] text-[#36536a] shadow-[0_10px_20px_rgba(72,103,130,0.1)]"
            : "text-[#415f76]/72 hover:bg-[#e5e3df] hover:text-[#314b61]",
      )}
      href={item.href}
      onClick={(event) => handleNavClick(event, item.href)}
      onFocus={() => prefetchRoute(item.href)}
      onMouseEnter={() => prefetchRoute(item.href)}
      prefetch
      tabIndex={isFocusable ? undefined : -1}
    >
      {isPending ? (
        <LoaderCircle className="size-[18px] shrink-0 animate-spin" />
      ) : (
        <Icon className="size-[18px] shrink-0" />
      )}
      <span className="min-w-0 truncate font-medium">{item.label}</span>
    </Link>
  );
}

function MobileNavLink({
  handleNavClick,
  isFocusable = true,
  item,
  pathname,
  prefetchRoute,
  resolvedPendingHref,
  setMobileMenuOpen,
}: NavLinkProps & {
  isFocusable?: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}) {
  const Icon = NAV_ICONS[item.icon];
  const isActive = pathname === item.href;
  const isPending = resolvedPendingHref === item.href && !isActive;

  return (
    <Link
      aria-busy={isPending || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-[#486782] text-white shadow-[0_10px_20px_rgba(72,103,130,0.18)]"
          : isPending
            ? "bg-[#dbe6ee] text-[#36536a]"
            : "text-[#486782] hover:bg-[#eef3f6]",
      )}
      href={item.href}
      onClick={(event) => {
        handleNavClick(event, item.href);
        setMobileMenuOpen(false);
      }}
      onFocus={() => prefetchRoute(item.href)}
      onMouseEnter={() => prefetchRoute(item.href)}
      prefetch
      tabIndex={isFocusable ? undefined : -1}
    >
      {isPending ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin" />
      ) : (
        <Icon className="size-4 shrink-0" />
      )}
      <span className="min-w-0 truncate font-medium">{item.label}</span>
    </Link>
  );
}
