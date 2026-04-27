"use client";

import {
  BadgeCheck,
  Copy,
  KeyRound,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

import type { CurrentUserBundle } from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import {
  EmptyState,
  LoadingState,
  PageBanner,
  statusBadgeClass,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import { useDashboardMyCopy } from "./dashboard-shared-my-copy";
import { DashboardSharedMyDialogs } from "./dashboard-shared-my-dialogs";
import { useDashboardSharedMyState } from "./use-dashboard-shared-my-state";

type DashboardSharedMyClientProps = {
  initialData?: CurrentUserBundle | null;
};

export function DashboardSharedMyClient({
  initialData = null,
}: DashboardSharedMyClientProps) {
  const copy = useDashboardMyCopy();
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
    ui,
    videoInputRef,
  } = useDashboardSharedMyState(initialData);

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
          <LegalFooterLinks className="gap-6" copy={copy} />
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

      <DashboardSharedMyDialogs
        copy={copy}
        state={{ assetDialog, identity, passport, profileDialog, ui }}
      />
    </>
  );
}
