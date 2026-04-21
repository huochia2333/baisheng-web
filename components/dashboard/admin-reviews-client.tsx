"use client";

import { FileBadge2, ImageIcon, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminReviewsPageData } from "@/lib/admin-reviews";
import { cn } from "@/lib/utils";

import { EmptyState, PageBanner } from "./dashboard-shared-ui";
import {
  MediaPreviewDialog,
  MediaReviewList,
  PrivacyReviewList,
  ReviewSummaryCard,
} from "./admin-reviews/admin-reviews-ui";
import { useAdminReviewsPage } from "./admin-reviews/use-admin-reviews-page";

const reviewTabIconMap = {
  media: ImageIcon,
  privacy: FileBadge2,
} as const;

export function AdminReviewsClient({ initialData }: { initialData: AdminReviewsPageData }) {
  const t = useTranslations("Reviews");
  const {
    activeTab,
    busyRows,
    closePreviewDialog,
    handleMediaReview,
    handlePrivacyReview,
    hasPermission,
    mediaRows,
    pageFeedback,
    previewAsset,
    privacyRows,
    reviewTabs,
    setActiveTab,
    setPreviewAsset,
  } = useAdminReviewsPage(initialData);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              {t("header.badge")}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              {t("header.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReviewSummaryCard
              accent="blue"
              count={privacyRows.length}
              icon={<FileBadge2 className="size-5" />}
              label={t("summary.privacy")}
            />
            <ReviewSummaryCard
              accent="green"
              count={mediaRows.length}
              icon={<ImageIcon className="size-5" />}
              label={t("summary.media")}
            />
          </div>
        </div>
      </section>

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
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
            ) : (
              <MediaReviewList
                busyRows={busyRows}
                onAction={handleMediaReview}
                onPreviewOpen={setPreviewAsset}
                rows={mediaRows}
              />
            )}
          </div>
        </section>
      )}

      <MediaPreviewDialog asset={previewAsset} onOpenChange={closePreviewDialog} />
    </section>
  );
}
