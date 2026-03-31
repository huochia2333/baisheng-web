"use client";

import type { ReactNode } from "react";

import {
  BadgeCheck,
  LoaderCircle,
  Play,
  ShieldAlert,
  Upload,
  Video,
} from "lucide-react";

import type {
  PrivacyRequestStatus,
  UserMediaAssetWithPreview,
} from "@/lib/user-self-service";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

export type ReviewStatus = "empty" | "pending" | "approved";
export type MediaAssetKey = "identity" | "passport" | "photos" | "videos";
export type NoticeTone = "error" | "success" | "info";

export function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/70 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在同步云端资料...
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
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(135deg,#162029_0%,#314758_52%,#5e7b8f_100%)] p-4 text-white">
      <div className="flex items-center justify-between text-white/76">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] tracking-[0.16em] uppercase">
          <Video className="size-3.5" />
          Video
        </div>
        {count ? <span className="text-xs">{count} 条视频</span> : null}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#486782]">
          <Play className="ml-0.5 size-5 fill-current" />
        </div>
      </div>
      <p className="truncate text-sm font-semibold">{title ?? "个人介绍视频"}</p>
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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  placeholder: string;
  actionLabel: string;
  busy: boolean;
  onChange: (value: string) => void;
  onAction: () => void;
}) {
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
          <p className="mt-1 text-sm text-[#67727b]">提交后将进入审核流程。</p>
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
          <p className="text-sm font-semibold">{approved ? "审核通过" : "待审核"}</p>
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
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold",
        status === "pass" && "bg-[#e8f4ec] text-[#4c7259]",
        status === "pending" && "bg-[#fff5db] text-[#9a6a07]",
        status === "denied" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {status === "pass" ? "审核通过" : status === "pending" ? "待审核" : "已驳回"}
    </span>
  );
}

export function getMediaStatus(assets: UserMediaAssetWithPreview[]): ReviewStatus {
  if (assets.some((asset) => asset.status === "pending")) return "pending";
  if (assets.some((asset) => asset.status === "pass")) return "approved";
  return "empty";
}

export function getStatusLabel(key: MediaAssetKey, status: ReviewStatus) {
  if (status === "pending") return "待审核";
  if (status === "approved") return key === "identity" || key === "passport" ? "通过认证" : "审核通过";
  if (key === "identity") return "请填写身份证号";
  if (key === "passport") return "请上传护照号码";
  if (key === "photos") return "请上传个人照片";
  return "请上传个人视频";
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

export function mapUserStatus(status: string | null | undefined) {
  if (status === "active") {
    return { label: "已激活", accent: "success" as const };
  }

  if (status === "suspended") {
    return { label: "已停用", accent: "default" as const };
  }

  return { label: "待审核", accent: "default" as const };
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
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

export function toErrorMessage(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "发生了未知错误，请稍后再试。";

  if (message.includes("duplicate pending privacy request exists")) {
    return "已有相同内容正在审核中，请等待审核结果。";
  }

  if (message.includes("submitted privacy data duplicates existing stored data")) {
    return "提交内容与当前已存档资料一致，无需重复提交。";
  }

  if (message.includes("row-level security")) {
    return "当前账号没有执行该操作的权限。";
  }

  return message;
}
