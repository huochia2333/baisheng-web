"use client";

import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import type { DashboardHomePageData } from "@/lib/dashboard-home";

import {
  HomeAnnouncementsSection,
  HomeGreetingSection,
} from "./dashboard-home-sections";

type DashboardHomeClientProps = {
  initialData: DashboardHomePageData;
};

export function DashboardHomeClient({ initialData }: DashboardHomeClientProps) {
  const t = useTranslations("DashboardHome");
  const { locale } = useLocale();
  const greetingCopy = {
    greeting: {
      afternoon: t("greeting.afternoon"),
      evening: t("greeting.evening"),
      morning: t("greeting.morning"),
      noon: t("greeting.noon"),
    },
    subtitle: t("subtitle"),
    title: (name: string) => t("title", { name }),
    unnamedUser: t("unnamedUser"),
  };
  const announcementsCopy = {
    emptyDescription: t("announcements.emptyDescription"),
    emptyTitle: t("announcements.emptyTitle"),
    sectionDescription: t("announcements.description"),
    sectionTitle: t("announcements.title"),
  };

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      <HomeGreetingSection
        copy={greetingCopy}
        displayName={initialData.displayName}
        greetingPeriod={initialData.greetingPeriod}
      />
      <HomeAnnouncementsSection
        announcements={initialData.announcements}
        copy={announcementsCopy}
        locale={locale}
      />
    </section>
  );
}
