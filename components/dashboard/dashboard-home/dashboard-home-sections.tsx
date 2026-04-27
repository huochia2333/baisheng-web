"use client";

import { Bell, Megaphone } from "lucide-react";

import type { AnnouncementRow } from "@/lib/announcements";
import type { DashboardHomeGreetingPeriod } from "@/lib/dashboard-home";

import { EmptyState } from "../dashboard-shared-ui";
import {
  formatHomeAnnouncementDate,
  getHomeDisplayName,
} from "./dashboard-home-display";

type HomeGreetingSectionProps = {
  copy: {
    greeting: Record<DashboardHomeGreetingPeriod, string>;
    subtitle: string;
    title: (name: string) => string;
    unnamedUser: string;
  };
  displayName: string | null;
  greetingPeriod: DashboardHomeGreetingPeriod;
};

type HomeAnnouncementsSectionProps = {
  announcements: AnnouncementRow[];
  copy: {
    emptyDescription: string;
    emptyTitle: string;
    sectionDescription: string;
    sectionTitle: string;
  };
  locale: string;
};

export function HomeGreetingSection({
  copy,
  displayName,
  greetingPeriod,
}: HomeGreetingSectionProps) {
  const name = getHomeDisplayName(displayName, copy.unnamedUser);

  return (
    <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#dff0e4] px-3 py-1 text-xs font-semibold text-[#487155]">
            <Bell className="size-3.5" />
            {copy.greeting[greetingPeriod]}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1f2a32] sm:text-4xl">
            {copy.title(name)}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#66727d]">
            {copy.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomeAnnouncementsSection({
  announcements,
  copy,
  locale,
}: HomeAnnouncementsSectionProps) {
  return (
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
            {copy.sectionTitle}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#69747d]">
            {copy.sectionDescription}
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description={copy.emptyDescription}
            icon={<Megaphone className="size-6" />}
            title={copy.emptyTitle}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {announcements.map((announcement) => (
            <article
              className="rounded-[24px] border border-[#e2e7eb] bg-[#fbfaf8] p-5"
              key={announcement.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="text-lg font-semibold text-[#23313a]">
                  {announcement.title}
                </h4>
                <time className="shrink-0 text-xs font-medium text-[#7b858d]">
                  {formatHomeAnnouncementDate(announcement, locale)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#53616d]">
                {announcement.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
