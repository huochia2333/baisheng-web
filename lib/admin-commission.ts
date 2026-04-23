import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getOrderUserOptions, type OrderUserOption } from "./admin-orders";
import { withRequestTimeout } from "./request-timeout";
import {
  getTaskCommissions,
  type TaskCommissionRow,
} from "./task-commissions";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";
import {
  getDashboardQueryRange,
  MAX_DASHBOARD_QUERY_ROWS,
} from "./dashboard-pagination";

const ADMIN_COMMISSION_SELECT =
  "id,order_overview_id,beneficiary_user_id,commission_category,source_customer_user_id,source_salesman_user_id,order_amount_rmb_snapshot,cost_amount_rmb_snapshot,service_fee_amount_rmb_snapshot,commission_amount_rmb,calculation_snapshot,settlement_status,settled_at,settlement_note,created_at,updated_at";
const COMMISSION_ORDER_REFERENCE_SELECT =
  "id,order_number,order_status,deleted_at,completed_at";

export type CommissionSettlementStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "reversed";

export type CommissionCategory =
  | "salesman_purchase"
  | "salesman_service"
  | "referral_purchase"
  | "referral_service"
  | "referral_vip_first_year_bonus"
  | "manual_adjustment";

export type AdminCommissionViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type AdminCommissionPageData = {
  hasPermission: boolean;
  commissions: AdminCommissionRow[];
  taskCommissions: TaskCommissionRow[];
};

export type AdminCommissionActor = {
  userId: string | null;
  label: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
  status: UserStatus | null;
};

export type AdminCommissionRow = {
  id: string;
  orderOverviewId: string;
  orderNumber: string;
  orderStatus: string | null;
  orderStatusLabel: string;
  orderDeletedAt: string | null;
  orderCompletedAt: string | null;
  isOrderDeleted: boolean;
  beneficiary: AdminCommissionActor;
  sourceCustomer: AdminCommissionActor | null;
  sourceSalesman: AdminCommissionActor | null;
  category: CommissionCategory;
  categoryLabel: string;
  settlementStatus: CommissionSettlementStatus;
  settlementStatusLabel: string;
  orderAmountRmb: number;
  costAmountRmb: number | null;
  serviceFeeAmountRmb: number | null;
  commissionAmountRmb: number;
  settlementNote: string | null;
  settledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  calculationSnapshot: unknown;
};

type CommissionRecordRow = {
  id: string;
  order_overview_id: string;
  beneficiary_user_id: string;
  commission_category: CommissionCategory;
  source_customer_user_id: string | null;
  source_salesman_user_id: string | null;
  order_amount_rmb_snapshot: number | string;
  cost_amount_rmb_snapshot: number | string | null;
  service_fee_amount_rmb_snapshot: number | string | null;
  commission_amount_rmb: number | string;
  calculation_snapshot: unknown;
  settlement_status: CommissionSettlementStatus;
  settled_at: string | null;
  settlement_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommissionOrderReferenceRecord = {
  id: string;
  order_number: string | null;
  order_status: string | null;
  deleted_at: string | null;
  completed_at: string | null;
};

export async function getCurrentCommissionViewerContext(
  supabase: SupabaseClient,
): Promise<AdminCommissionViewerContext | null> {
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

export function canViewAdminCommissionBoard(
  role: AppRole | null,
  status: UserStatus | null,
) {
  return (
    status === "active" &&
    (role === "administrator" || role === "finance")
  );
}

export async function getAdminCommissionPageData(
  supabase: SupabaseClient,
): Promise<AdminCommissionPageData> {
  const viewer = await getCurrentCommissionViewerContext(supabase);

  if (!viewer || !canViewAdminCommissionBoard(viewer.role, viewer.status)) {
    return {
      hasPermission: false,
      commissions: [],
      taskCommissions: [],
    };
  }

  const [commissions, taskCommissions] = await Promise.all([
    getAdminCommissions(supabase),
    getTaskCommissions(supabase),
  ]);

  return {
    hasPermission: true,
    commissions,
    taskCommissions,
  };
}

export async function getAdminCommissions(
  supabase: SupabaseClient,
  options?: {
    beneficiaryUserId?: string | null;
    limit?: number;
  },
): Promise<AdminCommissionRow[]> {
  const [commissionRows, userOptions] = await Promise.all([
    getCommissionRecordRows(supabase, options),
    getOrderUserOptions(supabase),
  ]);

  if (commissionRows.length === 0) {
    return [];
  }

  const orderOverviewIds = Array.from(
    new Set(commissionRows.map((row) => row.order_overview_id)),
  );
  const orderReferences =
    orderOverviewIds.length > 0
      ? await getCommissionOrderReferences(supabase, orderOverviewIds)
      : [];
  const orderById = new Map(orderReferences.map((order) => [order.id, order]));
  const userById = new Map(userOptions.map((option) => [option.user_id, option]));

  return commissionRows.map((row) =>
    normalizeCommissionRow(row, orderById, userById),
  );
}

async function getCommissionRecordRows(
  supabase: SupabaseClient,
  options?: {
    beneficiaryUserId?: string | null;
    limit?: number;
  },
): Promise<CommissionRecordRow[]> {
  const { from, to } = getDashboardQueryRange(
    options?.limit ?? MAX_DASHBOARD_QUERY_ROWS,
  );
  let commissionQuery = supabase.from("commission_record").select(ADMIN_COMMISSION_SELECT);

  if (options?.beneficiaryUserId) {
    commissionQuery = commissionQuery.eq(
      "beneficiary_user_id",
      options.beneficiaryUserId,
    );
  }

  const { data, error } = await withRequestTimeout(
    commissionQuery
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<CommissionRecordRow[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getCommissionOrderReferences(
  supabase: SupabaseClient,
  orderOverviewIds: string[],
): Promise<CommissionOrderReferenceRecord[]> {
  const { data, error } = await withRequestTimeout(
    supabase
      .from("order_overview")
      .select(COMMISSION_ORDER_REFERENCE_SELECT)
      .in("id", orderOverviewIds)
      .returns<CommissionOrderReferenceRecord[]>(),
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

function normalizeCommissionRow(
  row: CommissionRecordRow,
  orderById: Map<string, CommissionOrderReferenceRecord>,
  userById: Map<string, OrderUserOption>,
): AdminCommissionRow {
  const order = orderById.get(row.order_overview_id);
  const orderNumber = normalizeText(order?.order_number) ?? row.order_overview_id;
  const orderStatus = normalizeText(order?.order_status);

  return {
    id: row.id,
    orderOverviewId: row.order_overview_id,
    orderNumber,
    orderStatus,
    orderStatusLabel: getOrderStatusLabel(orderStatus),
    orderDeletedAt: normalizeText(order?.deleted_at),
    orderCompletedAt: normalizeText(order?.completed_at),
    isOrderDeleted: Boolean(normalizeText(order?.deleted_at)),
    beneficiary: buildActor(row.beneficiary_user_id, userById),
    sourceCustomer: buildOptionalActor(row.source_customer_user_id, userById),
    sourceSalesman: buildOptionalActor(row.source_salesman_user_id, userById),
    category: row.commission_category,
    categoryLabel: getCommissionCategoryLabel(row.commission_category),
    settlementStatus: row.settlement_status,
    settlementStatusLabel: getSettlementStatusLabel(row.settlement_status),
    orderAmountRmb: parseNumericValue(row.order_amount_rmb_snapshot) ?? 0,
    costAmountRmb: parseNumericValue(row.cost_amount_rmb_snapshot),
    serviceFeeAmountRmb: parseNumericValue(
      row.service_fee_amount_rmb_snapshot,
    ),
    commissionAmountRmb: parseNumericValue(row.commission_amount_rmb) ?? 0,
    settlementNote: normalizeText(row.settlement_note),
    settledAt: normalizeText(row.settled_at),
    createdAt: normalizeText(row.created_at),
    updatedAt: normalizeText(row.updated_at),
    calculationSnapshot: row.calculation_snapshot,
  };
}

function buildOptionalActor(
  userId: string | null,
  userById: Map<string, OrderUserOption>,
) {
  const normalizedUserId = normalizeText(userId);

  if (!normalizedUserId) {
    return null;
  }

  return buildActor(normalizedUserId, userById);
}

function buildActor(
  userId: string,
  userById: Map<string, OrderUserOption>,
): AdminCommissionActor {
  const profile = userById.get(userId);
  const name = normalizeText(profile?.name);
  const email = normalizeText(profile?.email);

  return {
    userId,
    label: name ?? email ?? getFallbackUserLabel(userId),
    name,
    email,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
  };
}

function parseNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getFallbackUserLabel(userId: string) {
  return `用户 ${userId.slice(0, 8)}`;
}

function getCommissionCategoryLabel(category: CommissionCategory) {
  switch (category) {
    case "salesman_purchase":
      return "业务员采购佣金";
    case "salesman_service":
      return "业务员服务佣金";
    case "referral_purchase":
      return "推荐采购佣金";
    case "referral_service":
      return "推荐服务佣金";
    case "referral_vip_first_year_bonus":
      return "VIP 首年推荐奖励";
    case "manual_adjustment":
      return "手工调整";
    default:
      return "佣金";
  }
}

function getSettlementStatusLabel(status: CommissionSettlementStatus) {
  switch (status) {
    case "pending":
      return "待结算";
    case "paid":
      return "已结算";
    case "cancelled":
      return "已取消";
    case "reversed":
      return "已冲销";
    default:
      return "未知状态";
  }
}

function getOrderStatusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "待处理";
    case "in_progress":
      return "处理中";
    case "settled":
      return "已结算";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    case "refunding":
      return "退款中";
    default:
      return "暂无状态";
  }
}
