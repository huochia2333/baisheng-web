"use client";

import {
  ClipboardList,
  FileBadge2,
  ImageIcon,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminReviewsPageData } from "@/lib/admin-reviews";

import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import { EmptyState, PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import { PrivacyReviewList } from "./admin-reviews-ui";
import { MediaPreviewDialog, MediaReviewList } from "./media-review-list";
import { ProfileChangeReviewList } from "./profile-change-review-list";
import { TaskReviewList } from "./task-review-list";
import { useAdminReviewsPage } from "./use-admin-reviews-page";

const reviewTabIconMap = {
  media: ImageIcon,
  profile: UserRound,
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
    handleProfileChangeReview,
    handlePrivacyReview,
    handleTaskReview,
    hasPermission,
    mediaRows,
    pageFeedback,
    previewAsset,
    profileRows,
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
            accent: "green",
            icon: <UserRound className="size-5" />,
            key: "profile",
            label: t("summary.profile"),
            value: profileRows.length,
          },
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
        metricsClassName="sm:grid-cols-2 xl:grid-cols-4"
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
          <DashboardSegmentedTabs
            onChange={setActiveTab}
            options={reviewTabs.map((tab) => {
              const Icon = reviewTabIconMap[tab.key];

              return {
                badge: tab.count,
                icon: <Icon className="size-4" />,
                key: tab.key,
                label: tab.label,
              };
            })}
            value={activeTab}
          />

          <div className="mt-6">
            {activeTab === "profile" ? (
              <ProfileChangeReviewList
                busyRows={busyRows}
                onAction={handleProfileChangeReview}
                rows={profileRows}
              />
            ) : null}

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
