import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  normalizeAppRole,
  normalizeUserStatus,
} from "./auth-metadata";
import { withRequestTimeout } from "./request-timeout";
import {
  isSalesmanBusinessBoard,
  type SalesmanBusinessBoard,
} from "./salesman-business-access";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import { normalizeOptionalString } from "./value-normalizers";

export const DEFAULT_REFERRALS_BUSINESS_BOARD = "tourism";

export type ReferralBusinessBoard = SalesmanBusinessBoard;

export type ReferralTreeScope =
  | "global"
  | "self_upstream"
  | "self_downstream"
  | "team_salesman_upstream"
  | "team_salesman_downstream"
  | "scoped";

export type ReferralTreeEdge = {
  referrer_user_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  referrer_status: UserStatus | null;
  referrer_role: AppRole | null;
  referrer_is_team_salesman: boolean;
  new_user_id: string;
  new_user_name: string | null;
  new_user_email: string | null;
  new_user_status: UserStatus | null;
  new_user_role: AppRole | null;
  new_user_is_team_salesman: boolean;
  created_at: string;
  relation_scope: ReferralTreeScope;
};

export type ReferralTreeViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type ReferralsPageData = {
  businessBoard: ReferralBusinessBoard;
  canViewReferrals: boolean;
  currentViewerId: string | null;
  currentViewerRole: AppRole | null;
  edges: ReferralTreeEdge[];
};

type ReferralsPageOptions = {
  businessBoard?: ReferralBusinessBoard;
};

export async function getCurrentReferralTreeViewerContext(
  supabase: SupabaseClient,
): Promise<ReferralTreeViewerContext | null> {
  const { user, role, status } = await getCurrentSessionContext(supabase);

  if (!user) {
    return null;
  }

  return {
    user,
    role,
    status,
  };
}

export function canReadReferralTreeByRole(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return status === "active" && role !== null;
}

export async function getReferralsPageData(
  supabase: SupabaseClient,
  options: ReferralsPageOptions = {},
): Promise<ReferralsPageData> {
  const businessBoard = options.businessBoard ?? DEFAULT_REFERRALS_BUSINESS_BOARD;
  const viewer = await getCurrentReferralTreeViewerContext(supabase);

  if (!viewer) {
    return {
      businessBoard,
      canViewReferrals: false,
      currentViewerId: null,
      currentViewerRole: null,
      edges: [],
    };
  }

  const canViewReferrals = canReadReferralTreeByRole(viewer.role, viewer.status);

  return {
    businessBoard,
    canViewReferrals,
    currentViewerId: viewer.user.id,
    currentViewerRole: viewer.role,
    edges: canViewReferrals
      ? await getReferralTreeEdges(supabase, businessBoard)
      : [],
  };
}

export async function getReferralTreeEdges(
  supabase: SupabaseClient,
  businessBoard: ReferralBusinessBoard = DEFAULT_REFERRALS_BUSINESS_BOARD,
): Promise<ReferralTreeEdge[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_referral_tree_edges", {
      _business_board: businessBoard,
    }),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeReferralTreeEdge(item))
    .filter((item): item is ReferralTreeEdge => item !== null);
}

export function parseReferralBusinessBoardSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ReferralBusinessBoard {
  const rawValue = searchParams.board;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  return isSalesmanBusinessBoard(value)
    ? value
    : DEFAULT_REFERRALS_BUSINESS_BOARD;
}

function normalizeReferralTreeEdge(value: unknown): ReferralTreeEdge | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const referrerUserId =
    "referrer_user_id" in value ? normalizeOptionalString(value.referrer_user_id) : null;
  const newUserId = "new_user_id" in value ? normalizeOptionalString(value.new_user_id) : null;
  const createdAt = "created_at" in value ? normalizeOptionalString(value.created_at) : null;

  if (!referrerUserId || !newUserId || !createdAt) {
    return null;
  }

  const relationScope =
    "relation_scope" in value ? normalizeReferralScope(value.relation_scope) : "scoped";

  return {
    referrer_user_id: referrerUserId,
    referrer_name:
      "referrer_name" in value ? normalizeOptionalString(value.referrer_name) : null,
    referrer_email:
      "referrer_email" in value ? normalizeOptionalString(value.referrer_email) : null,
    referrer_status:
      "referrer_status" in value ? normalizeUserStatus(value.referrer_status) : null,
    referrer_role: "referrer_role" in value ? normalizeAppRole(value.referrer_role) : null,
    referrer_is_team_salesman:
      "referrer_is_team_salesman" in value && value.referrer_is_team_salesman === true,
    new_user_id: newUserId,
    new_user_name: "new_user_name" in value ? normalizeOptionalString(value.new_user_name) : null,
    new_user_email:
      "new_user_email" in value ? normalizeOptionalString(value.new_user_email) : null,
    new_user_status:
      "new_user_status" in value ? normalizeUserStatus(value.new_user_status) : null,
    new_user_role: "new_user_role" in value ? normalizeAppRole(value.new_user_role) : null,
    new_user_is_team_salesman:
      "new_user_is_team_salesman" in value && value.new_user_is_team_salesman === true,
    created_at: createdAt,
    relation_scope: relationScope,
  };
}

function normalizeReferralScope(value: unknown): ReferralTreeScope {
  if (
    value === "global" ||
    value === "self_upstream" ||
    value === "self_downstream" ||
    value === "team_salesman_upstream" ||
    value === "team_salesman_downstream" ||
    value === "scoped"
  ) {
    return value;
  }

  return "scoped";
}
