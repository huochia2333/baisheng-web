"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  Download,
  ExternalLink,
  File,
  FileText,
  ImageIcon,
  LoaderCircle,
  Play,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminTaskMediaLibraryKind } from "@/lib/admin-task-media-library";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  EmptyState,
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";

export type AdminTaskFilePreviewItem = {
  file_size_bytes: number;
  id: string;
  kind: AdminTaskMediaLibraryKind;
  mime_type: string;
  original_name: string;
  reviewed_at?: string | null;
  signedUrl: string;
  submitted_at?: string | null;
  submitted_by_name?: string | null;
  submission_round?: number;
  task_name?: string | null;
};

export function canPreviewTaskFile(kind: AdminTaskMediaLibraryKind) {
  return kind === "image" || kind === "video" || kind === "pdf";
}

export function AdminTaskFilePreviewDialog({
  downloadBusy,
  file,
  onDownload,
  onOpenChange,
}: {
  downloadBusy?: boolean;
  file: AdminTaskFilePreviewItem | null;
  onDownload: (file: AdminTaskFilePreviewItem) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Tasks.admin.filePreview");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file || file.kind !== "video") {
      return;
    }

    const player = videoRef.current;

    if (!player) {
      return;
    }

    player.currentTime = 0;

    void player.play().catch(() => {
      // Browser autoplay rules vary; controls are still available.
    });
  }, [file]);

  const description = file
    ? [
        getKindLabel(file.kind, t),
        formatFileSize(file.file_size_bytes),
        file.submission_round ? t("round", { round: file.submission_round }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <DashboardDialog
      actions={
        file ? (
          <>
            <Button
              className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6]"
              onClick={() => openSignedUrl(file.signedUrl)}
              type="button"
              variant="outline"
            >
              <ExternalLink className="size-4" />
              {t("openInNewTab")}
            </Button>
            <Button
              className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79]"
              disabled={downloadBusy}
              onClick={() => onDownload(file)}
              type="button"
            >
              {downloadBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t("download")}
            </Button>
          </>
        ) : null
      }
      description={description}
      onOpenChange={onOpenChange}
      open={file !== null}
      title={file?.original_name ?? t("title")}
    >
      {file ? (
        <div className="space-y-4">
          <PreviewSurface file={file} videoRef={videoRef} />

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#66727d]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3f6] px-3 py-1 font-medium text-[#486782]">
              {getKindIcon(file.kind)}
              {getKindLabel(file.kind, t)}
            </span>
            {file.task_name ? <span>{file.task_name}</span> : null}
            {file.submitted_by_name ? <span>{file.submitted_by_name}</span> : null}
            {file.submitted_at ? (
              <span>{t("submittedAt", { time: formatDateTime(file.submitted_at) })}</span>
            ) : null}
            {file.reviewed_at ? (
              <span>{t("reviewedAt", { time: formatDateTime(file.reviewed_at) })}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardDialog>
  );
}

function PreviewSurface({
  file,
  videoRef,
}: {
  file: AdminTaskFilePreviewItem;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const t = useTranslations("Tasks.admin.filePreview");

  if (file.kind === "image") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-[#111820]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={file.original_name}
          className="max-h-[72vh] w-full object-contain"
          src={file.signedUrl}
        />
      </div>
    );
  }

  if (file.kind === "video") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-[#111820]">
        <video
          ref={videoRef}
          autoPlay
          className="max-h-[72vh] w-full bg-black object-contain"
          controls
          playsInline
          preload="auto"
          src={file.signedUrl}
        />
      </div>
    );
  }

  if (file.kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white">
        <iframe
          className="h-[72vh] min-h-[420px] w-full"
          src={file.signedUrl}
          title={file.original_name}
        />
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[#dfe5ea] bg-white px-4 py-10">
      <EmptyState
        description={t("unsupportedDescription")}
        icon={<File className="size-6" />}
        title={t("unsupportedTitle")}
      />
    </div>
  );
}

function getKindIcon(kind: AdminTaskMediaLibraryKind) {
  if (kind === "image") {
    return <ImageIcon className="size-3.5" />;
  }

  if (kind === "video") {
    return <Play className="size-3.5" />;
  }

  if (kind === "pdf") {
    return <FileText className="size-3.5" />;
  }

  return <File className="size-3.5" />;
}

function getKindLabel(
  kind: AdminTaskMediaLibraryKind,
  t: ReturnType<typeof useTranslations>,
) {
  if (kind === "image") {
    return t("image");
  }

  if (kind === "video") {
    return t("video");
  }

  if (kind === "pdf") {
    return t("pdf");
  }

  return t("file");
}

function openSignedUrl(signedUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.open(signedUrl, "_blank", "noopener,noreferrer");
}
