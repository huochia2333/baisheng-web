import type { SupabaseClient } from "@supabase/supabase-js";

import {
  filterOrderTypeOptionsForBusinessScope,
  getAdminOrderBusinessScope,
  getOrderTypeIdsForBusinessScope,
} from "./admin-orders-business-scope";
import { getAdminOrderCount, queryAdminOrders, type AdminOrderOverviewFilters } from "./admin-orders-query";
import {
  getAdminOrderCosts,
  mergeAdminOrdersWithCosts,
} from "./admin-orders-costs";
import {
  getOrderDiscountTypeOptions,
  getOrderTypeOptions,
  getOrderUserOptions,
  getPurchaseOrderTypeOptions,
  getServiceOrderTypeOptions,
} from "./admin-orders-options";
import {
  canReadOrderByRole,
  canReadOrderCostByRole,
  getCurrentOrderViewerContext,
} from "./admin-orders-viewer";
import {
  DEFAULT_DASHBOARD_PAGE_SIZE,
  getDashboardPaginationState,
  getDashboardQueryRangeForPage,
} from "./dashboard-pagination";
import {
  getTodayCnyExchangeRates,
} from "./exchange-rates";
import {
  normalizeOptionalString,
  normalizePositiveInteger,
  normalizeSearchText,
} from "./value-normalizers";
import type {
  AdminOrdersFilters,
  AdminOrdersPageData,
  OrderUserOption,
} from "./admin-orders-types";
import type { AppRole, UserStatus } from "./user-self-service";

export function normalizeAdminOrdersFilters(
  filters?: Partial<AdminOrdersFilters> | null,
): AdminOrdersFilters {
  return {
    orderEntryUser: normalizeOptionalString(filters?.orderEntryUser) ?? "",
    orderNumber: normalizeOptionalString(filters?.orderNumber) ?? "",
    orderingUser: normalizeOptionalString(filters?.orderingUser) ?? "",
  };
}

export function parseAdminOrdersSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return {
    filters: normalizeAdminOrdersFilters({
      orderEntryUser: getSingleSearchParam(searchParams.orderEntryUser),
      orderNumber: getSingleSearchParam(searchParams.orderNumber),
      orderingUser: getSingleSearchParam(searchParams.orderingUser),
    }),
    page: normalizePositiveInteger(getSingleSearchParam(searchParams.page), 1),
  };
}

export async function getAdminOrdersPageData(
  supabase: SupabaseClient,
  options: {
    filters?: Partial<AdminOrdersFilters> | null;
    includeOrderCosts?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<AdminOrdersPageData> {
  const filters = normalizeAdminOrdersFilters(options.filters);
  const pageSize = normalizePositiveInteger(options.pageSize, DEFAULT_DASHBOARD_PAGE_SIZE);
  const requestedPage = normalizePositiveInteger(options.page, 1);
  const viewer = await getCurrentOrderViewerContext(supabase);

  if (!viewer) {
    return createEmptyAdminOrdersPageData({
      filters,
      page: requestedPage,
      pageSize,
    });
  }

  const businessScope = await getAdminOrderBusinessScope(supabase, viewer.role);
  const canViewOrders =
    canReadOrderByRole(viewer.role, viewer.status) &&
    businessScope.canViewAssignedBoards;
  const canViewOrderCosts =
    options.includeOrderCosts === true && canReadOrderCostByRole(viewer.role, viewer.status);

  if (!canViewOrders) {
    return {
      ...createEmptyAdminOrdersPageData({
        currentViewerId: viewer.user.id,
        currentViewerRole: viewer.role,
        currentViewerStatus: viewer.status,
        filters,
        page: requestedPage,
        pageSize,
      }),
      canViewOrders: false,
    };
  }

  const [
    userOptions,
    allOrderTypeOptions,
    purchaseOrderTypeOptions,
    serviceOrderTypeOptions,
    orderDiscountOptions,
    todayExchangeRates,
  ] = await Promise.all([
    getOrderUserOptions(supabase),
    getOrderTypeOptions(supabase),
    getPurchaseOrderTypeOptions(supabase),
    getServiceOrderTypeOptions(supabase),
    getOrderDiscountTypeOptions(supabase),
    getTodayCnyExchangeRates(supabase),
  ]);
  const orderTypeOptions = filterOrderTypeOptionsForBusinessScope(
    allOrderTypeOptions,
    businessScope,
  );
  const businessOrderTypeIds = getOrderTypeIdsForBusinessScope(
    orderTypeOptions,
    businessScope,
  );

  if (businessOrderTypeIds !== null && businessOrderTypeIds.length === 0) {
    return {
      canViewOrderCosts,
      canViewOrders,
      currentViewerId: viewer.user.id,
      currentViewerRole: viewer.role,
      currentViewerStatus: viewer.status,
      filters,
      matchedOrdersCount: 0,
      orderDiscountOptions,
      orderTypeOptions,
      orders: [],
      pagination: getDashboardPaginationState(0, requestedPage, pageSize),
      purchaseOrderTypeOptions,
      serviceOrderTypeOptions,
      summary: {
        completed: 0,
        pending: 0,
        total: 0,
      },
      todayExchangeRates,
      totalOrdersCount: 0,
      userOptions,
    };
  }

  const businessOrderFilter: Pick<AdminOrderOverviewFilters, "orderTypeIds"> =
    businessOrderTypeIds !== null
      ? {
          orderTypeIds: businessOrderTypeIds,
        }
      : {};
  const [
    totalOrdersCount,
    pendingOrdersCount,
    completedOrdersCount,
  ] = await Promise.all([
    getAdminOrderCount(supabase, businessOrderFilter),
    getAdminOrderCount(supabase, {
      ...businessOrderFilter,
      orderStatus: "pending",
    }),
    getAdminOrderCount(supabase, {
      ...businessOrderFilter,
      orderStatus: "completed",
    }),
  ]);

  const orderEntryUserFilter = resolveAdminOrderUserFilter(
    userOptions,
    filters.orderEntryUser,
  );
  const orderingUserFilter = resolveAdminOrderUserFilter(
    userOptions,
    filters.orderingUser,
  );

  const filterHasNoMatches =
    orderEntryUserFilter.hasNoMatches || orderingUserFilter.hasNoMatches;
  const orderFilters: AdminOrderOverviewFilters = {
    ...businessOrderFilter,
    orderEntryUserIds: orderEntryUserFilter.userIds,
    orderNumber: filters.orderNumber,
    orderingUserIds: orderingUserFilter.userIds,
  };
  const matchedOrdersCount = filterHasNoMatches
    ? 0
    : await getAdminOrderCount(supabase, orderFilters);
  const pagination = getDashboardPaginationState(
    matchedOrdersCount,
    requestedPage,
    pageSize,
  );

  if (matchedOrdersCount === 0) {
    return {
      canViewOrderCosts,
      canViewOrders,
      currentViewerId: viewer.user.id,
      currentViewerRole: viewer.role,
      currentViewerStatus: viewer.status,
      filters,
      matchedOrdersCount,
      orderDiscountOptions,
      orderTypeOptions,
      orders: [],
      pagination,
      purchaseOrderTypeOptions,
      serviceOrderTypeOptions,
      summary: {
        completed: completedOrdersCount,
        pending: pendingOrdersCount,
        total: totalOrdersCount,
      },
      todayExchangeRates,
      totalOrdersCount,
      userOptions,
    };
  }

  const orders = await queryAdminOrders(supabase, {
    filters: orderFilters,
    range: getDashboardQueryRangeForPage(pagination.page, pagination.pageSize),
  });
  const orderCosts =
    canViewOrderCosts && orders.length > 0
      ? await getAdminOrderCosts(
          supabase,
          orders.map((order) => order.id),
        )
      : [];

  return {
    canViewOrderCosts,
    canViewOrders,
    currentViewerId: viewer.user.id,
    currentViewerRole: viewer.role,
    currentViewerStatus: viewer.status,
    filters,
    matchedOrdersCount,
    orderDiscountOptions,
    orderTypeOptions,
    orders: canViewOrderCosts ? mergeAdminOrdersWithCosts(orders, orderCosts) : orders,
    pagination,
    purchaseOrderTypeOptions,
    serviceOrderTypeOptions,
    summary: {
      completed: completedOrdersCount,
      pending: pendingOrdersCount,
      total: totalOrdersCount,
    },
    todayExchangeRates,
    totalOrdersCount,
    userOptions,
  };
}

function createEmptyAdminOrdersPageData(options: {
  currentViewerId?: string | null;
  currentViewerRole?: AppRole | null;
  currentViewerStatus?: UserStatus | null;
  filters: AdminOrdersFilters;
  page: number;
  pageSize: number;
}): AdminOrdersPageData {
  return {
    canViewOrderCosts: false,
    canViewOrders: false,
    currentViewerId: options.currentViewerId ?? null,
    currentViewerRole: options.currentViewerRole ?? null,
    currentViewerStatus: options.currentViewerStatus ?? null,
    filters: options.filters,
    matchedOrdersCount: 0,
    orderDiscountOptions: [],
    orderTypeOptions: [],
    orders: [],
    pagination: getDashboardPaginationState(0, options.page, options.pageSize),
    purchaseOrderTypeOptions: [],
    serviceOrderTypeOptions: [],
    summary: {
      completed: 0,
      pending: 0,
      total: 0,
    },
    todayExchangeRates: [],
    totalOrdersCount: 0,
    userOptions: [],
  };
}

function resolveAdminOrderUserFilter(
  userOptions: OrderUserOption[],
  rawValue: string,
): {
  hasNoMatches: boolean;
  userIds?: string[];
} {
  const normalizedValue = normalizeSearchText(rawValue);

  if (!normalizedValue) {
    return {
      hasNoMatches: false,
    };
  }

  const userIds = userOptions
    .filter((option) =>
      normalizeSearchText(getOrderUserSearchLabel(option)).includes(normalizedValue),
    )
    .map((option) => option.user_id);

  if (userIds.length === 0) {
    return {
      hasNoMatches: true,
      userIds: [],
    };
  }

  return {
    hasNoMatches: false,
    userIds,
  };
}

function getOrderUserSearchLabel(option: OrderUserOption) {
  const normalizedName = normalizeOptionalString(option.name);
  const normalizedEmail = normalizeOptionalString(option.email);

  if (normalizedName && normalizedEmail) {
    return `${normalizedName} / ${normalizedEmail}`;
  }

  return normalizedName ?? normalizedEmail ?? option.user_id;
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
