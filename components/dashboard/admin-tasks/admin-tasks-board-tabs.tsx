"use client";

import { memo } from "react";

import { ClipboardCheck, ClipboardList, Images } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";

export type AdminTasksBoard = "tasks" | "reviews" | "mediaLibrary";

type AdminTasksBoardTabsProps = {
  activeBoard: AdminTasksBoard;
  onBoardChange: (board: AdminTasksBoard) => void;
  pendingBoard?: AdminTasksBoard | null;
};

const boardTabs = [
  {
    icon: ClipboardList,
    key: "tasks",
  },
  {
    icon: ClipboardCheck,
    key: "reviews",
  },
  {
    icon: Images,
    key: "mediaLibrary",
  },
] as const;

export const AdminTasksBoardTabs = memo(function AdminTasksBoardTabs({
  activeBoard,
  onBoardChange,
  pendingBoard = null,
}: AdminTasksBoardTabsProps) {
  const t = useTranslations("Tasks.admin");

  return (
    <DashboardSegmentedTabs
      className="sm:w-auto"
      onChange={onBoardChange}
      options={boardTabs.map((tab) => {
        const Icon = tab.icon;

        return {
          icon: <Icon className="size-4" />,
          key: tab.key,
          label: t(`tabs.${tab.key}`),
        };
      })}
      pendingValue={pendingBoard}
      value={activeBoard}
    />
  );
});
