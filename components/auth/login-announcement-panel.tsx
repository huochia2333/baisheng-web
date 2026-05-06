import { LoginAnnouncementCard } from "@/components/auth/login-announcement-card";
import { getCachedLatestPublicAnnouncement } from "@/lib/public-announcements";

type LoginAnnouncementPanelProps = {
  copy: {
    title: string;
  };
  locale: string;
};

export async function LoginAnnouncementPanel({
  copy,
  locale,
}: LoginAnnouncementPanelProps) {
  const announcement = await getLoginPublicAnnouncement();

  return (
    <LoginAnnouncementCard
      announcement={announcement}
      copy={copy}
      locale={locale}
    />
  );
}

async function getLoginPublicAnnouncement() {
  try {
    return await getCachedLatestPublicAnnouncement();
  } catch {
    return null;
  }
}
