"use client";

import type { ReactNode } from "react";

import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";

type BoardOption<Key extends string> = {
  key: Key;
  title: string;
  description: string;
  meta: string;
  icon?: ReactNode;
};

export function CommissionBoardSwitch<Key extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<BoardOption<Key>>;
  value: Key;
  onChange: (value: Key) => void;
}) {
  return (
    <DashboardSegmentedTabs
      onChange={onChange}
      options={options.map((option) => ({
        badge: option.meta,
        description: option.description,
        icon: option.icon,
        key: option.key,
        label: option.title,
      }))}
      value={value}
    />
  );
}
