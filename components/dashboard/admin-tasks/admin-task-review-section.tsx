"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";

import { AdminTaskReviewList } from "./admin-task-review-list";
import type { AdminTaskReviewAction } from "./admin-task-review-types";
import type { useAdminTaskReviewBoard } from "./use-admin-task-review-board";

type AdminTaskReviewBoardState = ReturnType<typeof useAdminTaskReviewBoard>;

export function AdminTaskReviewSection({
  assetBusyKey,
  busyRows,
  canView,
  isRefreshing,
  onOpenAsset,
  onRefresh,
  onReviewAction,
  rows,
}: {
  assetBusyKey: AdminTaskReviewBoardState["assetBusyKey"];
  busyRows: Record<string, AdminTaskReviewAction>;
  canView: boolean;
  isRefreshing: boolean;
  onOpenAsset: AdminTaskReviewBoardState["handleOpenAsset"];
  onRefresh: () => void;
  onReviewAction: AdminTaskReviewBoardState["handleTaskReview"];
  rows: AdminTaskReviewBoardState["rows"];
}) {
  const t = useTranslations("Tasks.admin");

  if (!canView) {
    return (
      <DashboardListSection>
        <EmptyState
          description={t("reviewBoard.noPermissionDescription")}
          icon={<ShieldAlert className="size-6" />}
          title={t("reviewBoard.noPermissionTitle")}
        />
      </DashboardListSection>
    );
  }

  return (
    <DashboardListSection
      actions={
        <Button
          className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6]"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
          variant="outline"
        >
          <RefreshCw className={["size-4", isRefreshing ? "animate-spin" : ""].join(" ")} />
          {t("reviewBoard.refresh")}
        </Button>
      }
      description={t("reviewBoard.description")}
      eyebrow={t("reviewBoard.badge")}
      title={t("reviewBoard.title")}
    >
      <AdminTaskReviewList
            assetBusyKey={assetBusyKey}
            busyRows={busyRows}
            onAction={onReviewAction}
            onOpenAsset={(row, asset) => void onOpenAsset(row, asset)}
            rows={rows}
          />
    </DashboardListSection>
  );
}
