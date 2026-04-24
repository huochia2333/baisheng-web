"use client";

import { useEffect, useRef } from "react";
import { Download, Eye, ImageIcon, LoaderCircle, Play, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminTaskSubmissionMedia } from "@/lib/admin-task-submission-media";

import {
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { Button } from "@/components/ui/button";

type PreviewMedia = AdminTaskSubmissionMedia & {
  signedUrl: string;
};

export function AdminTaskSubmissionMediaPanel({
  busyMediaId,
  loading,
  media,
  onDownload,
  onPreview,
}: {
  busyMediaId: string | null;
  loading: boolean;
  media: AdminTaskSubmissionMedia[];
  onDownload: (media: AdminTaskSubmissionMedia) => void;
  onPreview: (media: AdminTaskSubmissionMedia) => void;
}) {
  const t = useTranslations("Tasks.admin.submissionMedia");

  return (
    <div className="rounded-[22px] border border-[#dfe8ee] bg-[#f7fbfc] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#486782]">{t("title")}</p>
          <p className="mt-1 text-xs leading-6 text-[#6f7b85]">{t("description")}</p>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#486782]">
          <ImageIcon className="size-3.5" />
          {t("count", { count: media.length })}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-[#e6ebef] bg-white px-4 py-3 text-sm text-[#60707d]">
          <LoaderCircle className="size-4 animate-spin" />
          {t("loading")}
        </div>
      ) : media.length === 0 ? (
        <p className="mt-4 rounded-[18px] border border-[#e6ebef] bg-white px-4 py-3 text-sm leading-7 text-[#6f7b85]">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {media.map((item) => {
            const busy = busyMediaId === item.id;

            return (
              <article
                className="min-w-0 rounded-[20px] border border-[#e6ebef] bg-white p-4"
                key={item.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eef3f6] text-[#486782]">
                    {item.kind === "video" ? (
                      <Video className="size-5" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#23313a]" title={item.original_name}>
                      {item.original_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6f7b85]">
                      <span>{item.kind === "video" ? t("video") : t("image")}</span>
                      <span>{formatFileSize(item.file_size_bytes)}</span>
                      <span>{t("round", { round: item.submission_round })}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#8a949c]">
                      {t("submittedAt", { time: formatDateTime(item.submitted_at) })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-xs text-[#486782] hover:bg-[#eef3f6]"
                    disabled={busy}
                    onClick={() => onPreview(item)}
                    type="button"
                  >
                    {busy ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {t("preview")}
                  </Button>
                  <Button
                    className="h-9 rounded-full bg-[#486782] px-3 text-xs text-white hover:bg-[#3e5f79]"
                    disabled={busy}
                    onClick={() => onDownload(item)}
                    type="button"
                  >
                    {busy ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    {t("download")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminTaskSubmissionMediaPreviewDialog({
  media,
  onDownload,
  onOpenChange,
}: {
  media: PreviewMedia | null;
  onDownload: (media: AdminTaskSubmissionMedia) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Tasks.admin.submissionMedia");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!media || media.kind !== "video") {
      return;
    }

    const player = videoRef.current;

    if (!player) {
      return;
    }

    player.currentTime = 0;

    void player.play().catch(() => {
      // Keep controls available when autoplay is blocked by the browser.
    });
  }, [media]);

  return (
    <DashboardDialog
      actions={
        media ? (
          <Button
            className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79]"
            onClick={() => onDownload(media)}
            type="button"
          >
            <Download className="size-4" />
            {t("download")}
          </Button>
        ) : null
      }
      description={
        media
          ? `${media.kind === "video" ? t("video") : t("image")} · ${formatFileSize(
              media.file_size_bytes,
            )}`
          : undefined
      }
      onOpenChange={onOpenChange}
      open={media !== null}
      title={media?.original_name ?? t("previewTitle")}
    >
      {media ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-[#111820]">
            {media.kind === "video" ? (
              <video
                ref={videoRef}
                autoPlay
                className="max-h-[72vh] w-full bg-black object-contain"
                controls
                playsInline
                preload="auto"
                src={media.signedUrl}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={media.original_name}
                className="max-h-[72vh] w-full object-contain"
                src={media.signedUrl}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#66727d]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3f6] px-3 py-1 font-medium text-[#486782]">
              {media.kind === "video" ? (
                <Play className="size-3.5" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
              {media.kind === "video" ? t("video") : t("image")}
            </span>
            <span>{t("round", { round: media.submission_round })}</span>
            <span>{t("submittedAt", { time: formatDateTime(media.submitted_at) })}</span>
          </div>
        </div>
      ) : null}
    </DashboardDialog>
  );
}
