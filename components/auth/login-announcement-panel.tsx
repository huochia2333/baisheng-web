import { LoginAnnouncementCard } from "@/components/auth/login-announcement-card";
import { getLatestPublicAnnouncement } from "@/lib/public-announcements";
import { getServerSupabaseClient } from "@/lib/supabase-server";

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
    const supabase = await getServerSupabaseClient();
    return await getLatestPublicAnnouncement(supabase);
  } catch {
    return null;
  }
}
