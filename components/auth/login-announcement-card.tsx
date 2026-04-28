import { Megaphone } from "lucide-react";

import type { AnnouncementRow } from "@/lib/announcements";

type LoginAnnouncementCardProps = {
  announcement: AnnouncementRow | null;
  copy: {
    title: string;
  };
  locale: string;
};

export function LoginAnnouncementCard({
  announcement,
  copy,
  locale,
}: LoginAnnouncementCardProps) {
  if (!announcement) {
    return null;
  }

  const publishedAt = announcement.published_at ?? announcement.created_at;

  return (
    <article className="mt-6 rounded-[26px] border border-[#e4e8eb] bg-white/78 p-5 text-sm text-[#53616d] shadow-[0_12px_32px_rgba(115,127,139,0.07)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3f6] text-[#486782]">
          <Megaphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-semibold text-[#33424d]">{copy.title}</p>
            <time className="shrink-0 text-xs font-medium text-[#7b858d]">
              {formatLoginAnnouncementDate(publishedAt, locale)}
            </time>
          </div>
          <h3 className="mt-3 text-base font-semibold text-[#23313a]">
            {announcement.title}
          </h3>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap leading-7">
            {announcement.content}
          </p>
        </div>
      </div>
    </article>
  );
}

function formatLoginAnnouncementDate(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}
