import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getPendingTaskReviews,
  type PendingTaskReviewWithAssets,
} from "./task-reviews";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";

export type AdminTaskReviewBoardData = {
  canView: boolean;
  rows: PendingTaskReviewWithAssets[];
};

export function canViewAdminTaskReviews(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return role === "administrator" && (status === null || status === "active");
}

export async function getAdminTaskReviewBoardData(
  supabase: SupabaseClient,
): Promise<AdminTaskReviewBoardData> {
  const { role, status, user } = await getCurrentSessionContext(supabase);

  if (!user || !canViewAdminTaskReviews(role, status)) {
    return {
      canView: false,
      rows: [],
    };
  }

  return {
    canView: true,
    rows: await getPendingTaskReviews(supabase),
  };
}
