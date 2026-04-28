"use client";

import { LoaderCircle, RefreshCw, Search } from "lucide-react";

import type { CurrentUserBundle } from "@/lib/user-self-service";

import {
  EmptyState,
  LoadingState,
  PageBanner,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import { useDashboardMyCopy } from "./dashboard-shared-my-copy";
import { DashboardSharedMyDialogs } from "./dashboard-shared-my-dialogs";
import { DashboardSharedMySections } from "./dashboard-shared-my-sections";
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

        <DashboardSharedMySections
          copy={copy}
          state={{ account, assetDialog, page, profileDialog, ui }}
        />
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
