"use client";

import type { ExchangeRatesPageData } from "@/lib/exchange-rates";
import type {
  OrderDiscountTypeOption,
  ServiceOrderPriceOption,
  ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import type { ServiceFeeTypeOption } from "@/lib/service-fee-types";

import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates/exchange-rates-client";

import { AdminOrdersServiceFeeSettings } from "./admin-orders-service-fee-settings";
import { AdminOrdersServiceOrderSettings } from "./admin-orders-service-order-settings";

export function AdminOrderSettingsClient({
  initialExchangeRatesData,
  initialOrderDiscounts,
  initialServiceFeeTypes,
  initialServiceOrderTypes,
  initialServicePriceOptions,
  onOrderDiscountsChange,
  onServiceFeeTypesChange,
  onServicePriceOptionsChange,
}: {
  initialExchangeRatesData: ExchangeRatesPageData;
  initialOrderDiscounts: OrderDiscountTypeOption[];
  initialServiceFeeTypes: ServiceFeeTypeOption[];
  initialServiceOrderTypes: ServiceOrderTypeOption[];
  initialServicePriceOptions: ServiceOrderPriceOption[];
  onOrderDiscountsChange?: (rows: OrderDiscountTypeOption[]) => void;
  onServiceFeeTypesChange?: (rows: ServiceFeeTypeOption[]) => void;
  onServicePriceOptionsChange?: (rows: ServiceOrderPriceOption[]) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <AdminOrdersServiceFeeSettings
        initialRows={initialServiceFeeTypes}
        onRowsChange={onServiceFeeTypesChange}
      />
      <AdminOrdersServiceOrderSettings
        initialDiscounts={initialOrderDiscounts}
        initialPrices={initialServicePriceOptions}
        serviceOrderTypes={initialServiceOrderTypes}
        onDiscountsChange={onOrderDiscountsChange}
        onPricesChange={onServicePriceOptionsChange}
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
