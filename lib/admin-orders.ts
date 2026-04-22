import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  ADMIN_ORDER_SELECT,
  getAdminOrderCount,
  queryAdminOrders,
  type AdminOrderOverviewFilters,
} from "./admin-orders-query";
import {
  DEFAULT_DASHBOARD_PAGE_SIZE,
  type DashboardPaginationState,
  getDashboardPaginationState,
  getDashboardQueryRangeForPage,
} from "./dashboard-pagination";
import { withRequestTimeout } from "./request-timeout";

export type AdminOrderRow = {
  id: string;
  order_number: string;
  original_currency: string | null;
  amount: number | string | null;
  daily_exchange_rate: number | string | null;
  transaction_rate: number | string | null;
  rmb_amount: number | string | null;
  order_entry_user: string | null;
  ordering_user: string | null;
  order_status: string | null;
  order_type: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  deleted_at: string | null;
  cost_amount: number | string | null;
};

export type OrderUserOption = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string;
  role: AppRole | null;
};

export type BusinessCategoryOption = {
  id: string;
  category: string;
};

export type PurchaseOrderTypeOption = {
  id: string;
  business_subcategory: string;
};

export type ServiceOrderTypeOption = {
  id: string;
  business_subcategory: string;
};

export type OrderDiscountTypeOption = {
  id: string;
  discount_ratio: number | string;
};

export type CreateAdminOrderInput = {
  originalCurrency: string;
  amount: number;
  dailyExchangeRate: number;
  transactionRate: number;
  rmbAmount: number;
  costAmount?: number | null;
  orderEntryUser: string;
  orderingUser: string;
  orderStatus: string;
  orderType: string;
  supplementary?: CreateAdminOrderSupplementaryInput | null;
};

export type UpdateAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber: string;
};

export type AdminOrderDetailValue =
  | string
  | number
  | boolean
  | null
  | AdminOrderDetailValue[]
  | { [key: string]: AdminOrderDetailValue };

export type AdminOrderSupplementaryDetail =
  | {
      kind: "purchase";
      orderNumber: string;
      subtypeId: string;
      subtype: string | null;
      details: AdminOrderDetailValue;
    }
  | {
      kind: "service";
      orderNumber: string;
      subtypeId: string;
      subtype: string | null;
      discountId: string;
      discountRatio: number | string | null;
      details: AdminOrderDetailValue;
    };

export type CreateAdminOrderSupplementaryInput =
  | {
      kind: "purchase";
      subtypeId: string;
      details: AdminOrderDetailValue;
    }
  | {
      kind: "service";
      subtypeId: string;
      discountId: string;
      details: AdminOrderDetailValue;
    };

type PurchaseOrderRecord = {
  order_overview_id: string;
  order_type: string;
  order_details: AdminOrderDetailValue;
};

type PurchaseOrderTypeRecord = {
  business_subcategory: string | null;
};

type ServiceOrderRecord = {
  order_overview_id: string;
  order_type: string;
  order_discount: string;
  order_details: AdminOrderDetailValue;
};

type ServiceOrderTypeRecord = {
  business_subcategory: string | null;
};

type OrderDiscountTypeRecord = {
  discount_ratio: number | string | null;
};

type OrderOverviewReference = {
  id: string;
  order_number: string;
};

type AdminOrderCostRow = {
  order_overview_id: string;
  cost_amount: number | string | null;
};

type SaveAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber?: string | null;
};

export type OrderViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type AdminOrdersFilters = {
  orderEntryUser: string;
  orderNumber: string;
  orderingUser: string;
};

export type AdminOrdersPageData = {
  canViewOrderCosts: boolean;
  canViewOrders: boolean;
  currentViewerId: string | null;
  currentViewerRole: AppRole | null;
  currentViewerStatus: UserStatus | null;
  filters: AdminOrdersFilters;
  matchedOrdersCount: number;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orders: AdminOrderRow[];
  pagination: DashboardPaginationState;
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  summary: {
    completed: number;
    pending: number;
    total: number;
  };
  totalOrdersCount: number;
  userOptions: OrderUserOption[];
};

export async function getCurrentOrderViewerContext(
  supabase: SupabaseClient,
): Promise<OrderViewerContext | null> {
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

export async function getAdminOrderCosts(
  supabase: SupabaseClient,
  orderOverviewIds: string[],
): Promise<AdminOrderCostRow[]> {
  if (orderOverviewIds.length === 0) {
    return [];
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_internal_cost")
      .select("order_overview_id,cost_amount")
      .in("order_overview_id", orderOverviewIds)
      .returns<AdminOrderCostRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function canViewOrderCosts(
  role: AppRole | null,
  status: UserStatus | null,
): boolean {
  return canReadOrderCostByRole(role, status);
}

export function mergeAdminOrdersWithCosts(
  orders: AdminOrderRow[],
  costRows: AdminOrderCostRow[],
): AdminOrderRow[] {
  const costByOrderId = new Map(
    costRows.map((item) => [item.order_overview_id, item.cost_amount]),
  );

  return orders.map((order) => ({
    ...order,
    cost_amount: costByOrderId.get(order.id) ?? null,
  }));
}

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

  const canViewOrders = canReadOrderByRole(viewer.role, viewer.status);
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
    orderTypeOptions,
    purchaseOrderTypeOptions,
    serviceOrderTypeOptions,
    orderDiscountOptions,
    totalOrdersCount,
    pendingOrdersCount,
    completedOrdersCount,
  ] = await Promise.all([
    getOrderUserOptions(supabase),
    getOrderTypeOptions(supabase),
    getPurchaseOrderTypeOptions(supabase),
    getServiceOrderTypeOptions(supabase),
    getOrderDiscountTypeOptions(supabase),
    getAdminOrderCount(supabase),
    getAdminOrderCount(supabase, { orderStatus: "pending" }),
    getAdminOrderCount(supabase, { orderStatus: "completed" }),
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
    totalOrdersCount,
    userOptions,
  };
}

export async function getOrderUserOptions(
  supabase: SupabaseClient,
): Promise<OrderUserOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_order_user_options"),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => ({
    user_id:
      typeof item === "object" && item !== null && "user_id" in item
        ? String(item.user_id)
        : "",
    name:
      typeof item === "object" && item !== null && "name" in item && typeof item.name === "string"
        ? item.name
        : null,
    email:
      typeof item === "object" && item !== null && "email" in item && typeof item.email === "string"
        ? item.email
        : null,
    status: normalizeUserStatus(
      typeof item === "object" && item !== null && "status" in item ? item.status : null,
    ),
    created_at:
      typeof item === "object" && item !== null && "created_at" in item
        ? String(item.created_at ?? "")
        : "",
    role: normalizeAppRole(
      typeof item === "object" && item !== null && "role" in item ? item.role : null,
    ),
  }));
}

export async function getOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<BusinessCategoryOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("business_category")
      .select("id,category")
      .order("category", { ascending: true })
      .returns<BusinessCategoryOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function canReadOrderByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman" ||
    role === "client"
  );
}

export function canReadOrderCostByRole(role: AppRole | null, status: UserStatus | null) {
  if (status !== "active") {
    return false;
  }

  return (
    role === "administrator" ||
    role === "finance" ||
    role === "manager" ||
    role === "salesman"
  );
}

export async function getPurchaseOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<PurchaseOrderTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("purchase_order_type")
      .select("id,business_subcategory")
      .order("business_subcategory", { ascending: true })
      .returns<PurchaseOrderTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getServiceOrderTypeOptions(
  supabase: SupabaseClient,
): Promise<ServiceOrderTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("service_order_type")
      .select("id,business_subcategory")
      .order("business_subcategory", { ascending: true })
      .returns<ServiceOrderTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrderDiscountTypeOptions(
  supabase: SupabaseClient,
): Promise<OrderDiscountTypeOption[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_discount_type")
      .select("id,discount_ratio")
      .order("discount_ratio", { ascending: false })
      .returns<OrderDiscountTypeOption[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAdminOrderSupplementaryDetail(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<AdminOrderSupplementaryDetail | null> {
  const overview = await getOrderOverviewReference(supabase, orderNumber);

  if (!overview) {
    return null;
  }

  const [purchaseResult, serviceResult] = await Promise.all([
    withRequestTimeout(
      supabase
        .from("purchase_order")
        .select("order_overview_id,order_type,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<PurchaseOrderRecord>(),
    ),
    withRequestTimeout(
      supabase
        .from("service_order")
        .select("order_overview_id,order_type,order_discount,order_details")
        .eq("order_overview_id", overview.id)
        .maybeSingle<ServiceOrderRecord>(),
    ),
  ]);

  if (purchaseResult.error) {
    throw purchaseResult.error;
  }

  if (serviceResult.error) {
    throw serviceResult.error;
  }

  if (purchaseResult.data) {
    const { data: purchaseType, error: purchaseTypeError } = await withRequestTimeout(
      supabase
        .from("purchase_order_type")
        .select("business_subcategory")
        .eq("id", purchaseResult.data.order_type)
        .maybeSingle<PurchaseOrderTypeRecord>(),
    );

    if (purchaseTypeError) {
      throw purchaseTypeError;
    }

    return {
      kind: "purchase",
      orderNumber: overview.order_number,
      subtypeId: purchaseResult.data.order_type,
      subtype: purchaseType?.business_subcategory ?? null,
      details: purchaseResult.data.order_details,
    };
  }

  if (serviceResult.data) {
    const [serviceTypeResult, discountTypeResult] = await Promise.all([
      withRequestTimeout(
        supabase
          .from("service_order_type")
          .select("business_subcategory")
          .eq("id", serviceResult.data.order_type)
          .maybeSingle<ServiceOrderTypeRecord>(),
      ),
      withRequestTimeout(
        supabase
          .from("order_discount_type")
          .select("discount_ratio")
          .eq("id", serviceResult.data.order_discount)
          .maybeSingle<OrderDiscountTypeRecord>(),
      ),
    ]);

    if (serviceTypeResult.error) {
      throw serviceTypeResult.error;
    }

    if (discountTypeResult.error) {
      throw discountTypeResult.error;
    }

    return {
      kind: "service",
      orderNumber: overview.order_number,
      subtypeId: serviceResult.data.order_type,
      subtype: serviceTypeResult.data?.business_subcategory ?? null,
      discountId: serviceResult.data.order_discount,
      discountRatio: discountTypeResult.data?.discount_ratio ?? null,
      details: serviceResult.data.order_details,
    };
  }

  return null;
}

export async function createAdminOrder(
  supabase: SupabaseClient,
  input: CreateAdminOrderInput,
): Promise<AdminOrderRow> {
  const savedOrderId = await saveAdminOrder(supabase, input);
  return getRequiredAdminOrderById(supabase, savedOrderId, "Order creation");
}

export async function updateAdminOrder(
  supabase: SupabaseClient,
  input: UpdateAdminOrderInput,
): Promise<AdminOrderRow> {
  const savedOrderId = await saveAdminOrder(supabase, input);
  return getRequiredAdminOrderById(supabase, savedOrderId, "Order update");
}

export async function deleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<void> {
  await runDeleteAdminOrder(supabase, orderNumber, false);
}

export async function forceDeleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<void> {
  await runDeleteAdminOrder(supabase, orderNumber, true);
}

async function runDeleteAdminOrder(
  supabase: SupabaseClient,
  orderNumber: string,
  force: boolean,
): Promise<void> {
  const normalizedOrderNumber = orderNumber.trim();

  if (!normalizedOrderNumber) {
    throw new Error("Order number is required.");
  }

  const { error } = await withRequestTimeout(
    supabase.rpc("delete_order", {
      p_order_number: normalizedOrderNumber,
      p_force: force,
    }),
  );

  if (error) {
    throw error;
  }
}

async function getAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
): Promise<AdminOrderRow | null> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(ADMIN_ORDER_SELECT)
      .eq("id", orderId)
      .maybeSingle<AdminOrderRow>(),
  );

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const viewer = await getCurrentOrderViewerContext(supabase);

  if (!viewer || !canViewOrderCosts(viewer.role, viewer.status)) {
    return {
      ...data,
      cost_amount: null,
    };
  }

  const { data: costData, error: costError } = await withRequestTimeout(
    supabase
      .from("order_internal_cost")
      .select("order_overview_id,cost_amount")
      .eq("order_overview_id", orderId)
      .maybeSingle<AdminOrderCostRow>(),
  );

  if (costError) {
    throw costError;
  }

  return {
    ...data,
    cost_amount: costData?.cost_amount ?? null,
  };
}

async function getRequiredAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
  actionLabel: string,
): Promise<AdminOrderRow> {
  const data = await getAdminOrderById(supabase, orderId);

  if (!data) {
    throw new Error(`${actionLabel} succeeded, but the saved order could not be reloaded.`);
  }

  return data;
}

async function saveAdminOrder(
  supabase: SupabaseClient,
  input: SaveAdminOrderInput,
): Promise<string> {
  const hasCostAmount = Object.prototype.hasOwnProperty.call(input, "costAmount");

  const { data, error } = await withRequestTimeout(
    supabase.rpc("save_order", {
      p_original_currency: input.originalCurrency,
      p_amount: input.amount,
      p_daily_exchange_rate: input.dailyExchangeRate,
      p_transaction_rate: input.transactionRate,
      p_rmb_amount: input.rmbAmount,
      p_order_entry_user: input.orderEntryUser,
      p_ordering_user: input.orderingUser,
      p_order_status: input.orderStatus,
      p_order_type: input.orderType,
      p_supplementary: input.supplementary ?? null,
      p_original_order_number: input.originalOrderNumber ?? null,
      p_cost_amount: hasCostAmount ? (input.costAmount ?? null) : null,
      p_has_cost: hasCostAmount ? input.costAmount !== null : null,
    }),
  );

  if (error) {
    throw error;
  }

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("The order save RPC did not return a valid order id.");
  }

  return data.trim();
}

async function getOrderOverviewReference(
  supabase: SupabaseClient,
  orderNumber: string,
): Promise<OrderOverviewReference | null> {
  const normalizedOrderNumber = orderNumber.trim();

  if (!normalizedOrderNumber) {
    return null;
  }

  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select("id,order_number")
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle<OrderOverviewReference>(),
  );

  if (error) {
    throw error;
  }

  return data ?? null;
}

function normalizeAppRole(value: unknown): AppRole | null {
  if (
    value === "administrator" ||
    value === "operator" ||
    value === "manager" ||
    value === "recruiter" ||
    value === "salesman" ||
    value === "finance" ||
    value === "client"
  ) {
    return value;
  }

  return null;
}

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "inactive" || value === "active" || value === "suspended") {
    return value;
  }

  return null;
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

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSearchText(value: string | null | undefined) {
  return (normalizeOptionalString(value) ?? "").toLowerCase().replace(/\s+/g, " ");
}
