import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AnnouncementRow } from "./announcements";
import { withRequestTimeout } from "./request-timeout";
import { getSupabaseEnv } from "./supabase";

const PUBLIC_ANNOUNCEMENT_CACHE_SECONDS = 60;

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

export const getCachedLatestPublicAnnouncement = unstable_cache(
  async () => {
    const { supabaseUrl, supabaseKey } = getSupabaseEnv();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    return getLatestPublicAnnouncement(supabase);
  },
  ["latest-public-announcement"],
  { revalidate: PUBLIC_ANNOUNCEMENT_CACHE_SECONDS },
);
