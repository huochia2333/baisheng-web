import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAppRoleFromMetadataContainer,
  type UserStatus,
} from "./auth-metadata";
import type { AppRole } from "./auth-routing";
import {
  getLatestCnyExchangeRates,
  type ExchangeRateRow,
} from "./exchange-rates";
import type { WorkspaceWholesaleSectionKey } from "./workspace-config";

export type WholesaleCustomer = {
  id: string;
  registered_user_id: string | null;
  assigned_sales_user_id: string | null;
  created_by_user_id: string | null;
  customer_kind: "registered_account" | "sales_created";
  unique_name: string;
  other_names: string[];
  contact_details: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WholesaleOrder = {
  id: string;
  order_number: string;
  customer_id: string;
  sales_user_id: string | null;
  small_order_count: number;
  product_purchase_amount: number;
  packing_fee: number;
  international_shipping_fee: number;
  other_fee: number;
  referral_commission_fee: number;
  courier_company: string | null;
  settlement_exchange_rate: number;
  customer_payment_currency: string;
  customer_payment_amount: number;
  customer_payment_rmb_amount: number;
  payment_platform: string | null;
  gross_profit: number;
  gross_margin: number | null;
  unit_gross_profit: number | null;
  commission_rate: number;
  notes: string | null;
  order_month: string;
  status: "unsettled" | "settled";
  ordered_at: string;
  settled_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Wholesale1688Order = {
  id: string;
  batch_id: string | null;
  external_order_number: string;
  seller_name: string | null;
  item_summary: string | null;
  quantity: number | null;
  purchase_amount: number | null;
  order_status: string | null;
  purchased_at: string | null;
  recipient_name: string | null;
  raw_payload: Record<string, unknown>;
  assisted_customer_id: string | null;
  assisted_at: string | null;
  customer_id: string | null;
  wholesale_order_id: string | null;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  imported_by_user_id: string | null;
  created_at: string;
};

export type WholesaleLogisticsOrder = {
  id: string;
  batch_id: string | null;
  customer_id: string | null;
  wholesale_order_id: string | null;
  source_workflow_order_number: string | null;
  international_tracking_number: string;
  destination_tracking_number: string | null;
  freight_forwarder: string | null;
  latest_status: string | null;
  latest_checkpoint_at: string | null;
  logistics_fee: number;
  currency: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WholesaleCommission = {
  id: string;
  order_id: string;
  beneficiary_user_id: string | null;
  customer_id: string | null;
  order_payment_rmb_amount: number;
  gross_profit_rmb: number;
  commission_rate: number;
  commission_amount_rmb: number;
  status: "pending" | "settled" | "cancelled";
  calculated_at: string;
  settled_at: string | null;
  settled_by_user_id: string | null;
};

export type WholesaleReferral = {
  id: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  created_by_user_id: string | null;
  created_at: string;
};

export type WholesaleProfile = {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus | null;
  city: string | null;
  role: AppRole | null;
};

export type WholesalePageData = {
  currentUserId: string | null;
  currentRole: AppRole | null;
  customers: WholesaleCustomer[];
  exchangeRates: ExchangeRateRow[];
  orders: WholesaleOrder[];
  purchaseOrders: Wholesale1688Order[];
  logisticsOrders: WholesaleLogisticsOrder[];
  commissions: WholesaleCommission[];
  referrals: WholesaleReferral[];
  profiles: WholesaleProfile[];
  section: WorkspaceWholesaleSectionKey;
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function getWholesalePageData(
  supabase: SupabaseClient,
  section: WorkspaceWholesaleSectionKey,
): Promise<WholesalePageData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    customersResult,
    ordersResult,
    purchaseOrdersResult,
    logisticsOrdersResult,
    commissionsResult,
    referralsResult,
    profilesResult,
    roleRowsResult,
    rolesResult,
    linkCandidateProfilesResult,
    exchangeRates,
  ] = await Promise.all([
    supabase
      .from("wholesale_customers")
      .select("*")
      .order("created_at", { ascending: false }) as unknown as Promise<
      QueryResult<WholesaleCustomer>
    >,
    supabase
      .from("wholesale_orders")
      .select("*")
      .order("order_month", { ascending: false })
      .order("ordered_at", { ascending: false }) as unknown as Promise<
      QueryResult<WholesaleOrder>
    >,
    supabase
      .from("wholesale_1688_orders")
      .select("*")
      .order("created_at", { ascending: false }) as unknown as Promise<
      QueryResult<Wholesale1688Order>
    >,
    supabase
      .from("wholesale_logistics_orders")
      .select("*")
      .order("updated_at", { ascending: false }) as unknown as Promise<
      QueryResult<WholesaleLogisticsOrder>
    >,
    supabase
      .from("wholesale_commissions")
      .select("*")
      .order("calculated_at", { ascending: false }) as unknown as Promise<
      QueryResult<WholesaleCommission>
    >,
    supabase
      .from("wholesale_referrals")
      .select("*")
      .order("created_at", { ascending: false }) as unknown as Promise<
      QueryResult<WholesaleReferral>
    >,
    supabase
      .from("user_profiles")
      .select("user_id,name,email,phone,status,city")
      .order("created_at", { ascending: false }) as unknown as Promise<
      QueryResult<Omit<WholesaleProfile, "role">>
    >,
    supabase.from("user_roles_data").select("user_id,role_id") as unknown as Promise<
      QueryResult<{ user_id: string; role_id: string }>
    >,
    supabase.from("user_roles").select("id,role") as unknown as Promise<
      QueryResult<{ id: string; role: AppRole }>
    >,
    supabase.rpc("list_wholesale_customer_link_candidates") as unknown as Promise<
      QueryResult<WholesaleProfile>
    >,
    getLatestCnyExchangeRates(supabase).catch(() => []),
  ]);

  const rolesById = new Map(
    readRows(rolesResult).map((roleRow) => [roleRow.id, roleRow.role]),
  );
  const roleByUserId = new Map(
    readRows(roleRowsResult).map((roleRow) => [
      roleRow.user_id,
      rolesById.get(roleRow.role_id) ?? null,
    ]),
  );
  const visibleProfiles = readRows(profilesResult).map((profile) => ({
    ...profile,
    role: roleByUserId.get(profile.user_id) ?? null,
  }));
  const profilesByUserId = new Map(
    visibleProfiles.map((profile) => [profile.user_id, profile]),
  );

  for (const profile of readRows(linkCandidateProfilesResult)) {
    profilesByUserId.set(profile.user_id, profile);
  }

  const profiles = Array.from(profilesByUserId.values());

  return {
    currentRole: user ? getAppRoleFromMetadataContainer(user) : null,
    currentUserId: user?.id ?? null,
    customers: readRows(customersResult),
    exchangeRates,
    orders: readRows(ordersResult),
    purchaseOrders: readRows(purchaseOrdersResult),
    logisticsOrders: readRows(logisticsOrdersResult),
    commissions: readRows(commissionsResult),
    referrals: readRows(referralsResult),
    profiles,
    section,
  };
}

function readRows<T>(result: QueryResult<T>) {
  if (result.error) {
    return [];
  }

  return result.data ?? [];
}
