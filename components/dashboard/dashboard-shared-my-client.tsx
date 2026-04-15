"use client";

import {
  BadgeCheck,
  Copy,
  FileBadge2,
  KeyRound,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import {
  EmptyState,
  formatFileSize,
  InputCard,
  LoadingState,
  PageBanner,
  StatusChip,
  statusBadgeClass,
  StatusNotice,
  ValueCard,
} from "./dashboard-shared-ui";
import { DashboardDialog } from "./dashboard-dialog";
import { Button } from "../ui/button";
import { useDashboardSharedMyState } from "./dashboard-shared-my/use-dashboard-shared-my-state";

export function DashboardSharedMyClient() {
  const t = useTranslations("DashboardMy");
  const copy = {
    bundleUnavailable: t("bundleUnavailable"),
    bundleSyncDescription: t("bundleSyncDescription"),
    bundleSyncTitle: t("bundleSyncTitle"),
    retrySync: t("retrySync"),
    editProfile: t("editProfile"),
    changePassword: t("changePassword"),
    copyInviteCode: t("copyInviteCode"),
    refreshProfile: t("refreshProfile"),
    verificationTitle: t("verificationTitle"),
    verificationApproved: t("verificationApproved"),
    verificationPending: t("verificationPending"),
    verificationEmpty: t("verificationEmpty"),
    verificationApprovedDescription: t("verificationApprovedDescription"),
    verificationPendingDescription: t("verificationPendingDescription"),
    verificationEmptyDescription: t("verificationEmptyDescription"),
    identityMediaTitle: t("identityMediaTitle"),
    copyright: t("copyright"),
    privacy: t("privacy"),
    terms: t("terms"),
    help: t("help"),
    identitySubmit: t("identitySubmit"),
    identityLabel: t("identityLabel"),
    identityPlaceholder: t("identityPlaceholder"),
    identityPendingDescription: t("identityPendingDescription"),
    identityApprovedDescription: t("identityApprovedDescription"),
    retryEdit: t("retryEdit"),
    passportSubmit: t("passportSubmit"),
    passportLabel: t("passportLabel"),
    passportPlaceholder: t("passportPlaceholder"),
    passportPendingDescription: t("passportPendingDescription"),
    passportApprovedDescription: t("passportApprovedDescription"),
    previewUnavailable: t("previewUnavailable"),
    photoItem: (index: number) => t("photoItem", { index }),
    delete: t("delete"),
    photoEmptyTitle: t("photoEmptyTitle"),
    photoEmptyDescription: t("photoEmptyDescription"),
    photoPendingDescription: t("photoPendingDescription"),
    photoApprovedDescription: t("photoApprovedDescription"),
    videoEmptyTitle: t("videoEmptyTitle"),
    videoEmptyDescription: t("videoEmptyDescription"),
    videoPendingDescription: t("videoPendingDescription"),
    videoApprovedDescription: t("videoApprovedDescription"),
    editProfileDescription: t("editProfileDescription"),
    cityLabel: t("cityLabel"),
    cityPlaceholder: t("cityPlaceholder"),
    saveCity: t("saveCity"),
  };
  const {
    account,
    assetDialog,
    bundle,
    identity,
    loading,
    page,
    passport,
    photoInputRef,
    profileDialog,
    supabase,
    ui,
    videoInputRef,
  } = useDashboardSharedMyState();

  if (!supabase) {
    return <LoadingState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!bundle) {
    return (
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
        <PageBanner tone="error">
          {page.error ?? copy.bundleUnavailable}
        </PageBanner>
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={copy.bundleSyncDescription}
            icon={<Search className="size-6" />}
            title={copy.bundleSyncTitle}
          />
          <div className="mt-6 flex justify-center">
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={ui.busyKey !== null}
              onClick={page.recoverCloudSync}
            >
              {ui.busyKey === "refresh" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {copy.retrySync}
            </Button>
          </div>
        </section>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        {page.error ? (
          <PageBanner tone="error">{page.error}</PageBanner>
        ) : page.notice ? (
          <PageBanner tone={page.notice.tone}>{page.notice.message}</PageBanner>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:col-span-9 xl:p-8">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-[#dff0e4] px-3 py-1 text-xs font-semibold text-[#487155]">
                  {account.membershipLabel}
                </span>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
                  {account.displayName}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#66727d]">
                  <MapPin className="size-4" />
                  {account.displayCity}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  disabled={ui.busyKey !== null}
                  onClick={profileDialog.openDialog}
                  variant="outline"
                >
                  <MapPin className="size-4" />
                  {copy.editProfile}
                </Button>
                <Button
                  className="h-12 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={ui.busyKey !== null}
                  onClick={() => void account.sendPasswordReset()}
                >
                  {ui.busyKey === "password" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  {copy.changePassword}
                </Button>
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  onClick={() => void account.copyInviteCode()}
                  variant="outline"
                >
                  <Copy className="size-4" />
                  {copy.copyInviteCode}
                </Button>
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  disabled={ui.busyKey !== null}
                  onClick={() => void page.refreshBundle({ quiet: false })}
                  variant="outline"
                >
                  {ui.busyKey === "refresh" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {copy.refreshProfile}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
              {account.profileStats.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="font-label text-[11px] font-semibold tracking-[0.22em] text-[#7d8890] uppercase">
                    {item.label}
                  </p>
                  {"accent" in item && item.accent === "success" ? (
                    <p className="flex items-center gap-2 text-lg font-medium text-[#4c7259]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4c7259]" />
                      {item.value}
                    </p>
                  ) : (
                    <p
                      className={cn(
                        "text-lg font-medium text-[#486782]",
                        "mono" in item && item.mono && "tracking-[0.18em]",
                      )}
                    >
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <aside className="xl:col-span-3">
            <section
              className={cn(
                "rounded-[24px] border p-6 shadow-[0_12px_30px_rgba(96,113,128,0.06)]",
                account.certified
                  ? "border-[#d9e8dc] bg-[#edf5ef]"
                  : account.verificationStatus === "pending"
                    ? "border-[#ecdcb1] bg-[#fbf5e6]"
                    : "border-[#ebdfd2] bg-[#fbf6ef]",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-white",
                    account.certified
                      ? "bg-[#4c7259]"
                      : account.verificationStatus === "pending"
                        ? "bg-[#b7892f]"
                        : "bg-[#b07a4f]",
                  )}
                >
                  {account.certified ? (
                    <BadgeCheck className="size-5" />
                  ) : account.verificationStatus === "pending" ? (
                    <ShieldAlert className="size-5" />
                  ) : (
                    <ShieldAlert className="size-5" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      account.certified
                        ? "text-[#4c7259]"
                        : account.verificationStatus === "pending"
                          ? "text-[#87631e]"
                          : "text-[#8b6240]",
                    )}
                  >
                    {copy.verificationTitle}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-bold",
                      account.certified
                        ? "text-[#355443]"
                        : account.verificationStatus === "pending"
                          ? "text-[#6f5318]"
                          : "text-[#704d31]",
                    )}
                  >
                    {account.certified
                      ? copy.verificationApproved
                      : account.verificationStatus === "pending"
                        ? copy.verificationPending
                        : copy.verificationEmpty}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#6e7780]">
                {account.certified
                  ? copy.verificationApprovedDescription
                  : account.verificationStatus === "pending"
                    ? copy.verificationPendingDescription
                    : copy.verificationEmptyDescription}
              </p>
            </section>
          </aside>
        </div>

        <section className="rounded-[28px] border border-white/85 bg-white/68 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e6edf2] text-[#486782]">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#486782]">
                {copy.identityMediaTitle}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {assetDialog.assets.map((asset) => (
              <button
                key={asset.key}
                className="group rounded-[24px] border border-[#efede9] bg-white p-4 text-left shadow-[0_10px_24px_rgba(96,113,128,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(96,113,128,0.12)] active:scale-[0.985]"
                onClick={() => assetDialog.openDialog(asset.key)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2b3942]">
                      {asset.title}
                    </p>
                  </div>
                  <span className={statusBadgeClass(asset.tone)}>{asset.status}</span>
                </div>
                <div className="relative mt-4 aspect-[1.58/1] overflow-hidden rounded-[18px] bg-[#ece9e4]">
                  {asset.body}
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(72,103,130,0.18)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#486782]">
                      <Search className="size-5" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[#e4e2de] px-1 pt-8 text-xs text-[#8a949b] sm:flex-row sm:items-center sm:justify-between">
            <p>{copy.copyright}</p>
          <div className="flex items-center gap-6">
            <a className="transition-colors hover:text-[#486782]" href="#">
              {copy.privacy}
            </a>
            <a className="transition-colors hover:text-[#486782]" href="#">
              {copy.terms}
            </a>
            <a className="transition-colors hover:text-[#486782]" href="#">
              {copy.help}
            </a>
          </div>
        </footer>
      </section>

      <input
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            void assetDialog.uploadPhotos(files);
          }
        }}
        type="file"
      />
      <input
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            void assetDialog.uploadVideos(files);
          }
        }}
        type="file"
      />

      <DashboardDialog
        actions={assetDialog.actions}
        description={assetDialog.description}
        onOpenChange={assetDialog.close}
        open={assetDialog.activeDialog !== null}
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
                      {photo.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={photo.original_name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={photo.previewUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#7d8890]">
                          {copy.previewUnavailable}
                        </div>
                      )}
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
                      {video.previewUrl ? (
                        <video
                          className="aspect-video w-full bg-[#172029] object-cover"
                          controls
                          preload="metadata"
                          src={video.previewUrl}
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-white/72">
                          {copy.previewUnavailable}
                        </div>
                      )}
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

      <DashboardDialog
        description={copy.editProfileDescription}
        onOpenChange={profileDialog.close}
        open={profileDialog.open}
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
    </>
  );
}
