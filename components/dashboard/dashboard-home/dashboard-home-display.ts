import type { AnnouncementRow } from "@/lib/announcements";

export function formatHomeAnnouncementDate(row: AnnouncementRow, locale: string) {
  const value = row.published_at ?? row.created_at;

  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function getHomeDisplayName(name: string | null, fallback: string) {
  return name?.trim() || fallback;
}
