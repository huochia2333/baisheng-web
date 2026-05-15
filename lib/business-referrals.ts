import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  isSalesmanBusinessBoard,
  normalizeSalesmanBusinessBoards,
  type SalesmanBusinessBoard,
} from "./salesman-business-access";

export type BusinessReferralBindStatus =
  | "linked"
  | "already_bound"
  | "required"
  | "not_found"
  | "max_uses"
  | "expired"
  | "business_board_required"
  | "business_board_invalid"
  | "business_board_forbidden"
  | "self_referral"
  | "forbidden"
  | "unavailable";

export async function getCurrentUserBusinessReferralBoards(
  supabase: SupabaseClient,
): Promise<SalesmanBusinessBoard[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_current_user_business_referral_boards"),
  );

  if (error || !Array.isArray(data)) {
    return [];
  }

  return normalizeSalesmanBusinessBoards(
    data.map((item) =>
      typeof item === "object" && item !== null && "business_board" in item
        ? item.business_board
        : null,
    ),
  );
}

export async function bindCurrentUserBusinessReferral({
  businessBoard,
  referralCode,
  supabase,
}: {
  businessBoard: SalesmanBusinessBoard;
  referralCode: string;
  supabase: SupabaseClient;
}): Promise<BusinessReferralBindStatus> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("bind_current_user_business_referral", {
      _business_board: businessBoard,
      _signup_referral_code: referralCode,
    }),
  );

  if (error) {
    return "unavailable";
  }

  return normalizeBusinessReferralBindStatus(data);
}

function normalizeBusinessReferralBindStatus(
  value: unknown,
): BusinessReferralBindStatus {
  switch (value) {
    case "linked":
    case "already_bound":
    case "required":
    case "not_found":
    case "max_uses":
    case "expired":
    case "business_board_required":
    case "business_board_invalid":
    case "business_board_forbidden":
    case "self_referral":
    case "forbidden":
      return value;
    default:
      return "unavailable";
  }
}

export function buildBoardInviteLink({
  board,
  origin,
  referralCode,
}: {
  board: SalesmanBusinessBoard;
  origin: string;
  referralCode: string;
}) {
  if (!isSalesmanBusinessBoard(board)) {
    return "";
  }

  const params = new URLSearchParams({
    board,
    ref: referralCode,
  });

  return `${origin}/register?${params.toString()}`;
}
