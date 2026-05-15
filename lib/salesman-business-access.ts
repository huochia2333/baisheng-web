import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";

export const SALESMAN_BUSINESS_BOARD_OPTIONS = [
  "tourism",
  "dropshipping",
] as const;

export type SalesmanBusinessBoard =
  (typeof SALESMAN_BUSINESS_BOARD_OPTIONS)[number];

export const SALESMAN_BUSINESS_ORDER_CATEGORIES = {
  dropshipping: ["dropshipping"],
  tourism: ["purchase", "service"],
} as const satisfies Record<SalesmanBusinessBoard, readonly string[]>;

export type SalesmanBusinessBoardLabels = Record<SalesmanBusinessBoard, string>;

export function isSalesmanBusinessBoard(
  value: unknown,
): value is SalesmanBusinessBoard {
  return value === "tourism" || value === "dropshipping";
}

export function normalizeSalesmanBusinessBoards(
  value: unknown,
): SalesmanBusinessBoard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueSalesmanBusinessBoards(value.filter(isSalesmanBusinessBoard));
}

export function uniqueSalesmanBusinessBoards(
  boards: readonly SalesmanBusinessBoard[],
): SalesmanBusinessBoard[] {
  return SALESMAN_BUSINESS_BOARD_OPTIONS.filter((board) => boards.includes(board));
}

export function areSalesmanBusinessBoardsEqual(
  left: readonly SalesmanBusinessBoard[],
  right: readonly SalesmanBusinessBoard[],
) {
  const normalizedLeft = uniqueSalesmanBusinessBoards(left);
  const normalizedRight = uniqueSalesmanBusinessBoards(right);

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((board, index) => board === normalizedRight[index])
  );
}

export function getOrderCategoriesForSalesmanBusinessBoards(
  boards: readonly SalesmanBusinessBoard[],
) {
  return uniqueSalesmanBusinessBoards(boards).flatMap(
    (board) => SALESMAN_BUSINESS_ORDER_CATEGORIES[board],
  );
}

export function salesmanBusinessBoardsInclude(
  boards: readonly SalesmanBusinessBoard[],
  board: SalesmanBusinessBoard,
) {
  return boards.includes(board);
}

export async function getCurrentSalesmanBusinessBoards(
  supabase: SupabaseClient,
): Promise<SalesmanBusinessBoard[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_current_salesman_business_boards"),
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
