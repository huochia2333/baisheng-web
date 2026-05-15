import type { User } from "@supabase/supabase-js";

import type { DashboardPaginationState } from "./dashboard-pagination";
import type { ExchangeRateRow } from "./exchange-rates";
import type { AppRole, UserStatus } from "./user-self-service";

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

export type SaveAdminOrderInput = CreateAdminOrderInput & {
  originalOrderNumber?: string | null;
};

export type AdminOrderCostRow = {
  order_overview_id: string;
  cost_amount: number | string | null;
};

export type OrderOverviewReference = {
  id: string;
  order_number: string;
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
  todayExchangeRates: ExchangeRateRow[];
  totalOrdersCount: number;
  userOptions: OrderUserOption[];
};
