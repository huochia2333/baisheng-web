import {
  isSalesmanBusinessBoard,
  type SalesmanBusinessBoard,
} from "./salesman-business-access";

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

  const normalizedReferralCode = normalizeReferralCode(referralCode);

  if (!normalizedReferralCode) {
    return "";
  }

  const params = new URLSearchParams({
    ref: normalizedReferralCode,
  });

  return `${origin}/register?${params.toString()}`;
}

function normalizeReferralCode(referralCode: string) {
  return referralCode.trim().toUpperCase();
}
