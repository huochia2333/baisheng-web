import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getVisibleAnnouncements,
  type AnnouncementRow,
} from "./announcements";
import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";

export type DashboardHomeGreetingPeriod =
  | "morning"
  | "noon"
  | "afternoon"
  | "evening";

export type DashboardHomePageData = {
  announcements: AnnouncementRow[];
  displayName: string | null;
  greetingPeriod: DashboardHomeGreetingPeriod;
  role: AppRole | null;
  status: UserStatus | null;
};

type HomeProfileRow = {
  email: string | null;
  name: string | null;
  phone: string | null;
};

export async function getDashboardHomePageData(
  supabase: SupabaseClient,
): Promise<DashboardHomePageData | null> {
  const { user, role, status } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  const [profile, announcements] = await Promise.all([
    getHomeProfile(supabase, user.id),
    getVisibleAnnouncements(supabase),
  ]);

  return {
    announcements,
    displayName:
      profile?.name?.trim() ||
      profile?.email?.trim() ||
      profile?.phone?.trim() ||
      user.email ||
      user.phone ||
      null,
    greetingPeriod: getShanghaiGreetingPeriod(),
    role,
    status,
  };
}

export function getShanghaiGreetingPeriod(
  date: Date = new Date(),
): DashboardHomeGreetingPeriod {
  const hourText = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
  const hour = Number(hourText) % 24;

  if (hour >= 5 && hour < 11) {
    return "morning";
  }

  if (hour >= 11 && hour < 14) {
    return "noon";
  }

  if (hour >= 14 && hour < 18) {
    return "afternoon";
  }

  return "evening";
}

async function getHomeProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_profiles")
      .select("name,email,phone")
      .eq("user_id", userId)
      .maybeSingle<HomeProfileRow>(),
  );

  if (error) {
    throw error;
  }

  return data;
}
