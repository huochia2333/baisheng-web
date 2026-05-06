"use client";

import { memo } from "react";

import { ArrowLeftRight, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";

export type AdminOrdersTab = "orders" | "exchange-rates";

type AdminOrdersTabsProps = {
  activeTab: AdminOrdersTab;
  onTabChange: (tab: AdminOrdersTab) => void;
  pendingTab?: AdminOrdersTab | null;
};

const tabs = [
  {
    icon: ReceiptText,
    key: "orders",
  },
  {
    icon: ArrowLeftRight,
    key: "exchange-rates",
  },
] as const;

export const AdminOrdersTabs = memo(function AdminOrdersTabs({
  activeTab,
  onTabChange,
  pendingTab = null,
}: AdminOrdersTabsProps) {
  const t = useTranslations("Orders");

  return (
    <DashboardSegmentedTabs
      className="sm:w-auto"
      onChange={onTabChange}
      options={tabs.map((tab) => {
        const Icon = tab.icon;

        return {
          icon: <Icon className="size-4" />,
          key: tab.key,
          label: t(`tabs.${tab.key}`),
        };
      })}
      pendingValue={pendingTab}
      value={activeTab}
    />
  );
});
