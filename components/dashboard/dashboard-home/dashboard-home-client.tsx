"use client";

import { useMemo } from "react";

import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import type { DashboardHomePageData } from "@/lib/dashboard-home";

import { DashboardHomeCustomizer } from "./dashboard-home-customizer";
import { createHomeTodoCopy } from "./dashboard-home-todo-display";

type DashboardHomeClientProps = {
  initialData: DashboardHomePageData;
};

export function DashboardHomeClient({ initialData }: DashboardHomeClientProps) {
  const t = useTranslations("DashboardHome");
  const { locale } = useLocale();
  const greetingCopy = useMemo(
    () => ({
      greeting: {
        afternoon: t("greeting.afternoon"),
        evening: t("greeting.evening"),
        morning: t("greeting.morning"),
        noon: t("greeting.noon"),
      },
      subtitle: t("subtitle"),
      title: (name: string) => t("title", { name }),
      unnamedUser: t("unnamedUser"),
    }),
    [t],
  );
  const announcementsCopy = useMemo(
    () => ({
      emptyDescription: t("announcements.emptyDescription"),
      emptyTitle: t("announcements.emptyTitle"),
      sectionDescription: t("announcements.description"),
      sectionTitle: t("announcements.title"),
    }),
    [t],
  );
  const clockCopy = useMemo(
    () => ({
      compactDescription: t("clock.compactDescription"),
      description: t("clock.description"),
      miniTitle: t("clock.miniTitle"),
      timezoneLabel: t("clock.timezoneLabel"),
      title: t("clock.title"),
    }),
    [t],
  );
  const inviteCopy = useMemo(
    () => ({
      businessBoards: {
        dropshipping: t("invite.businessBoards.dropshipping"),
        tourism: t("invite.businessBoards.tourism"),
      },
      codeLabel: t("invite.codeLabel"),
      copiedBoardLink: (board: string) =>
        t("invite.copiedBoardLink", { board }),
      copiedCode: t("invite.copiedCode"),
      copiedLink: t("invite.copiedLink"),
      compactDescription: t("invite.compactDescription"),
      copyBoardLink: (board: string) => t("invite.copyBoardLink", { board }),
      copyCode: t("invite.copyCode"),
      copyFailed: t("invite.copyFailed"),
      copyLink: t("invite.copyLink"),
      description: t("invite.description"),
      noCodeDescription: t("invite.noCodeDescription"),
      noCodeTitle: t("invite.noCodeTitle"),
      noLinkAccess: t("invite.noLinkAccess"),
      title: t("invite.title"),
    }),
    [t],
  );
  const widgetCopy = useMemo(
    () => ({
      announcements: announcementsCopy,
      clock: clockCopy,
      greeting: greetingCopy,
      invite: inviteCopy,
      widgets: {
        announcementCount: (count: number) =>
          t("customizer.summary.announcementCount", { count }),
        todoCount: (count: number) =>
          t("customizer.summary.todoCount", { count }),
      },
    }),
    [announcementsCopy, clockCopy, greetingCopy, inviteCopy, t],
  );
  const customizerCopy = useMemo(
    () => ({
      addWidget: t("customizer.addWidget"),
      done: t("customizer.done"),
      edit: t("customizer.edit"),
      emptyDescription: t("customizer.emptyDescription"),
      emptyTitle: t("customizer.emptyTitle"),
      moveLeft: t("customizer.moveLeft"),
      moveRight: t("customizer.moveRight"),
      removeWidget: t("customizer.removeWidget"),
      reset: t("customizer.reset"),
      resizeWidget: t("customizer.resizeWidget"),
      sidebarDescription: t("customizer.sidebarDescription"),
      sidebarTitle: t("customizer.sidebarTitle"),
      sizeLabel: (width: number, height: number) =>
        t("customizer.sizeLabel", { height, width }),
      widgets: {
        announcements: {
          description: t("customizer.widgets.announcements.description"),
          title: t("customizer.widgets.announcements.title"),
        },
        clock: {
          description: t("customizer.widgets.clock.description"),
          title: t("customizer.widgets.clock.title"),
        },
        invite: {
          description: t("customizer.widgets.invite.description"),
          title: t("customizer.widgets.invite.title"),
        },
        greeting: {
          description: t("customizer.widgets.greeting.description"),
          title: t("customizer.widgets.greeting.title"),
        },
        todos: {
          description: t("customizer.widgets.todos.description"),
          title: t("customizer.widgets.todos.title"),
        },
      },
    }),
    [t],
  );
  const todoCopy = useMemo(() => createHomeTodoCopy(t), [t]);

  return (
    <DashboardHomeCustomizer
      copy={widgetCopy}
      customizerCopy={customizerCopy}
      initialData={initialData}
      locale={locale}
      todoCopy={todoCopy}
    />
  );
}
