"use client";

import dynamic from "next/dynamic";
import {
  FileBadge2,
  LoaderCircle,
  MapPin,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import {
  LazyDashboardImagePreview,
  LazyDashboardVideoPreview,
} from "@/components/dashboard/dashboard-media-preview";
import {
  EmptyState,
  formatFileSize,
  InputCard,
  PageBanner,
  StatusChip,
  StatusNotice,
  ValueCard,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";

import type { DashboardMyCopy } from "./dashboard-shared-my-copy";
import type { DashboardSharedMyState } from "./use-dashboard-shared-my-state";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

type DashboardSharedMyDialogsProps = {
  copy: DashboardMyCopy;
  state: Pick<
    DashboardSharedMyState,
    "assetDialog" | "identity" | "passport" | "profileDialog" | "ui"
  >;
};

export function DashboardSharedMyDialogs({
  copy,
  state,
}: DashboardSharedMyDialogsProps) {
  const { assetDialog, identity, passport, profileDialog, ui } = state;

  return (
    <>
      {assetDialog.activeDialog !== null ? (
        <DashboardDialog
          actions={assetDialog.actions}
          description={assetDialog.description}
          onOpenChange={assetDialog.close}
          open
          title={assetDialog.title}
        >
          {assetDialog.notice ? (
            <div className="mb-5">
              <PageBanner tone={assetDialog.notice.tone}>{assetDialog.notice.message}</PageBanner>
            </div>
          ) : null}

          {assetDialog.activeDialog === "identity" ? (
            identity.status === "empty" || identity.editing ? (
              <InputCard
                actionLabel={copy.identitySubmit}
                busy={ui.busyKey === "identity"}
                icon={<FileBadge2 className="size-5" />}
                label={copy.identityLabel}
                onAction={() => void identity.submit()}
                onChange={identity.setDraft}
                placeholder={copy.identityPlaceholder}
                value={identity.draft}
              />
            ) : (
              <div className="space-y-5">
                <StatusNotice
                  description={
                    identity.status === "pending"
                      ? copy.identityPendingDescription
                      : copy.identityApprovedDescription
                  }
                  status={identity.status}
                />
                <ValueCard
                  icon={<FileBadge2 className="size-5" />}
                  label={copy.identityLabel}
                  value={identity.value}
                />
                {identity.status === "approved" ? (
                  <div className="flex justify-end">
                    <Button
                      className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                      onClick={() => {
                        identity.setEditing(true);
                        identity.setDraft(identity.value);
                      }}
                      variant="outline"
                    >
                      {copy.retryEdit}
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          ) : assetDialog.activeDialog === "passport" ? (
            passport.status === "empty" || passport.editing ? (
              <InputCard
                actionLabel={copy.passportSubmit}
                busy={ui.busyKey === "passport"}
                icon={<FileBadge2 className="size-5" />}
                label={copy.passportLabel}
                onAction={() => void passport.submit()}
                onChange={passport.setDraft}
                placeholder={copy.passportPlaceholder}
                value={passport.draft}
              />
            ) : (
              <div className="space-y-5">
                <StatusNotice
                  description={
                    passport.status === "pending"
                      ? copy.passportPendingDescription
                      : copy.passportApprovedDescription
                  }
                  status={passport.status}
                />
                <ValueCard
                  icon={<FileBadge2 className="size-5" />}
                  label={copy.passportLabel}
                  value={passport.value}
                />
                {passport.status === "approved" ? (
                  <div className="flex justify-end">
                    <Button
                      className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                      onClick={() => {
                        passport.setEditing(true);
                        passport.setDraft(passport.value);
                      }}
                      variant="outline"
                    >
                      {copy.retryEdit}
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          ) : assetDialog.activeDialog === "photos" ? (
            assetDialog.photoAssets.length ? (
              <div className="space-y-6">
                <StatusNotice
                  description={
                    assetDialog.photoStatus === "pending"
                      ? copy.photoPendingDescription
                      : copy.photoApprovedDescription
                  }
                  status={assetDialog.photoStatus}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {assetDialog.photoAssets.map((photo, index) => (
                    <article
                      key={photo.id}
                      className="rounded-[24px] border border-[#ebe7e1] bg-white p-3 shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
                    >
                      <div className="aspect-[4/5] overflow-hidden rounded-[18px] bg-[#ece9e4]">
                        <LazyDashboardImagePreview
                          alt={photo.original_name}
                          asset={photo}
                          className="h-full w-full"
                          errorFallback={
                            <div className="flex h-full items-center justify-center text-sm text-[#7d8890]">
                              {copy.previewUnavailable}
                            </div>
                          }
                          imageClassName="h-full w-full object-cover"
                          loadingFallback={<div className="h-full w-full animate-pulse bg-[#e7e3dd]" />}
                        />
                      </div>
                      <div className="mt-3 space-y-3 px-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2b3942]">
                              {copy.photoItem(index + 1)}
                            </p>
                            <p className="truncate text-xs text-[#7d8890]">
                              {photo.original_name}
                            </p>
                          </div>
                          <StatusChip status={photo.status} />
                        </div>
                        <button
                          className="inline-flex h-9 items-center gap-1 rounded-full bg-[#fceaea] px-3 text-xs font-medium text-[#c43d3d]"
                          disabled={ui.busyKey !== null}
                          onClick={() => void assetDialog.deletePhotoAssets([photo])}
                          type="button"
                        >
                          <Trash2 className="size-3.5" />
                          {copy.delete}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                description={copy.photoEmptyDescription}
                icon={<FileBadge2 className="size-6" />}
                title={copy.photoEmptyTitle}
              />
            )
          ) : assetDialog.activeDialog === "videos" ? (
            assetDialog.videoAssets.length ? (
              <div className="space-y-6">
                <StatusNotice
                  description={
                    assetDialog.videoStatus === "pending"
                      ? copy.videoPendingDescription
                      : copy.videoApprovedDescription
                  }
                  status={assetDialog.videoStatus}
                />
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {assetDialog.videoAssets.map((video) => (
                    <article
                      key={video.id}
                      className="rounded-[24px] border border-[#ebe7e1] bg-white p-3 shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
                    >
                      <div className="overflow-hidden rounded-[18px] bg-[#172029]">
                        <LazyDashboardVideoPreview
                          asset={video}
                          className="aspect-video w-full"
                          errorFallback={
                            <div className="flex aspect-video items-center justify-center text-sm text-white/72">
                              {copy.previewUnavailable}
                            </div>
                          }
                          loadingFallback={<div className="h-full w-full animate-pulse bg-white/8" />}
                          preload="metadata"
                          videoClassName="aspect-video w-full bg-[#172029] object-cover"
                        />
                      </div>
                      <div className="mt-3 space-y-3 px-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2b3942]">
                              {video.original_name}
                            </p>
                            <p className="truncate text-xs text-[#7d8890]">
                              {formatFileSize(video.file_size_bytes)}
                            </p>
                          </div>
                          <StatusChip status={video.status} />
                        </div>
                        <button
                          className="inline-flex h-9 items-center gap-1 rounded-full bg-[#fceaea] px-3 text-xs font-medium text-[#c43d3d]"
                          disabled={ui.busyKey !== null}
                          onClick={() => void assetDialog.deleteVideoAssets([video])}
                          type="button"
                        >
                          <Trash2 className="size-3.5" />
                          {copy.delete}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                description={copy.videoEmptyDescription}
                icon={<Video className="size-6" />}
                title={copy.videoEmptyTitle}
              />
            )
          ) : null}
        </DashboardDialog>
      ) : null}

      {profileDialog.open ? (
        <DashboardDialog
          description={copy.editProfileDescription}
          onOpenChange={profileDialog.close}
          open
          title={copy.editProfile}
        >
          {profileDialog.notice ? (
            <div className="mb-5">
              <PageBanner tone={profileDialog.notice.tone}>
                {profileDialog.notice.message}
              </PageBanner>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-[#ece8e1] bg-white p-6 shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
            <div className="flex items-center gap-3 text-[#486782]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef3f6]">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                  {copy.cityLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <input
                className="h-13 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                onChange={(event) => profileDialog.setCityDraft(event.target.value)}
                placeholder={copy.cityPlaceholder}
                value={profileDialog.cityDraft}
              />
              <div className="flex justify-end">
                <Button
                  className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={!profileDialog.cityDraft.trim() || ui.busyKey === "profile-save"}
                  onClick={() => void profileDialog.saveCity()}
                >
                  {ui.busyKey === "profile-save" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {copy.saveCity}
                </Button>
              </div>
            </div>
          </div>
        </DashboardDialog>
      ) : null}
    </>
  );
}
