"use client";

import { useMemo, useState } from "react";

import {
  ArrowLeftRight,
  Building2,
  Puzzle,
  Settings,
  ShieldAlert,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminSystemSettingsPageData } from "@/lib/admin-system-settings";
import {
  getWorkspaceBusinessSettingsModule,
  getWorkspaceBusinessSettingsModules,
  type WorkspaceBusinessKey,
  type WorkspaceBusinessSettingsModule,
} from "@/lib/workspace-business-modules";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";
import { AdminOrdersServiceFeeSettings } from "@/components/dashboard/admin-orders/admin-orders-service-fee-settings";
import { AdminOrdersServiceOrderSettings } from "@/components/dashboard/admin-orders/admin-orders-service-order-settings";
import { AdminCommissionSettingsSection } from "@/components/dashboard/commission/admin-commission-settings-section";
import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates/exchange-rates-client";

type SettingsPanel = WorkspaceBusinessKey | "exchangeRates";

const businessSettingsModules = getWorkspaceBusinessSettingsModules();

const BUSINESS_SETTINGS_ICON_BY_KEY: Partial<
  Record<WorkspaceBusinessKey, LucideIcon>
> = {
  tourism: ShoppingCart,
  wholesale: Building2,
};

export function AdminSystemSettingsClient({
  initialData,
}: {
  initialData: AdminSystemSettingsPageData;
}) {
  const t = useTranslations("SystemSettings");
  const [activePanel, setActivePanel] = useState<SettingsPanel>(
    businessSettingsModules[0]?.business ?? "exchangeRates",
  );
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
      ...businessSettingsModules.map((module) => ({
        description: t(module.descriptionKey),
        icon: getBusinessSettingsIcon(module.business),
        key: module.business,
        label: t(module.titleKey),
      })),
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

          {activePanel === "exchangeRates" ? (
            <ExchangeRatesClient
              embedded
              homeHref="/admin/home"
              initialData={initialData.exchangeRates}
              mode="manage"
            />
          ) : (
            <BusinessSettingsPanel
              canManageCommissionSettings={initialData.canManageCommissionSettings}
              commissionRuleSettings={commissionRuleSettings}
              module={getWorkspaceBusinessSettingsModule(activePanel)}
              onCommissionRuleRowsChange={setCommissionRuleSettings}
              onOrderDiscountRowsChange={setOrderDiscountOptions}
              onServiceFeeRowsChange={setServiceFeeTypeOptions}
              onServiceOrderPriceRowsChange={setServiceOrderPriceOptions}
              orderDiscountOptions={orderDiscountOptions}
              serviceFeeTypeOptions={serviceFeeTypeOptions}
              serviceOrderPriceOptions={serviceOrderPriceOptions}
              serviceOrderTypeOptions={initialData.serviceOrderTypeOptions}
            />
          )}
        </>
      )}
    </section>
  );
}

function BusinessSettingsPanel({
  canManageCommissionSettings,
  commissionRuleSettings,
  module,
  onCommissionRuleRowsChange,
  onOrderDiscountRowsChange,
  onServiceFeeRowsChange,
  onServiceOrderPriceRowsChange,
  orderDiscountOptions,
  serviceFeeTypeOptions,
  serviceOrderPriceOptions,
  serviceOrderTypeOptions,
}: {
  canManageCommissionSettings: AdminSystemSettingsPageData["canManageCommissionSettings"];
  commissionRuleSettings: AdminSystemSettingsPageData["commissionRuleSettings"];
  module: WorkspaceBusinessSettingsModule | undefined;
  onCommissionRuleRowsChange: (
    rows: AdminSystemSettingsPageData["commissionRuleSettings"],
  ) => void;
  onOrderDiscountRowsChange: (
    rows: AdminSystemSettingsPageData["orderDiscountOptions"],
  ) => void;
  onServiceFeeRowsChange: (
    rows: AdminSystemSettingsPageData["serviceFeeTypeOptions"],
  ) => void;
  onServiceOrderPriceRowsChange: (
    rows: AdminSystemSettingsPageData["serviceOrderPriceOptions"],
  ) => void;
  orderDiscountOptions: AdminSystemSettingsPageData["orderDiscountOptions"];
  serviceFeeTypeOptions: AdminSystemSettingsPageData["serviceFeeTypeOptions"];
  serviceOrderPriceOptions: AdminSystemSettingsPageData["serviceOrderPriceOptions"];
  serviceOrderTypeOptions: AdminSystemSettingsPageData["serviceOrderTypeOptions"];
}) {
  if (!module) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      {module.sections.map((section) => {
        if (section.kind === "tourismServiceFees") {
          return (
            <AdminOrdersServiceFeeSettings
              commissionRuleSettings={commissionRuleSettings}
              initialRows={serviceFeeTypeOptions}
              key={section.kind}
              onRowsChange={onServiceFeeRowsChange}
            />
          );
        }

        if (section.kind === "tourismServiceOrders") {
          return (
            <AdminOrdersServiceOrderSettings
              initialDiscounts={orderDiscountOptions}
              initialPrices={serviceOrderPriceOptions}
              key={section.kind}
              serviceOrderTypes={serviceOrderTypeOptions}
              onDiscountsChange={onOrderDiscountRowsChange}
              onPricesChange={onServiceOrderPriceRowsChange}
            />
          );
        }

        return (
          <AdminCommissionSettingsSection
            canManageSettings={canManageCommissionSettings}
            key={`${section.kind}-${section.ruleCodes.join("-")}`}
            onRowsChange={onCommissionRuleRowsChange}
            rows={commissionRuleSettings}
            ruleCodes={section.ruleCodes}
          />
        );
      })}
    </div>
  );
}

function getBusinessSettingsIcon(business: WorkspaceBusinessKey) {
  const Icon = BUSINESS_SETTINGS_ICON_BY_KEY[business] ?? Puzzle;

  return <Icon className="size-4" />;
}
