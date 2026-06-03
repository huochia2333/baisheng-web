import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type UserStatus,
} from "./user-self-service";

export type DashboardHomeWidgetLayoutItem = {
  height: number;
  id: string;
  type: string;
  width: number;
  x: number;
  y: number;
};

export type UserHomeWidgetLayoutRow = {
  created_at: string;
  scope: string;
  updated_at: string;
  user_id: string;
  widgets: DashboardHomeWidgetLayoutItem[];
};

type UserHomeWidgetLayoutContext = {
  scope: string;
  status: UserStatus | null;
  userId: string;
};

const USER_HOME_WIDGET_LAYOUT_SELECT =
  "user_id,scope,widgets,created_at,updated_at";
const USER_HOME_WIDGET_LAYOUT_TIMEOUT_MS = 20_000;

export async function getUserHomeWidgetLayout(
  supabase: SupabaseClient,
  context: UserHomeWidgetLayoutContext,
) {
  if (context.status !== "active") {
    return null;
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("user_home_widget_layouts")
      .select(USER_HOME_WIDGET_LAYOUT_SELECT)
      .eq("user_id", context.userId)
      .eq("scope", context.scope)
      .maybeSingle<UserHomeWidgetLayoutRow>(),
  );

  if (error) {
    throw error;
  }

  return normalizeUserHomeWidgetLayoutRow(data);
}

export async function getCurrentUserHomeWidgetLayout(
  supabase: SupabaseClient,
  scope: string,
) {
  const { status, user } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return getUserHomeWidgetLayout(supabase, {
    scope,
    status,
    userId: user.id,
  });
}

export async function saveUserHomeWidgetLayout(
  supabase: SupabaseClient,
  scope: string,
  widgets: readonly DashboardHomeWidgetLayoutItem[],
) {
  const { data, error } = await withRequestTimeout(
    supabase
      .rpc("save_user_home_widget_layout", {
        _scope: scope,
        _widgets: widgets,
      })
      .maybeSingle<UserHomeWidgetLayoutRow>(),
    { timeoutMs: USER_HOME_WIDGET_LAYOUT_TIMEOUT_MS },
  );

  if (error) {
    throw error;
  }

  const layout = normalizeUserHomeWidgetLayoutRow(data);

  if (!layout) {
    throw new Error("home_layout_save_failed");
  }

  return layout;
}

function normalizeUserHomeWidgetLayoutRow(
  value: UserHomeWidgetLayoutRow | null,
): UserHomeWidgetLayoutRow | null {
  if (!value?.user_id || !value.scope) {
    return null;
  }

  return {
    created_at: value.created_at,
    scope: value.scope,
    updated_at: value.updated_at,
    user_id: value.user_id,
    widgets: Array.isArray(value.widgets) ? value.widgets : [],
  };
}
