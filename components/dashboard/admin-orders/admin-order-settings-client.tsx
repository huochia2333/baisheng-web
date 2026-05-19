"use client";

import type { ExchangeRatesPageData } from "@/lib/exchange-rates";
import type { ServiceFeeTypeOption } from "@/lib/service-fee-types";

import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates/exchange-rates-client";

import { AdminOrdersServiceFeeSettings } from "./admin-orders-service-fee-settings";

export function AdminOrderSettingsClient({
  initialExchangeRatesData,
  initialServiceFeeTypes,
  onServiceFeeTypesChange,
}: {
  initialExchangeRatesData: ExchangeRatesPageData;
  initialServiceFeeTypes: ServiceFeeTypeOption[];
  onServiceFeeTypesChange?: (rows: ServiceFeeTypeOption[]) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <AdminOrdersServiceFeeSettings
        initialRows={initialServiceFeeTypes}
        onRowsChange={onServiceFeeTypesChange}
      />
      <ExchangeRatesClient
        embedded
        homeHref="/admin/orders"
        initialData={initialExchangeRatesData}
        mode="manage"
      />
    </div>
  );
}
