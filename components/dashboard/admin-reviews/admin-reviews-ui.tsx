"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { BadgeCheck, FileBadge2, ImageIcon, LoaderCircle, Play, Video, XCircle } from "lucide-react";

import {
  type PendingMediaReviewWithPreview,
  type PendingPrivacyReviewRow,
} from "@/lib/admin-reviews";
import { cn } from "@/lib/utils";

import { EmptyState, normalizeOptionalString } from "../dashboard-shared-ui";
import { DashboardDialog } from "../dashboard-dialog";
import { Button } from "../../ui/button";
import type { BusyAction } from "./types";

function ReviewLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载审核列表...
      </div>
    </div>
  );
}

function ReviewSummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green";
}) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue"
          ? "border-[#d9e3eb] bg-[#f4f8fb]"
          : "border-[#dce8df] bg-[#f2f7f3]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" ? "bg-[#486782]" : "bg-[#4c7259]",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
    </div>
  );
}

function PrivacyReviewList({
  rows,
  busyRows,
  onAction,
}: {
  rows: PendingPrivacyReviewRow[];
  busyRows: Record<string, BusyAction>;
  onAction: (row: PendingPrivacyReviewRow, action: BusyAction) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        description="当前没有待审核的身份证或护照资料，新的提交内容到达后会出现在这里。"
        icon={<FileBadge2 className="size-6" />}
        title="隐私审核队列为空"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_220px] gap-5 border-b border-[#efebe5] bg-[#f7f5f2] px-6 py-4 lg:grid">
        <ReviewHeaderCell>用户名</ReviewHeaderCell>
        <ReviewHeaderCell>邮箱</ReviewHeaderCell>
        <ReviewHeaderCell>身份证号</ReviewHeaderCell>
        <ReviewHeaderCell>护照号</ReviewHeaderCell>
        <ReviewHeaderCell className="text-right">操作</ReviewHeaderCell>
      </div>

      <div className="divide-y divide-[#efebe5]">
        {rows.map((row) => {
          const rowKey = `privacy:${row.request_id}`;
          const busyAction = busyRows[rowKey];
          const displayName = getDisplayName(row.name, row.email);
          const displayEmail = getDisplayEmail(row.email);

          return (
            <article
              key={row.request_id}
              className="grid gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_220px] lg:items-center lg:px-6"
            >
              <ReviewValueCell label="用户名" value={displayName} />
              <ReviewValueCell label="邮箱" value={displayEmail} />
              <ReviewValueCell
                label="身份证号"
                mono
                value={normalizeOptionalString(row.id_card_requests) ?? "-"}
              />
              <ReviewValueCell
                label="护照号"
                mono
                value={normalizeOptionalString(row.passport_requests) ?? "-"}
              />

              <div className="lg:justify-self-end">
                <ReviewActionGroup
                  busyAction={busyAction}
                  onApprove={() => void onAction(row, "approve")}
                  onReject={() => void onAction(row, "reject")}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MediaReviewList({
  rows,
  busyRows,
  onPreviewOpen,
  onAction,
}: {
  rows: PendingMediaReviewWithPreview[];
  busyRows: Record<string, BusyAction>;
  onPreviewOpen: (asset: PendingMediaReviewWithPreview) => void;
  onAction: (
    row: PendingMediaReviewWithPreview,
    action: BusyAction,
  ) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        description="当前没有待审核的个人照片或视频，新的媒体提交后会出现在这里。"
        icon={<ImageIcon className="size-6" />}
        title="媒体审核队列为空"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#ebe7e1] bg-white shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
      <div className="hidden grid-cols-[132px_minmax(0,1fr)_minmax(0,1fr)_220px] gap-5 border-b border-[#efebe5] bg-[#f7f5f2] px-6 py-4 lg:grid">
        <ReviewHeaderCell>媒体缩略图</ReviewHeaderCell>
        <ReviewHeaderCell>用户名</ReviewHeaderCell>
        <ReviewHeaderCell>邮箱</ReviewHeaderCell>
        <ReviewHeaderCell className="text-right">操作</ReviewHeaderCell>
      </div>

      <div className="divide-y divide-[#efebe5]">
        {rows.map((row) => {
          const rowKey = `media:${row.asset_id}`;
          const busyAction = busyRows[rowKey];
          const displayName = getDisplayName(row.name, row.email);
          const displayEmail = getDisplayEmail(row.email);

          return (
            <article
              key={row.asset_id}
              className="grid gap-4 px-4 py-5 lg:grid-cols-[132px_minmax(0,1fr)_minmax(0,1fr)_220px] lg:items-center lg:px-6"
            >
              <div>
                <p className="mb-2 font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase lg:hidden">
                  媒体缩略图
                </p>
                <button
                  className={cn(
                    "group relative block h-[92px] w-[124px] overflow-hidden rounded-[18px] border border-[#ebe7e1] bg-[#eef2f5] text-left shadow-[0_8px_20px_rgba(96,113,128,0.08)] transition-transform duration-200",
                    row.previewUrl
                      ? "cursor-zoom-in hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#bfd2e1]/40 focus-visible:outline-none"
                      : "cursor-not-allowed opacity-80",
                  )}
                  disabled={!row.previewUrl}
                  onClick={() => onPreviewOpen(row)}
                  type="button"
                >
                  <MediaPreview asset={row} />
                  {row.previewUrl ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(28,38,45,0.18)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#486782] shadow-[0_8px_18px_rgba(28,38,45,0.12)]">
                        {row.kind === "video" ? (
                          <Play className="ml-0.5 size-4 fill-current" />
                        ) : (
                          <ImageIcon className="size-4" />
                        )}
                      </div>
                    </div>
                  ) : null}
                </button>
              </div>

              <ReviewValueCell label="用户名" value={displayName} />
              <ReviewValueCell label="邮箱" value={displayEmail} />

              <div className="lg:justify-self-end">
                <ReviewActionGroup
                  busyAction={busyAction}
                  onApprove={() => void onAction(row, "approve")}
                  onReject={() => void onAction(row, "reject")}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MediaPreviewDialog({
  asset,
  onOpenChange,
}: {
  asset: PendingMediaReviewWithPreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!asset || asset.kind !== "video") {
      return;
    }

    const player = videoRef.current;

    if (!player) {
      return;
    }

    player.currentTime = 0;

    void player.play().catch(() => {
      // Some browsers may still block autoplay; controls remain available.
    });
  }, [asset]);

  return (
    <DashboardDialog
      description={asset ? `${getDisplayName(asset.name, asset.email)} · ${getDisplayEmail(asset.email)}` : undefined}
      onOpenChange={onOpenChange}
      open={asset !== null}
      title={asset?.original_name ?? "媒体预览"}
    >
      {asset ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[26px] border border-[#ebe7e1] bg-[#f4f3f1] shadow-[0_12px_30px_rgba(96,113,128,0.08)]">
            {asset.previewUrl ? (
              asset.kind === "video" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  className="max-h-[72vh] w-full bg-black object-contain"
                  controls
                  playsInline
                  preload="auto"
                  src={asset.previewUrl}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={asset.original_name}
                  className="max-h-[72vh] w-full object-contain"
                  src={asset.previewUrl}
                />
              )
            ) : (
              <div className="flex min-h-[360px] items-center justify-center bg-[linear-gradient(135deg,#edf2f5_0%,#dfe8ee_100%)]">
                <MediaPreviewFallback
                  kind={asset.kind}
                  label={asset.kind === "video" ? "视频" : "图片"}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#66727d]">
            <span className="inline-flex items-center rounded-full bg-[#eef3f6] px-3 py-1 font-medium text-[#486782]">
              {asset.kind === "video" ? "视频预览" : "图片预览"}
            </span>
            <span className="truncate">{asset.original_name}</span>
          </div>
        </div>
      ) : null}
    </DashboardDialog>
  );
}

function ReviewHeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ReviewValueCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase lg:hidden">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-sm font-medium text-[#2b3942] lg:text-[15px]",
          mono && "tracking-[0.12em]",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function ReviewActionGroup({
  busyAction,
  onApprove,
  onReject,
}: {
  busyAction?: BusyAction;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
      <Button
        className="h-10 rounded-full bg-[#4c7259] px-4 text-white hover:bg-[#43664e]"
        disabled={Boolean(busyAction)}
        onClick={onApprove}
      >
        {busyAction === "approve" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <BadgeCheck className="size-4" />
        )}
        通过
      </Button>
      <Button
        className="h-10 rounded-full border-[#efd6d6] bg-white px-4 text-[#b13d3d] hover:bg-[#fff4f4]"
        disabled={Boolean(busyAction)}
        onClick={onReject}
        variant="outline"
      >
        {busyAction === "reject" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <XCircle className="size-4" />
        )}
        拒绝
      </Button>
    </div>
  );
}

function MediaPreview({ asset }: { asset: PendingMediaReviewWithPreview }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const kindLabel = asset.kind === "video" ? "视频" : "图片";

  if (!asset.previewUrl || previewFailed) {
    return <MediaPreviewFallback kind={asset.kind} label={kindLabel} />;
  }

  if (asset.kind === "video") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#172029]">
        <video
          className="h-full w-full object-cover"
          muted
          onError={() => setPreviewFailed(true)}
          playsInline
          preload="metadata"
          src={asset.previewUrl}
        />
        <MediaPreviewBadge>{kindLabel}</MediaPreviewBadge>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef2f5]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={asset.original_name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setPreviewFailed(true)}
        src={asset.previewUrl}
      />
      <MediaPreviewBadge>{kindLabel}</MediaPreviewBadge>
    </div>
  );
}

function MediaPreviewFallback({
  kind,
  label,
}: {
  kind: PendingMediaReviewWithPreview["kind"];
  label: string;
}) {
  const Icon = kind === "video" ? Video : ImageIcon;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e9eef2_0%,#dce6ec_100%)] text-[#486782]">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/88 shadow-[0_8px_18px_rgba(96,113,128,0.12)]">
          <Icon className="size-5" />
        </div>
        <span className="text-xs font-medium text-[#5f717f]">无法预览</span>
      </div>
      <MediaPreviewBadge>{label}</MediaPreviewBadge>
    </div>
  );
}

function MediaPreviewBadge({ children }: { children: ReactNode }) {
  return (
    <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-[rgba(28,38,45,0.72)] px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

function getDisplayName(name: string | null, email: string | null) {
  const normalizedName = normalizeOptionalString(name);

  if (normalizedName) {
    return normalizedName;
  }

  const normalizedEmail = normalizeOptionalString(email);

  if (normalizedEmail) {
    const [prefix] = normalizedEmail.split("@");
    const normalizedPrefix = normalizeOptionalString(prefix);

    if (normalizedPrefix) {
      return normalizedPrefix;
    }
  }

  return "未命名用户";
}

function getDisplayEmail(email: string | null) {
  return normalizeOptionalString(email) ?? "待补充";
}

export {
  MediaPreviewDialog,
  MediaReviewList,
  PrivacyReviewList,
  ReviewLoadingState,
  ReviewSummaryCard,
};
