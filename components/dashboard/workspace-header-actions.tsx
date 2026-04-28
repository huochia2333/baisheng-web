"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { Bell, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { AnnouncementRow } from "@/lib/announcements";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  getWorkspaceAnnouncementsState,
  markWorkspaceAnnouncementsRead,
  type WorkspaceAnnouncementsState,
} from "@/lib/workspace-announcements";

import { DashboardDialog } from "./dashboard-dialog";
import { PageBanner } from "./dashboard-shared-ui";

type WorkspaceHeaderActionsProps = {
  accountLabel: string;
  initials: string;
  myHref: string;
};

type DialogMode = "auto" | "manual";

const EMPTY_ANNOUNCEMENTS_STATE: WorkspaceAnnouncementsState = {
  announcements: [],
  unreadAnnouncements: [],
};

export function WorkspaceHeaderActions({
  accountLabel,
  initials,
  myHref,
}: WorkspaceHeaderActionsProps) {
  const t = useTranslations("DashboardShell");
  const { locale } = useLocale();
  const supabase = getBrowserSupabaseClient();
  const autoOpenedRef = useRef(false);

  const [announcementsState, setAnnouncementsState] =
    useState<WorkspaceAnnouncementsState>(EMPTY_ANNOUNCEMENTS_STATE);
  const [dialogMode, setDialogMode] = useState<DialogMode>("manual");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const unreadCount = announcementsState.unreadAnnouncements.length;

  const refreshAnnouncements = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextState = await getWorkspaceAnnouncementsState(supabase);

      setAnnouncementsState(nextState);

      if (!autoOpenedRef.current && nextState.unreadAnnouncements.length > 0) {
        autoOpenedRef.current = true;
        setDialogMode("auto");
        setDialogOpen(true);
      }
    } catch {
      setErrorMessage(t("announcements.loadError"));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    void refreshAnnouncements();
  }, [refreshAnnouncements]);

  const displayedAnnouncements = useMemo(() => {
    if (
      dialogMode === "auto" &&
      announcementsState.unreadAnnouncements.length > 0
    ) {
      return announcementsState.unreadAnnouncements;
    }

    return announcementsState.announcements;
  }, [
    announcementsState.announcements,
    announcementsState.unreadAnnouncements,
    dialogMode,
  ]);

  const markUnreadAsRead = useCallback(async () => {
    if (!supabase || announcementsState.unreadAnnouncements.length === 0) {
      return;
    }

    setMarkingRead(true);

    try {
      await markWorkspaceAnnouncementsRead(
        supabase,
        announcementsState.unreadAnnouncements,
      );
      setAnnouncementsState((current) => ({
        ...current,
        unreadAnnouncements: [],
      }));
      setErrorMessage(null);
    } catch {
      setErrorMessage(t("announcements.readError"));
    } finally {
      setMarkingRead(false);
    }
  }, [announcementsState.unreadAnnouncements, supabase, t]);

  const closeDialog = useCallback(
    (open: boolean) => {
      if (open) {
        setDialogOpen(true);
        return;
      }

      setDialogOpen(false);

      if (announcementsState.unreadAnnouncements.length > 0) {
        void markUnreadAsRead();
      }
    },
    [announcementsState.unreadAnnouncements.length, markUnreadAsRead],
  );

  const openRecentAnnouncements = () => {
    setDialogMode("manual");
    setDialogOpen(true);

    if (!loading) {
      void refreshAnnouncements();
    }
  };

  const acknowledgeAnnouncements = async () => {
    await markUnreadAsRead();
    setDialogOpen(false);
  };

  return (
    <>
      <button
        aria-label={t("announcements.open")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#486782] transition-colors hover:bg-white sm:h-10 sm:w-10"
        disabled={loading}
        onClick={openRecentAnnouncements}
        type="button"
      >
        {loading ? (
          <LoaderCircle className="size-[18px] animate-spin" />
        ) : (
          <Bell className="size-[18px]" />
        )}
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#c43d3d] px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <Link
        className="inline-flex items-center gap-3 rounded-full bg-[#f1efeb] p-1.5 transition-colors hover:bg-[#e8e5e0] sm:pr-4"
        href={myHref}
        prefetch
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5b7890] text-xs font-semibold text-white">
          {initials}
        </div>
        <span className="hidden text-sm font-medium text-[#486782] sm:inline">
          {accountLabel}
        </span>
      </Link>

      <DashboardDialog
        actions={
          unreadCount > 0 ? (
            <Button
              className="h-10 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={markingRead}
              onClick={() => void acknowledgeAnnouncements()}
            >
              {markingRead ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {t("announcements.acknowledge")}
            </Button>
          ) : undefined
        }
        description={
          dialogMode === "auto"
            ? t("announcements.newDescription")
            : t("announcements.recentDescription")
        }
        onOpenChange={closeDialog}
        open={dialogOpen}
        title={
          dialogMode === "auto"
            ? t("announcements.newTitle")
            : t("announcements.recentTitle")
        }
      >
        <div className="space-y-4">
          {errorMessage ? (
            <PageBanner tone="error">{errorMessage}</PageBanner>
          ) : null}

          {displayedAnnouncements.length === 0 ? (
            <div className="rounded-[24px] border border-[#e7e3dc] bg-white p-6 text-sm leading-7 text-[#66727d]">
              {t("announcements.empty")}
            </div>
          ) : (
            displayedAnnouncements.map((announcement) => (
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
