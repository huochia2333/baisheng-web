import {
  isSalesmanBusinessBoard,
  type SalesmanBusinessBoard,
} from "./salesman-business-access";

const BOARD_REFERRAL_CODE_SUFFIX = {
  tourism: "T",
  wholesale: "D",
} as const satisfies Record<SalesmanBusinessBoard, string>;

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

  const boardReferralCode = buildBoardReferralCode(referralCode, board);

  if (!boardReferralCode) {
    return "";
  }

  const params = new URLSearchParams({
    ref: boardReferralCode,
  });

  return `${origin}/register?${params.toString()}`;
}

function buildBoardReferralCode(
  referralCode: string,
  board: SalesmanBusinessBoard,
) {
  const normalizedReferralCode = referralCode.trim().toUpperCase();

  if (!normalizedReferralCode) {
    return "";
  }

  return `${normalizedReferralCode}-${BOARD_REFERRAL_CODE_SUFFIX[board]}`;
}
