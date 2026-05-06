"use client";

import { memo } from "react";

import { ArrowLeftRight, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type AdminOrdersTab = "orders" | "exchange-rates";

type AdminOrdersTabsProps = {
  activeTab: AdminOrdersTab;
  onTabChange: (tab: AdminOrdersTab) => void;
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
}: AdminOrdersTabsProps) {
  const t = useTranslations("Orders");

  return (
    <div className="inline-flex w-full rounded-full border border-[#dfe5ea] bg-white/75 p-1 shadow-[0_10px_24px_rgba(96,113,128,0.05)] sm:w-auto">
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors sm:flex-none",
              selected
                ? "bg-[#486782] text-white shadow-sm"
                : "text-[#52616d] hover:bg-[#f4f6f8] hover:text-[#23313a]",
            )}
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            type="button"
          >
            <Icon className="size-4" />
            {t(`tabs.${tab.key}`)}
          </button>
        );
      })}
    </div>
  );
});
