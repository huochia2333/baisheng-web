"use client";

import type { ReactNode } from "react";

import { BadgeCheck, LoaderCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { normalizeOptionalString } from "../dashboard-shared-ui";
import { Button } from "../../ui/button";
import type { BusyAction } from "./types";

export function ReviewHeaderCell({
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

export function ReviewValueCell({
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

export function ReviewActionGroup({
  busyAction,
  onApprove,
  onReject,
}: {
  busyAction?: BusyAction;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("ReviewsUI");

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
        {t("actions.approve")}
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
        {t("actions.reject")}
      </Button>
    </div>
  );
}

export function getDisplayName(
  name: string | null,
  email: string | null,
  fallbackLabel: string,
) {
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

  return fallbackLabel;
}

export function getDisplayEmail(email: string | null, fallbackLabel: string) {
  return normalizeOptionalString(email) ?? fallbackLabel;
}
