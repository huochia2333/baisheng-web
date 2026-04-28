"use client";

import { ClipboardList, FileBadge2, ImageIcon, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminReviewsPageData } from "@/lib/admin-reviews";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import { EmptyState, PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import {
  MediaPreviewDialog,
  MediaReviewList,
  PrivacyReviewList,
} from "./admin-reviews-ui";
import { TaskReviewList } from "./task-review-list";
import { useAdminReviewsPage } from "./use-admin-reviews-page";

const reviewTabIconMap = {
  media: ImageIcon,
  privacy: FileBadge2,
  task: ClipboardList,
} as const;

export function AdminReviewsClient({ initialData }: { initialData: AdminReviewsPageData }) {
  const t = useTranslations("Reviews");
  const {
    activeTab,
    assetBusyKey,
    busyRows,
    closePreviewDialog,
    handleMediaReview,
    handleOpenTaskReviewAsset,
    handlePrivacyReview,
    handleTaskReview,
    hasPermission,
    mediaRows,
    pageFeedback,
    previewAsset,
    privacyRows,
    reviewTabs,
    setActiveTab,
    setPreviewAsset,
    taskRows,
  } = useAdminReviewsPage(initialData);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <DashboardSectionHeader
        badge={t("header.badge")}
        contentClassName="max-w-2xl"
        metrics={[
          {
            accent: "blue",
            icon: <FileBadge2 className="size-5" />,
            key: "privacy",
            label: t("summary.privacy"),
            value: privacyRows.length,
          },
          {
            accent: "green",
            icon: <ImageIcon className="size-5" />,
            key: "media",
            label: t("summary.media"),
            value: mediaRows.length,
          },
          {
            accent: "blue",
            icon: <ClipboardList className="size-5" />,
            key: "task",
            label: t("summary.task"),
            value: taskRows.length,
          },
        ]}
        metricsClassName="sm:grid-cols-2 xl:grid-cols-3"
        title={t("header.title")}
      />

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : (
        <DashboardListSection className="p-4 sm:p-6 xl:p-8">
          <div className="flex flex-wrap gap-3 border-b border-[#e7e3dc] pb-5">
            {reviewTabs.map((tab) => {
              const Icon = reviewTabIconMap[tab.key];
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#486782] text-white shadow-[0_12px_24px_rgba(72,103,130,0.2)]"
                      : "bg-[#f4f3f1] text-[#486782] hover:bg-[#e9edf0]",
                  )}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  <Icon className="size-4.5" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
                      isActive ? "bg-white/18 text-white" : "bg-white text-[#486782]",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {activeTab === "privacy" ? (
              <PrivacyReviewList
                busyRows={busyRows}
                onAction={handlePrivacyReview}
                rows={privacyRows}
              />
            ) : null}

            {activeTab === "media" ? (
              <MediaReviewList
                busyRows={busyRows}
                onAction={handleMediaReview}
                onPreviewOpen={setPreviewAsset}
                rows={mediaRows}
              />
            ) : null}

            {activeTab === "task" ? (
              <TaskReviewList
                assetBusyKey={assetBusyKey}
                busyRows={busyRows}
                onAction={handleTaskReview}
                onOpenAsset={(submissionId, asset) =>
                  void handleOpenTaskReviewAsset(submissionId, asset)
                }
                rows={taskRows}
              />
            ) : null}
          </div>
        </DashboardListSection>
      )}

      <MediaPreviewDialog asset={previewAsset} onOpenChange={closePreviewDialog} />
    </section>
  );
}
