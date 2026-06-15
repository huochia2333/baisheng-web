import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getOrderDiscountTypeOptions,
  getServiceFeeTypeOptions,
  getServiceOrderPriceOptions,
  getServiceOrderTypeOptions,
  type OrderDiscountTypeOption,
  type ServiceOrderPriceOption,
  type ServiceOrderTypeOption,
} from "./admin-orders";
import {
  getCommissionRuleSettings,
  type CommissionRuleSetting,
} from "./commission-settings";
import {
  getExchangeRatesPageData,
  type ExchangeRatesPageData,
} from "./exchange-rates";
import type { ServiceFeeTypeOption } from "./service-fee-types";
import { getCurrentSessionContext } from "./user-self-service";

export type AdminSystemSettingsPageData = {
  canManageCommissionSettings: boolean;
  commissionRuleSettings: CommissionRuleSetting[];
  exchangeRates: ExchangeRatesPageData;
  hasPermission: boolean;
  orderDiscountOptions: OrderDiscountTypeOption[];
  serviceFeeTypeOptions: ServiceFeeTypeOption[];
  serviceOrderPriceOptions: ServiceOrderPriceOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
};

export async function getAdminSystemSettingsPageData(
  supabase: SupabaseClient,
): Promise<AdminSystemSettingsPageData> {
  const { user, role, status } = await getCurrentSessionContext(supabase);

  if (!user || role !== "administrator" || status !== "active") {
    return createEmptyAdminSystemSettingsPageData();
  }

  const [
    serviceFeeTypeOptions,
    serviceOrderTypeOptions,
    serviceOrderPriceOptions,
    orderDiscountOptions,
    commissionRuleSettings,
    exchangeRates,
  ] = await Promise.all([
    getServiceFeeTypeOptions(supabase),
    getServiceOrderTypeOptions(supabase),
    getServiceOrderPriceOptions(supabase),
    getOrderDiscountTypeOptions(supabase),
    getCommissionRuleSettings(supabase),
    getExchangeRatesPageData(supabase, "manage"),
  ]);

  return {
    canManageCommissionSettings: true,
    commissionRuleSettings,
    exchangeRates,
    hasPermission: true,
    orderDiscountOptions,
    serviceFeeTypeOptions,
    serviceOrderPriceOptions,
    serviceOrderTypeOptions,
  };
}

function createEmptyAdminSystemSettingsPageData(): AdminSystemSettingsPageData {
  return {
    canManageCommissionSettings: false,
    commissionRuleSettings: [],
    exchangeRates: {
      hasPermission: false,
      rates: [],
      syncState: null,
    },
    hasPermission: false,
    orderDiscountOptions: [],
    serviceFeeTypeOptions: [],
    serviceOrderPriceOptions: [],
    serviceOrderTypeOptions: [],
  };
}
