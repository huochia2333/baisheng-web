"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type AdminOrdersFilters,
  type AdminOrdersPageData,
} from "@/lib/admin-orders";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

import {
  areOrderFiltersEqual,
  EMPTY_ORDER_FILTERS,
} from "./admin-orders-client-config";

export function useAdminOrdersRouteState({
  initialFilters,
  pagination,
}: {
  initialFilters: AdminOrdersFilters;
  pagination: AdminOrdersPageData["pagination"];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startRouteTransition] = useTransition();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const replaceOrdersRoute = useCallback(
    (next: {
      filters?: AdminOrdersFilters;
      page?: number;
    }) => {
      const nextFilters = next.filters ?? filters;
      const nextPage = next.page ?? pagination.page;
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextFilters.orderNumber) {
        nextParams.set("orderNumber", nextFilters.orderNumber);
      } else {
        nextParams.delete("orderNumber");
      }

      if (nextFilters.orderEntryUser) {
        nextParams.set("orderEntryUser", nextFilters.orderEntryUser);
      } else {
        nextParams.delete("orderEntryUser");
      }

      if (nextFilters.orderingUser) {
        nextParams.set("orderingUser", nextFilters.orderingUser);
      } else {
        nextParams.delete("orderingUser");
      }

      if (nextPage > 1) {
        nextParams.set("page", String(nextPage));
      } else {
        nextParams.delete("page");
      }

      const nextQuery = nextParams.toString();

      startRouteTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      });
    },
    [filters, pagination.page, pathname, router, searchParams, startRouteTransition],
  );

  useEffect(() => {
    if (areOrderFiltersEqual(filters, initialFilters)) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      replaceOrdersRoute({
        filters,
        page: 1,
      });
    }, 250);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [filters, initialFilters, replaceOrdersRoute]);

  const refreshOrdersRoute = useCallback(() => {
    startRouteTransition(() => {
      router.refresh();
    });
  }, [router, startRouteTransition]);

  useWorkspaceSyncEffect(refreshOrdersRoute);

  const goToPage = useCallback(
    (page: number) => {
      replaceOrdersRoute({
        filters,
        page,
      });
    },
    [filters, replaceOrdersRoute],
  );

  const ordersPaginationState = useMemo(
    () => ({
      endIndex: pagination.endIndex,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
      onNextPage: () => goToPage(pagination.page + 1),
      onPreviousPage: () => goToPage(pagination.page - 1),
      page: pagination.page,
      pageCount: pagination.pageCount,
      startIndex: pagination.startIndex,
      totalItems: pagination.totalItems,
    }),
    [
      goToPage,
      pagination.endIndex,
      pagination.hasNextPage,
      pagination.hasPreviousPage,
      pagination.page,
      pagination.pageCount,
      pagination.startIndex,
      pagination.totalItems,
    ],
  );

  const handleOrderNumberChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderNumber: value,
    }));
  }, []);

  const handleOrderEntryUserChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderEntryUser: value,
    }));
  }, []);

  const handleOrderingUserChange = useCallback((value: string) => {
    setFilters((current) => ({
      ...current,
      orderingUser: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_ORDER_FILTERS);
  }, []);

  return {
    clearFilters,
    filters,
    handleOrderEntryUserChange,
    handleOrderNumberChange,
    handleOrderingUserChange,
    ordersPaginationState,
    refreshOrdersRoute,
  };
}
