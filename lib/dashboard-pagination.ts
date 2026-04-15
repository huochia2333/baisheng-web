export const DEFAULT_DASHBOARD_PAGE_SIZE = 20;
export const MAX_DASHBOARD_QUERY_ROWS = 200;

export type DashboardPaginationSlice<T> = {
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: T[];
  page: number;
  pageCount: number;
  pageSize: number;
  startIndex: number;
  totalItems: number;
};

export function getDashboardQueryRange(limit = MAX_DASHBOARD_QUERY_ROWS) {
  const safeLimit = Math.max(1, Math.trunc(limit));

  return {
    from: 0,
    to: safeLimit - 1,
  };
}

export function paginateDashboardItems<T>(
  items: T[],
  page: number,
  pageSize = DEFAULT_DASHBOARD_PAGE_SIZE,
): DashboardPaginationSlice<T> {
  const totalItems = items.length;
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const pageCount = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Math.trunc(page)), pageCount);

  if (totalItems === 0) {
    return {
      endIndex: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      items: [],
      page: 1,
      pageCount: 1,
      pageSize: safePageSize,
      startIndex: 0,
      totalItems: 0,
    };
  }

  const startOffset = (safePage - 1) * safePageSize;
  const endOffset = startOffset + safePageSize;

  return {
    endIndex: Math.min(totalItems, endOffset),
    hasNextPage: safePage < pageCount,
    hasPreviousPage: safePage > 1,
    items: items.slice(startOffset, endOffset),
    page: safePage,
    pageCount,
    pageSize: safePageSize,
    startIndex: startOffset + 1,
    totalItems,
  };
}
