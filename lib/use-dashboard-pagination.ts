"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_DASHBOARD_PAGE_SIZE,
  paginateDashboardItems,
} from "./dashboard-pagination";

export function useDashboardPagination<T>(
  items: T[],
  pageSize = DEFAULT_DASHBOARD_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);
  const pagination = useMemo(
    () => paginateDashboardItems(items, page, pageSize),
    [items, page, pageSize],
  );
  const goToNextPage = useCallback(
    () => setPage((currentPage) => Math.min(pagination.pageCount, currentPage + 1)),
    [pagination.pageCount],
  );
  const goToPreviousPage = useCallback(
    () => setPage((currentPage) => Math.max(1, currentPage - 1)),
    [],
  );

  return {
    ...pagination,
    goToNextPage,
    goToPreviousPage,
    setPage,
  };
}
