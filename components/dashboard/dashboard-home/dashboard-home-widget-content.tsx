"use client";

import type { ReactNode } from "react";

import { Bell, ListTodo, Megaphone } from "lucide-react";

import type { AnnouncementRow } from "@/lib/announcements";
import type {
  DashboardHomeGreetingPeriod,
  DashboardHomePageData,
} from "@/lib/dashboard-home";
import { cn } from "@/lib/utils";

import {
  formatHomeAnnouncementDate,
  getHomeDisplayName,
} from "./dashboard-home-display";
import {
  HomeClockSection,
  type HomeClockCopy,
} from "./dashboard-home-clock-section";
import {
  HomeInviteSection,
  type HomeInviteCopy,
} from "./dashboard-home-invite-section";
import type { HomeWidgetInstance } from "./dashboard-home-layout";
import { HomeTodosSection } from "./dashboard-home-todo-section";
import type { HomeTodoCopy } from "./dashboard-home-todo-display";
import type { DashboardHomeTodosState } from "./use-dashboard-home-todos";

export type DashboardHomeWidgetCopy = {
  announcements: {
    emptyDescription: string;
    emptyTitle: string;
    sectionDescription: string;
    sectionTitle: string;
  };
  greeting: {
    greeting: Record<DashboardHomeGreetingPeriod, string>;
    subtitle: string;
    title: (name: string) => string;
    unnamedUser: string;
  };
  clock: HomeClockCopy;
  invite: HomeInviteCopy;
  widgets: {
    announcementCount: (count: number) => string;
    todoCount: (count: number) => string;
  };
};

type DashboardHomeWidgetContentProps = {
  announcements: AnnouncementRow[];
  businessBoards: DashboardHomePageData["businessBoards"];
  copy: DashboardHomeWidgetCopy;
  displayName: string | null;
  greetingPeriod: DashboardHomeGreetingPeriod;
  locale: string;
  referralCode: string | null;
  role: DashboardHomePageData["role"];
  todoCopy: HomeTodoCopy;
  todoState: DashboardHomeTodosState;
  widget: HomeWidgetInstance;
};

export function DashboardHomeWidgetContent({
  announcements,
  businessBoards,
  copy,
  displayName,
  greetingPeriod,
  locale,
  referralCode,
  role,
  todoCopy,
  todoState,
  widget,
}: DashboardHomeWidgetContentProps) {
  if (widget.type === "greeting") {
    return (
      <GreetingWidgetContent
        copy={copy}
        displayName={displayName}
        greetingPeriod={greetingPeriod}
        widget={widget}
      />
    );
  }

  if (widget.type === "clock") {
    return (
      <HomeClockSection
        copy={copy.clock}
        density={getUtilityWidgetDensity(widget)}
        locale={locale}
      />
    );
  }

  if (widget.type === "invite") {
    return (
      <HomeInviteSection
        businessBoards={businessBoards}
        copy={copy.invite}
        density={getUtilityWidgetDensity(widget)}
        referralCode={referralCode}
        role={role}
      />
    );
  }

  if (widget.type === "announcements") {
    return (
      <AnnouncementsWidgetContent
        announcements={announcements}
        copy={copy}
        locale={locale}
        widget={widget}
      />
    );
  }

  return (
    <TodosWidgetContent
      copy={copy}
      locale={locale}
      todoCopy={todoCopy}
      todoState={todoState}
      widget={widget}
    />
  );
}

function getUtilityWidgetDensity(widget: HomeWidgetInstance) {
  if (widget.width <= 2 && widget.height <= 2) {
    return "mini" as const;
  }

  if (widget.width <= 2 || widget.height <= 2) {
    return "compact" as const;
  }

  return "comfortable" as const;
}

function GreetingWidgetContent({
  copy,
  displayName,
  greetingPeriod,
  widget,
}: Pick<
  DashboardHomeWidgetContentProps,
  "copy" | "displayName" | "greetingPeriod" | "widget"
>) {
  const compact = widget.width <= 2 || widget.height <= 1;
  const name = getHomeDisplayName(displayName, copy.greeting.unnamedUser);

  return (
    <div className="flex h-full min-h-0 flex-col justify-between">
      <div>
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#dff0e4] px-3 py-1 text-xs font-semibold text-[#487155]">
          <Bell className="size-3.5 shrink-0" />
          <span className="truncate">{copy.greeting.greeting[greetingPeriod]}</span>
        </span>
        <h2
          className={cn(
            "mt-4 break-words font-bold tracking-tight text-[#1f2a32]",
            compact ? "text-xl" : "text-3xl sm:text-4xl",
          )}
        >
          {copy.greeting.title(name)}
        </h2>
      </div>
      {!compact ? (
        <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-[#66727d]">
          {copy.greeting.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function AnnouncementsWidgetContent({
  announcements,
  copy,
  locale,
  widget,
}: Pick<
  DashboardHomeWidgetContentProps,
  "announcements" | "copy" | "locale" | "widget"
>) {
  const compact = widget.width <= 2 || widget.height <= 2;

  if (compact) {
    return (
      <CompactSummary
        description={
          announcements[0]?.title ?? copy.announcements.emptyDescription
        }
        icon={<Megaphone className="size-5" />}
        metric={copy.widgets.announcementCount(announcements.length)}
        title={copy.announcements.sectionTitle}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WidgetHeading
        description={copy.announcements.sectionDescription}
        icon={<Megaphone className="size-5 text-[#486782]" />}
        title={copy.announcements.sectionTitle}
      />
      {announcements.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-[#e2e7eb] bg-[#fbfaf8] p-5">
          <h4 className="text-base font-semibold text-[#23313a]">
            {copy.announcements.emptyTitle}
          </h4>
          <p className="mt-2 break-words text-sm leading-7 text-[#69747d]">
            {copy.announcements.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {announcements.map((announcement) => (
            <article
              className="rounded-[22px] border border-[#e2e7eb] bg-[#fbfaf8] p-4"
              key={announcement.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="break-words text-base font-semibold text-[#23313a]">
                  {announcement.title}
                </h4>
                <time className="shrink-0 text-xs font-medium text-[#7b858d]">
                  {formatHomeAnnouncementDate(announcement, locale)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#53616d]">
                {announcement.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TodosWidgetContent({
  copy,
  locale,
  todoCopy,
  todoState,
  widget,
}: Pick<
  DashboardHomeWidgetContentProps,
  "copy" | "locale" | "todoCopy" | "todoState" | "widget"
>) {
  const compact = widget.width <= 2 || widget.height <= 2;

  if (compact) {
    const visibleTodo = todoState.todos.find((todo) => !todo.is_completed);

    return (
      <CompactSummary
        description={visibleTodo?.title ?? todoCopy.empty.active.description}
        icon={<ListTodo className="size-5" />}
        metric={copy.widgets.todoCount(todoState.counts.active)}
        title={todoCopy.title}
      />
    );
  }

  return (
    <HomeTodosSection
      copy={todoCopy}
      density={widget.height <= 3 ? "compact" : "comfortable"}
      frame="plain"
      locale={locale}
      state={todoState}
    />
  );
}

function CompactSummary({
  description,
  icon,
  metric,
  title,
}: {
  description: string;
  icon: ReactNode;
  metric: string;
  title: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-4">
      <div className="flex items-center gap-2 text-[#486782]">
        {icon}
        <span className="min-w-0 truncate text-sm font-semibold text-[#23313a]">
          {title}
        </span>
      </div>
      <div>
        <p className="break-words text-[clamp(1rem,4vw,1.5rem)] font-bold leading-tight text-[#23313a]">
          {metric}
        </p>
        <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[#66727d]">
          {description}
        </p>
      </div>
    </div>
  );
}

function WidgetHeading({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#23313a]">
        {icon}
        <span className="min-w-0 break-words">{title}</span>
      </h3>
      <p className="mt-2 break-words text-sm leading-7 text-[#69747d]">
        {description}
      </p>
    </div>
  );
}
