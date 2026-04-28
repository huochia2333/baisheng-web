"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  IdCard,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { AnnouncementRow } from "@/lib/announcements";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { WorkspaceAnnouncementsState } from "@/lib/workspace-announcements";

import { DashboardDialog } from "./dashboard-dialog";
import { PageBanner } from "./dashboard-shared-ui";
import { useWorkspaceHeaderAnnouncements } from "./use-workspace-header-announcements";

type WorkspaceHeaderActionsProps = {
  accountLabel: string;
  initialAnnouncementsState: WorkspaceAnnouncementsState;
  initials: string;
  myHref: string;
};

export function WorkspaceHeaderActions({
  accountLabel,
  initialAnnouncementsState,
  initials,
  myHref,
}: WorkspaceHeaderActionsProps) {
  const t = useTranslations("DashboardShell");
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [menuErrorMessage, setMenuErrorMessage] = useState<string | null>(null);
  const announcementsCopy = useMemo(
    () => ({
      loadError: t("announcements.loadError"),
      readError: t("announcements.readError"),
    }),
    [t],
  );
  const announcements = useWorkspaceHeaderAnnouncements({
    copy: announcementsCopy,
    initialState: initialAnnouncementsState,
  });

  const accountMenuItems = useMemo(
    () => [
      {
        href: `${myHref}#personal-center`,
        icon: LayoutDashboard,
        label: t("accountMenu.personalCenter"),
      },
      {
        href: `${myHref}#account-center`,
        icon: Settings,
        label: t("accountMenu.accountCenter"),
      },
      {
        href: `${myHref}#profile-info`,
        icon: IdCard,
        label: t("accountMenu.profileInfo"),
      },
      {
        href: `${myHref}#account-verification`,
        icon: ShieldCheck,
        label: t("accountMenu.accountVerification"),
      },
    ],
    [myHref, t],
  );

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    if (logoutPending) {
      return;
    }

    setMenuErrorMessage(null);

    if (!supabase) {
      setMenuErrorMessage(t("serviceUnavailable"));
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
    } catch {
      setMenuErrorMessage(t("serviceUnavailable"));
    } finally {
      setLogoutPending(false);
    }
  };

  return (
    <>
      <button
        aria-label={t("announcements.open")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white sm:h-10 sm:w-10"
        disabled={announcements.loading}
        onClick={announcements.openRecentAnnouncements}
        type="button"
      >
        {announcements.loading ? (
          <LoaderCircle className="size-[18px] animate-spin" />
        ) : (
          <Bell className="size-[18px]" />
        )}
        {announcements.unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#c43d3d] px-1 text-[10px] font-semibold leading-none text-white">
            {announcements.unreadCount > 9 ? "9+" : announcements.unreadCount}
          </span>
        ) : null}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={accountMenuOpen}
          aria-label={t("accountMenu.open")}
          className="inline-flex items-center gap-3 rounded-full bg-[#f1efeb] p-1.5 transition-colors hover:bg-[#e8e5e0] sm:pr-3"
          onClick={() => {
            setAccountMenuOpen((current) => !current);
            setMenuErrorMessage(null);
          }}
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5b7890] text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-[#486782] sm:inline">
            {accountLabel}
          </span>
          <ChevronDown className="hidden size-4 text-[#6b7b87] sm:block" />
        </button>

        {accountMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[240px] overflow-hidden rounded-[22px] border border-[#e5e1da] bg-white shadow-[0_24px_52px_rgba(72,86,98,0.18)]">
            <div className="border-b border-[#eee9e1] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[#2d3a44]">
                {accountLabel}
              </p>
            </div>

            <div className="p-2">
              {accountMenuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className="flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-medium text-[#405a70] transition-colors hover:bg-[#f3f5f6]"
                    href={item.href}
                    key={item.href}
                    onClick={() => setAccountMenuOpen(false)}
                    prefetch
                  >
                    <Icon className="size-4 text-[#6e7f8d]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {menuErrorMessage ? (
              <p className="mx-3 mb-2 rounded-[14px] border border-[#f1d1d1] bg-[#fff2f2] px-3 py-2 text-xs leading-5 text-[#9f3535]">
                {menuErrorMessage}
              </p>
            ) : null}

            <div className="border-t border-[#eee9e1] p-2">
              <button
                className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-sm font-semibold text-[#b13d3d] transition-colors hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-70"
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
          </div>
        ) : null}
      </div>

      <DashboardDialog
        actions={
          announcements.unreadCount > 0 ? (
            <Button
              className="h-10 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={announcements.markingRead}
              onClick={() => void announcements.acknowledgeAnnouncements()}
            >
              {announcements.markingRead ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {t("announcements.acknowledge")}
            </Button>
          ) : undefined
        }
        description={
          announcements.dialogMode === "auto"
            ? t("announcements.newDescription")
            : t("announcements.recentDescription")
        }
        onOpenChange={announcements.closeDialog}
        open={announcements.dialogOpen}
        title={
          announcements.dialogMode === "auto"
            ? t("announcements.newTitle")
            : t("announcements.recentTitle")
        }
      >
        <div className="space-y-4">
          {announcements.errorMessage ? (
            <PageBanner tone="error">{announcements.errorMessage}</PageBanner>
          ) : null}

          {announcements.displayedAnnouncements.length === 0 ? (
            <div className="rounded-[24px] border border-[#e7e3dc] bg-white p-6 text-sm leading-7 text-[#66727d]">
              {t("announcements.empty")}
            </div>
          ) : (
            announcements.displayedAnnouncements.map((announcement) => (
              <WorkspaceAnnouncementCard
                announcement={announcement}
                key={announcement.id}
                locale={locale}
              />
            ))
          )}
        </div>
      </DashboardDialog>
    </>
  );
}

function WorkspaceAnnouncementCard({
  announcement,
  locale,
}: {
  announcement: AnnouncementRow;
  locale: string;
}) {
  const publishedAt = announcement.published_at ?? announcement.created_at;

  return (
    <article className="rounded-[24px] border border-[#e2e7eb] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4 className="text-lg font-semibold text-[#23313a]">
          {announcement.title}
        </h4>
        <time className="shrink-0 text-xs font-medium text-[#7b858d]">
          {formatWorkspaceAnnouncementDate(publishedAt, locale)}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#53616d]">
        {announcement.content}
      </p>
    </article>
  );
}

function formatWorkspaceAnnouncementDate(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}
