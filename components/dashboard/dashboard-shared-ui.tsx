"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  LoaderCircle,
  Play,
  ShieldAlert,
  Upload,
  Video,
} from "lucide-react";

import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import type {
  PrivacyRequestStatus,
  UserMediaAssetWithPreview,
} from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

export type ReviewStatus = "empty" | "pending" | "approved";
export type MediaAssetKey = "identity" | "passport" | "photos" | "videos";
export type NoticeTone = "error" | "success" | "info";

type TranslationValues = Record<string, string | number>;

type DashboardSharedTranslator = (
  key: string,
  values?: TranslationValues,
) => string;

const PERMISSION_ERROR_FRAGMENTS = [
  "row-level security",
  "permission denied",
  "insufficient privileges",
  "not authorized",
  "unauthorized",
  "forbidden",
];

const TECHNICAL_ERROR_FRAGMENTS = [
  "duplicate key value",
  "violates foreign key constraint",
  "violates check constraint",
  "violates not-null constraint",
  "invalid input syntax",
  "syntax error at or near",
  "failed to fetch",
  "fetch failed",
  "networkerror",
  "timed out",
  "timeout",
  "unexpected token",
  "supabase",
  "postgres",
  "jwt",
  "storage",
  "edge function",
];

export type DashboardSharedCopy = {
  assetStatus: Record<PrivacyRequestStatus, string>;
  errors: {
    duplicatePending: string;
    duplicateStored: string;
    permission: string;
    unknown: string;
  };
  fallback: {
    noRecordYet: string;
  };
  inputHint: string;
  loading: string;
  mediaStatus: {
    approvedGeneric: string;
    approvedIdentity: string;
    identityEmpty: string;
    passportEmpty: string;
    pending: string;
    photosEmpty: string;
    videosEmpty: string;
  };
  statusHeadings: {
    approved: string;
    pending: string;
  };
  userStatus: {
    active: string;
    pending: string;
    suspended: string;
  };
  video: {
    badge: string;
    count: (count: number) => string;
    defaultTitle: string;
  };
};

export function createDashboardSharedCopy(
  t: DashboardSharedTranslator,
): DashboardSharedCopy {
  return {
    assetStatus: {
      denied: t("assetStatus.denied"),
      pass: t("assetStatus.pass"),
      pending: t("assetStatus.pending"),
    },
    errors: {
      duplicatePending: t("errors.duplicatePending"),
      duplicateStored: t("errors.duplicateStored"),
      permission: t("errors.permission"),
      unknown: t("errors.unknown"),
    },
    fallback: {
      noRecordYet: t("fallback.noRecordYet"),
    },
    inputHint: t("inputHint"),
    loading: t("loading"),
    mediaStatus: {
      approvedGeneric: t("mediaStatus.approvedGeneric"),
      approvedIdentity: t("mediaStatus.approvedIdentity"),
      identityEmpty: t("mediaStatus.identityEmpty"),
      passportEmpty: t("mediaStatus.passportEmpty"),
      pending: t("mediaStatus.pending"),
      photosEmpty: t("mediaStatus.photosEmpty"),
      videosEmpty: t("mediaStatus.videosEmpty"),
    },
    statusHeadings: {
      approved: t("statusHeadings.approved"),
      pending: t("statusHeadings.pending"),
    },
    userStatus: {
      active: t("userStatus.active"),
      pending: t("userStatus.pending"),
      suspended: t("userStatus.suspended"),
    },
    video: {
      badge: t("video.badge"),
      count: (count) => t("video.count", { count }),
      defaultTitle: t("video.defaultTitle"),
    },
  };
}

function createLegacyDashboardSharedCopy(
  locale: Locale = DEFAULT_LOCALE,
): DashboardSharedCopy {
  const isZh = locale === "zh";

  return {
    assetStatus: {
      denied: isZh ? "已驳回" : "Rejected",
      pass: isZh ? "审核通过" : "Approved",
      pending: isZh ? "待审核" : "Pending Review",
    },
    errors: {
      duplicatePending: isZh
        ? "已有相同内容正在审核中，请等待审核结果。"
        : "An identical request is already under review. Please wait for the result.",
      duplicateStored: isZh
        ? "提交内容与当前已存档资料一致，无需重复提交。"
        : "The submitted value matches the stored record. No resubmission is needed.",
      permission: isZh
        ? "当前账号没有执行该操作的权限。"
        : "The current account does not have permission to perform this action.",
      unknown: isZh
        ? "发生了未知错误，请稍后再试。"
        : "Something went wrong. Please try again later.",
    },
    fallback: {
      noRecordYet: isZh ? "暂无记录" : "No record yet",
    },
    inputHint: isZh
      ? "提交后将进入审核流程。"
      : "After submission, this will enter the review queue.",
    loading: isZh ? "加载中" : "loading",
    mediaStatus: {
      approvedGeneric: isZh ? "审核通过" : "Approved",
      approvedIdentity: isZh ? "通过认证" : "Verified",
      identityEmpty: isZh ? "请填写身份证号" : "Add ID number",
      passportEmpty: isZh ? "请填写护照号" : "Add passport number",
      pending: isZh ? "待审核" : "Pending Review",
      photosEmpty: isZh ? "请上传个人照片" : "Upload profile photos",
      videosEmpty: isZh ? "请上传个人视频" : "Upload profile videos",
    },
    statusHeadings: {
      approved: isZh ? "审核通过" : "Approved",
      pending: isZh ? "待审核" : "Pending Review",
    },
    userStatus: {
      active: isZh ? "已激活" : "Active",
      pending: isZh ? "待审核" : "Pending Review",
      suspended: isZh ? "已停用" : "Suspended",
    },
    video: {
      badge: "Video",
      count: (count) => (isZh ? `${count} 条视频` : `${count} videos`),
      defaultTitle: isZh ? "个人介绍视频" : "Profile introduction video",
    },
  };
}

function resolveDashboardSharedCopy(
  localeOrCopy: Locale | DashboardSharedCopy = DEFAULT_LOCALE,
) {
  return typeof localeOrCopy === "string"
    ? createLegacyDashboardSharedCopy(localeOrCopy)
    : localeOrCopy;
}

export function LoadingState() {
  const t = useTranslations("DashboardShared");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/70 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        {t("loading")}
      </div>
    </div>
  );
}

export function PageBanner({
  children,
  tone,
}: {
  children: string;
  tone: NoticeTone;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-5 py-4 text-sm leading-7",
        tone === "error" && "border-[#f1d1d1] bg-[#fff2f2] text-[#9f3535]",
        tone === "success" && "border-[#d6e8d8] bg-[#f1f8f2] text-[#42624b]",
        tone === "info" && "border-[#d7e2ea] bg-[#f3f7fa] text-[#49657d]",
      )}
    >
      {children}
    </div>
  );
}

export function IdPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f7f5f1_0%,#ece9e3_100%)] p-5">
      <div className="relative h-[72%] w-[78%] rounded-[18px] border border-[#ddd8d0] bg-[linear-gradient(135deg,#efe7db_0%,#f7f2ea_45%,#ddd6c8_100%)] shadow-[0_14px_28px_rgba(86,103,119,0.12)]">
        <div className="absolute left-5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-2xl bg-white/72" />
        <div className="absolute right-5 top-6 w-[46%] space-y-3">
          <div className="h-2.5 w-[78%] rounded-full bg-[#b49e84]/70" />
          <div className="h-2.5 w-full rounded-full bg-[#c5b29b]/55" />
          <div className="h-2.5 w-[68%] rounded-full bg-[#c5b29b]/55" />
        </div>
        <div className="absolute bottom-5 left-5 h-8 w-24 rounded-lg bg-white/36" />
      </div>
    </div>
  );
}

export function PassportPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f7f5f1_0%,#ece9e3_100%)] p-5">
      <div className="relative h-[74%] w-[62%] rounded-[18px] border border-[#2f343a] bg-[linear-gradient(160deg,#1e2328_0%,#3e4650_100%)] shadow-[0_18px_32px_rgba(33,38,44,0.24)]">
        <div className="absolute left-1/2 top-[28%] h-14 w-14 -translate-x-1/2 rounded-full border border-white/14" />
        <div className="absolute left-1/2 top-[62%] w-[62%] -translate-x-1/2 space-y-2">
          <div className="h-2 w-full rounded-full bg-white/16" />
          <div className="h-2 w-[82%] rounded-full bg-white/12" />
        </div>
      </div>
    </div>
  );
}

export function VideoPreview({ count, title }: { count: number; title?: string }) {
  const t = useTranslations("DashboardShared");
  const copy = createDashboardSharedCopy(t);

  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(135deg,#162029_0%,#314758_52%,#5e7b8f_100%)] p-4 text-white">
      <div className="flex items-center justify-between text-white/76">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] tracking-[0.16em] uppercase">
          <Video className="size-3.5" />
          {copy.video.badge}
        </div>
        {count ? <span className="text-xs">{copy.video.count(count)}</span> : null}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#486782]">
          <Play className="ml-0.5 size-5 fill-current" />
        </div>
      </div>
      <p className="truncate text-sm font-semibold">
        {title ?? copy.video.defaultTitle}
      </p>
    </div>
  );
}

export function InputCard({
  icon,
  label,
  value,
  placeholder,
  actionLabel,
  busy,
  onChange,
  onAction,
  helperText,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  placeholder: string;
  actionLabel: string;
  busy: boolean;
  onChange: (value: string) => void;
  onAction: () => void;
  helperText?: string;
}) {
  const t = useTranslations("DashboardShared");

  return (
    <div className="rounded-[24px] border border-[#ece8e1] bg-white p-6 shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
      <div className="flex items-center gap-3 text-[#486782]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef3f6]">
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-sm text-[#67727b]">
            {helperText ?? t("inputHint")}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <input
          className="h-13 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <div className="flex justify-end">
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!value.trim() || busy}
            onClick={onAction}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StatusNotice({
  status,
  description,
}: {
  status: ReviewStatus;
  description: string;
}) {
  const t = useTranslations("DashboardShared");
  const approved = status === "approved";

  return (
    <div
      className={cn(
        "rounded-[22px] border px-5 py-4",
        approved
          ? "border-[#d9e8dc] bg-[#edf5ef] text-[#355443]"
          : "border-[#f0dfaf] bg-[#fbf3dd] text-[#75520c]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-white",
            approved ? "bg-[#4c7259]" : "bg-[#b78b2c]",
          )}
        >
          {approved ? (
            <BadgeCheck className="size-4.5" />
          ) : (
            <ShieldAlert className="size-4.5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">
            {approved ? t("statusHeadings.approved") : t("statusHeadings.pending")}
          </p>
          <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ValueCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#ece8e1] bg-white p-6 shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
      <div className="flex items-center gap-3 text-[#486782]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef3f6]">
          {icon}
        </div>
        <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
          {label}
        </p>
      </div>
      <div className="mt-5 rounded-[20px] bg-[#f6f4f0] px-5 py-4 text-lg font-medium tracking-[0.12em] text-[#2b3942]">
        {value}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d9d5cf] bg-white/72 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3f6] text-[#486782]">
        {icon}
      </div>
      <p className="mt-5 text-lg font-semibold text-[#2b3942]">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-7 text-[#7b858d]">{description}</p>
    </div>
  );
}

export function StatusChip({ status }: { status: PrivacyRequestStatus }) {
  const t = useTranslations("DashboardShared");
  const copy = createDashboardSharedCopy(t);

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold",
        status === "pass" && "bg-[#e8f4ec] text-[#4c7259]",
        status === "pending" && "bg-[#fff5db] text-[#9a6a07]",
        status === "denied" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {copy.assetStatus[status]}
    </span>
  );
}

export function getMediaStatus(assets: UserMediaAssetWithPreview[]): ReviewStatus {
  if (assets.some((asset) => asset.status === "pending")) return "pending";
  if (assets.some((asset) => asset.status === "pass")) return "approved";
  return "empty";
}

export function getStatusLabel(
  key: MediaAssetKey,
  status: ReviewStatus,
  localeOrCopy: Locale | DashboardSharedCopy = DEFAULT_LOCALE,
) {
  const copy = resolveDashboardSharedCopy(localeOrCopy);

  if (status === "pending") {
    return copy.mediaStatus.pending;
  }

  if (status === "approved") {
    return key === "identity" || key === "passport"
      ? copy.mediaStatus.approvedIdentity
      : copy.mediaStatus.approvedGeneric;
  }

  if (key === "identity") {
    return copy.mediaStatus.identityEmpty;
  }

  if (key === "passport") {
    return copy.mediaStatus.passportEmpty;
  }

  if (key === "photos") {
    return copy.mediaStatus.photosEmpty;
  }

  return copy.mediaStatus.videosEmpty;
}

export function statusBadgeClass(status: ReviewStatus) {
  return cn(
    "inline-flex min-h-8 items-center rounded-full px-3 py-1 text-center text-xs font-semibold leading-5",
    status === "approved"
      ? "bg-[#e8f4ec] text-[#4c7259]"
      : status === "pending"
        ? "bg-[#fff5db] text-[#9a6a07]"
        : "bg-[#eef3f6] text-[#486782]",
  );
}

export function mapUserStatus(
  status: string | null | undefined,
  localeOrCopy: Locale | DashboardSharedCopy = DEFAULT_LOCALE,
) {
  const copy = resolveDashboardSharedCopy(localeOrCopy);

  if (status === "active") {
    return {
      label: copy.userStatus.active,
      accent: "success" as const,
    };
  }

  if (status === "suspended") {
    return {
      label: copy.userStatus.suspended,
      accent: "default" as const,
    };
  }

  return {
    label: copy.userStatus.pending,
    accent: "default" as const,
  };
}

export function formatDateTime(
  value: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
) {
  const noRecordYet = createLegacyDashboardSharedCopy(locale).fallback.noRecordYet;

  if (!value) {
    return noRecordYet;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return noRecordYet;
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeSearchText(value: string | null | undefined) {
  return (normalizeOptionalString(value) ?? "").toLowerCase().replace(/\s+/g, " ");
}

function includesErrorFragment(message: string, fragments: readonly string[]) {
  return fragments.some((fragment) => message.includes(fragment));
}

function looksLikeTechnicalError(message: string) {
  return (
    includesErrorFragment(message, TECHNICAL_ERROR_FRAGMENTS) ||
    /http\s+\d{3}\b/.test(message) ||
    /\bstatus code\b/.test(message) ||
    /\bcolumn\b.+\bdoes not exist\b/.test(message) ||
    /\brelation\b.+\bdoes not exist\b/.test(message)
  );
}

export function getRawErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message).trim();
  }

  return "";
}

export function toErrorMessage(
  error: unknown,
  localeOrCopy: Locale | DashboardSharedCopy = DEFAULT_LOCALE,
) {
  const copy = resolveDashboardSharedCopy(localeOrCopy);
  const message = getRawErrorMessage(error);
  const normalizedMessage = message.toLowerCase();

  if (message.length === 0) {
    return copy.errors.unknown;
  }

  if (normalizedMessage.includes("duplicate pending privacy request exists")) {
    return copy.errors.duplicatePending;
  }

  if (normalizedMessage.includes("submitted privacy data duplicates existing stored data")) {
    return copy.errors.duplicateStored;
  }

  if (includesErrorFragment(normalizedMessage, PERMISSION_ERROR_FRAGMENTS)) {
    return copy.errors.permission;
  }

  if (looksLikeTechnicalError(normalizedMessage)) {
    return copy.errors.unknown;
  }

  return message;
}
