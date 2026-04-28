import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnnouncementRow } from "./announcements";
import { withRequestTimeout } from "./request-timeout";

export async function getLatestPublicAnnouncement(supabase: SupabaseClient) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_latest_public_announcement"),
  );

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? (data as AnnouncementRow[]) : [];

  return rows[0] ?? null;
}
