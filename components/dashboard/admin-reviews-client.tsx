"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  FileBadge2,
  ImageIcon,
  LoaderCircle,
  Play,
  ShieldAlert,
  Video,
  XCircle,
} from "lucide-react";

import {
  approveMediaReview,
  approvePrivacyReview,
  getCurrentReviewerContext,
  getPendingMediaReviews,
  getPendingPrivacyReviews,
  rejectMediaReview,
  rejectPrivacyReview,
  type PendingMediaReviewWithPreview,
  type PendingPrivacyReviewRow,
} from "@/lib/admin-reviews";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  PageBanner,
  normalizeOptionalString,
  toErrorMessage,
  type NoticeTone,
} from "./admin-my-shared";
import { DashboardDialog } from "./dashboard-dialog";
import { Button } from "../ui/button";

type ReviewTab = "privacy" | "media";
type BusyAction = "approve" | "reject";
type PageFeedback = { tone: NoticeTone; message: string } | null;

export function AdminReviewsClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [activeTab, setActiveTab] = useState<ReviewTab>("privacy");
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [privacyRows, setPrivacyRows] = useState<PendingPrivacyReviewRow[]>([]);
  const [mediaRows, setMediaRows] = useState<PendingMediaReviewWithPreview[]>([]);
  const [busyRows, setBusyRows] = useState<Record<string, BusyAction>>({});
  const [previewAsset, setPreviewAsset] = useState<PendingMediaReviewWithPreview | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const loadPage = async ({ showLoading }: { showLoading: boolean }) => {
      if (showLoading && isMounted) {
        setLoading(true);
      }

      try {
        const reviewer = await getCurrentReviewerContext(supabase);

        if (!isMounted) {
          return;
        }

        if (!reviewer) {
          router.replace("/login");
          return;
        }

        const isAdmin = reviewer.role === "administrator";
        setHasPermission(isAdmin);

        if (!isAdmin) {
          setPrivacyRows([]);
          setMediaRows([]);
          setPageFeedback(null);
          return;
        }

        const [nextPrivacyRows, nextMediaRows] = await Promise.all([
          getPendingPrivacyReviews(supabase),
          getPendingMediaReviews(supabase),
        ]);

        if (!isMounted) {
          return;
        }

        setPrivacyRows(nextPrivacyRows);
        setMediaRows(nextMediaRows);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPage({ showLoading: true });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        await loadPage({ showLoading: false });
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!supabase) {
    return <ReviewLoadingState />;
  }

  const setRowBusyState = (rowKey: string, action: BusyAction | null) => {
    setBusyRows((current) => {
      if (!action) {
        const next = { ...current };
        delete next[rowKey];
        return next;
      }

      return {
        ...current,
        [rowKey]: action,
      };
    });
  };

  const handlePrivacyReview = async (
    row: PendingPrivacyReviewRow,
    action: BusyAction,
  ) => {
    const rowKey = `privacy:${row.request_id}`;
    const actionLabel = action === "approve" ? "通过" : "拒绝";

    if (busyRows[rowKey]) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`确定要${actionLabel}这条个人隐私资料审核吗？`)
    ) {
      return;
    }

    setRowBusyState(rowKey, action);
    setPageFeedback(null);

    try {
      if (action === "approve") {
        await approvePrivacyReview(supabase, row.request_id);
      } else {
        await rejectPrivacyReview(supabase, row.request_id);
      }

      setPrivacyRows((current) =>
        current.filter((item) => item.request_id !== row.request_id),
      );
      setPageFeedback({
        tone: "success",
        message:
          action === "approve"
            ? "个人隐私资料已审核通过。"
            : "个人隐私资料已拒绝。",
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toErrorMessage(error),
      });
    } finally {
      setRowBusyState(rowKey, null);
    }
  };

  const handleMediaReview = async (
    row: PendingMediaReviewWithPreview,
    action: BusyAction,
  ) => {
    const rowKey = `media:${row.asset_id}`;
    const actionLabel = action === "approve" ? "通过" : "拒绝";

    if (busyRows[rowKey]) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`确定要${actionLabel}这条个人媒体审核吗？`)
    ) {
      return;
    }

    setRowBusyState(rowKey, action);
    setPageFeedback(null);

    try {
      if (action === "approve") {
        await approveMediaReview(supabase, row.asset_id);
      } else {
        await rejectMediaReview(supabase, row.asset_id);
      }

      setMediaRows((current) => current.filter((item) => item.asset_id !== row.asset_id));
      setPageFeedback({
        tone: "success",
        message:
          action === "approve" ? "个人媒体已审核通过。" : "个人媒体已拒绝。",
      });
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toErrorMessage(error),
      });
    } finally {
      setRowBusyState(rowKey, null);
    }
  };

  const closePreviewDialog = (open: boolean) => {
    if (open) {
      return;
    }

    setPreviewAsset(null);
  };

  if (loading) {
    return <ReviewLoadingState />;
  }

  const reviewTabs = [
    {
      key: "privacy" as const,
      label: "隐私审核",
      count: privacyRows.length,
      icon: FileBadge2,
    },
    {
      key: "media" as const,
      label: "媒体审核",
      count: mediaRows.length,
      icon: ImageIcon,
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              审核工作台
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              审核中心
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReviewSummaryCard
              accent="blue"
              count={privacyRows.length}
              icon={<FileBadge2 className="size-5" />}
              label="隐私待审核"
            />
            <ReviewSummaryCard
              accent="green"
              count={mediaRows.length}
              icon={<ImageIcon className="size-5" />}
              label="媒体待审核"
            />
          </div>
        </div>
      </section>

      {hasPermission === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前登录账号不是管理员，无法访问隐私审核和媒体审核列表。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无审核权限"
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-4 shadow-[0_18px_45px_rgba(96,113,128,0.06)] sm:p-6 xl:p-8">
          <div className="flex flex-wrap gap-3 border-b border-[#e7e3dc] pb-5">
            {reviewTabs.map((tab) => {
              const Icon = tab.icon;
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
                rows={privacyRows}
                onAction={handlePrivacyReview}
              />
            ) : (
              <MediaReviewList
                busyRows={busyRows}
                onPreviewOpen={setPreviewAsset}
                rows={mediaRows}
                onAction={handleMediaReview}
              />
            )}
          </div>
        </section>
      )}

      <MediaPreviewDialog asset={previewAsset} onOpenChange={closePreviewDialog} />
    </section>
  );
}

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
