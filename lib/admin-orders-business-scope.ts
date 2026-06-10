import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "./user-self-service";
import {
  getCurrentSalesmanBusinessBoards,
  getOrderCategoriesForSalesmanBusinessBoards,
} from "./salesman-business-access";
import { isSalesStaffRole } from "./sales-staff-roles";

type OrderTypeCategoryOption = {
  category: string;
  id: string;
};

export type AdminOrderBusinessScope = {
  canViewAssignedBoards: boolean;
  orderCategories: string[] | null;
};

export async function getAdminOrderBusinessScope(
  supabase: SupabaseClient,
  role: AppRole | null,
): Promise<AdminOrderBusinessScope> {
  if (!isSalesStaffRole(role)) {
    return {
      canViewAssignedBoards: true,
      orderCategories: null,
    };
  }

  const salesmanBusinessBoards = await getCurrentSalesmanBusinessBoards(supabase);
  const orderCategories =
    getOrderCategoriesForSalesmanBusinessBoards(salesmanBusinessBoards);

  return {
    canViewAssignedBoards: orderCategories.length > 0,
    orderCategories,
  };
}

export function filterOrderTypeOptionsForBusinessScope<
  TOption extends OrderTypeCategoryOption,
>(
  orderTypeOptions: TOption[],
  scope: AdminOrderBusinessScope,
): TOption[] {
  if (scope.orderCategories === null) {
    return orderTypeOptions;
  }

  return orderTypeOptions.filter((option) =>
    scope.orderCategories?.includes(option.category),
  );
}

export function getOrderTypeIdsForBusinessScope(
  orderTypeOptions: readonly OrderTypeCategoryOption[],
  scope: AdminOrderBusinessScope,
): string[] | null {
  if (scope.orderCategories === null) {
    return null;
  }

  return orderTypeOptions.map((option) => option.id);
}
