"use client";

import { useMemo, useState } from "react";

import {
  ArrowLeftRight,
  Building2,
  Settings,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminSystemSettingsPageData } from "@/lib/admin-system-settings";
import type { CommissionRuleCode } from "@/lib/commission-settings";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";
import { AdminOrdersServiceFeeSettings } from "@/components/dashboard/admin-orders/admin-orders-service-fee-settings";
import { AdminOrdersServiceOrderSettings } from "@/components/dashboard/admin-orders/admin-orders-service-order-settings";
import { AdminCommissionSettingsSection } from "@/components/dashboard/commission/admin-commission-settings-section";
import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates/exchange-rates-client";

type SettingsPanel = "exchangeRates" | "tourism" | "wholesale";

const TOURISM_COMMISSION_RULE_CODES = [
  "service_escort_salesman",
  "digital_survival_salesman",
  "service_referral_rate",
  "vip_first_year_referral_bonus",
] as const satisfies readonly CommissionRuleCode[];

const WHOLESALE_COMMISSION_RULE_CODES = [
  "purchase_salesman_tier",
  "purchase_referral_rate",
] as const satisfies readonly CommissionRuleCode[];

export function AdminSystemSettingsClient({
  initialData,
}: {
  initialData: AdminSystemSettingsPageData;
}) {
  const t = useTranslations("SystemSettings");
  const [activePanel, setActivePanel] = useState<SettingsPanel>("tourism");
  const [serviceFeeTypeOptions, setServiceFeeTypeOptions] = useState(
    initialData.serviceFeeTypeOptions,
  );
  const [serviceOrderPriceOptions, setServiceOrderPriceOptions] = useState(
    initialData.serviceOrderPriceOptions,
  );
  const [orderDiscountOptions, setOrderDiscountOptions] = useState(
    initialData.orderDiscountOptions,
  );
  const [commissionRuleSettings, setCommissionRuleSettings] = useState(
    initialData.commissionRuleSettings,
  );
  const tabOptions = useMemo(
    () => [
      {
        description: t("tabs.tourism.description"),
        icon: <ShoppingCart className="size-4" />,
        key: "tourism" as const,
        label: t("tabs.tourism.title"),
      },
      {
        description: t("tabs.wholesale.description"),
        icon: <Building2 className="size-4" />,
        key: "wholesale" as const,
        label: t("tabs.wholesale.title"),
      },
      {
        description: t("tabs.exchangeRates.description"),
        icon: <ArrowLeftRight className="size-4" />,
        key: "exchangeRates" as const,
        label: t("tabs.exchangeRates.title"),
      },
    ],
    [t],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      <DashboardSectionHeader
        badge={t("header.badge")}
        badgeIcon={<Settings className="size-3.5" />}
        contentClassName="max-w-3xl"
        description={t("header.description")}
        title={t("header.title")}
      />

      {!initialData.hasPermission ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : (
        <>
          <DashboardSegmentedTabs
            onChange={setActivePanel}
            options={tabOptions}
            value={activePanel}
          />

          {activePanel === "tourism" ? (
            <div className="flex flex-col gap-8">
              <AdminOrdersServiceFeeSettings
                commissionRuleSettings={commissionRuleSettings}
                initialRows={serviceFeeTypeOptions}
                onRowsChange={setServiceFeeTypeOptions}
              />
              <AdminOrdersServiceOrderSettings
                initialDiscounts={orderDiscountOptions}
                initialPrices={serviceOrderPriceOptions}
                serviceOrderTypes={initialData.serviceOrderTypeOptions}
                onDiscountsChange={setOrderDiscountOptions}
                onPricesChange={setServiceOrderPriceOptions}
              />
              <AdminCommissionSettingsSection
                canManageSettings={initialData.canManageCommissionSettings}
                onRowsChange={setCommissionRuleSettings}
                rows={commissionRuleSettings}
                ruleCodes={TOURISM_COMMISSION_RULE_CODES}
              />
            </div>
          ) : activePanel === "wholesale" ? (
            <div className="flex flex-col gap-8">
              <AdminCommissionSettingsSection
                canManageSettings={initialData.canManageCommissionSettings}
                onRowsChange={setCommissionRuleSettings}
                rows={commissionRuleSettings}
                ruleCodes={WHOLESALE_COMMISSION_RULE_CODES}
              />
            </div>
          ) : activePanel === "exchangeRates" ? (
            <ExchangeRatesClient
              embedded
              homeHref="/admin/home"
              initialData={initialData.exchangeRates}
              mode="manage"
            />
          ) : null}
        </>
      )}
    </section>
  );
}
