"use client";

import type { ReactNode } from "react";

import { ClipboardList, Download, LoaderCircle, Mail, Paperclip, UserRound, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PendingTaskReviewWithAssets } from "@/lib/task-reviews";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  formatDateTime,
  formatFileSize,
  normalizeOptionalString,
} from "../dashboard-shared-ui";
import {
  formatTaskCommissionMoney,
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskScopeLabel,
  getTaskTeamName,
  getTaskTypeLabel,
} from "../tasks/tasks-display";
import { Button } from "../../ui/button";
import { useLocale } from "../../i18n/locale-provider";
import type { BusyAction } from "./types";

export function TaskReviewList({
  assetBusyKey,
  busyRows,
  onAction,
  onOpenAsset,
  rows,
}: {
  assetBusyKey: string | null;
  busyRows: Record<string, BusyAction>;
  onAction: (row: PendingTaskReviewWithAssets, action: BusyAction) => Promise<void>;
  onOpenAsset: (
    submissionId: string,
    asset: PendingTaskReviewWithAssets["assets"][number],
  ) => void;
  rows: PendingTaskReviewWithAssets[];
}) {
  const t = useTranslations("ReviewsUI");
  const sharedT = useTranslations("Tasks.shared");
  const { locale } = useLocale();

  if (rows.length === 0) {
    return (
      <EmptyState
        description={t("task.emptyDescription")}
        icon={<ClipboardList className="size-6" />}
        title={t("task.emptyTitle")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {rows.map((row) => {
        const rowKey = `task:${row.task_id}`;
        const busyAction = busyRows[rowKey];
        const assigneeName = getDisplayName(
          row.accepted_by_name,
          row.accepted_by_email,
          t("fallback.unnamedUser"),
        );
        const assigneeEmail = getDisplayEmail(
          row.accepted_by_email,
          t("fallback.notProvided"),
        );
        const scopeLabel = getTaskScopeLabel(row.scope, sharedT);
        const teamLabel =
          row.scope === "team" ? getTaskTeamName(row.team_name, sharedT) : scopeLabel;

        return (
          <article
            className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]"
            key={row.submission_id}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="gold">{t("task.roundBadge", { round: row.submission_round })}</Badge>
                    <Badge tone="blue">{scopeLabel}</Badge>
                    <Badge tone="blue">
                      {getTaskTypeLabel(row.task_type_name, row.task_type_code, sharedT)}
                    </Badge>
                    <Badge tone="gold">
                      {formatTaskCommissionMoney(row.commission_amount_rmb, locale)}
                    </Badge>
                    <Badge tone="blue">
                      {getTaskAttachmentCountLabel(row.assets.length || row.asset_count, sharedT)}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#23313a]">
                    {row.task_name}
                  </h3>
                </div>

                <TaskReviewActionGroup
                  busyAction={busyAction}
                  onApprove={() => void onAction(row, "approve")}
                  onReject={() => void onAction(row, "reject")}
                />
              </div>

              <p className="text-sm leading-7 text-[#6f7b85]">
                {getTaskIntroText(row.task_intro, sharedT)}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={<UserRound className="size-4 text-[#486782]" />}
                  label={t("task.assigneeLabel")}
                  value={assigneeName}
                />
                <InfoTile
                  icon={<Mail className="size-4 text-[#486782]" />}
                  label={t("task.emailLabel")}
                  value={assigneeEmail}
                />
                <InfoTile
                  icon={<ClipboardList className="size-4 text-[#486782]" />}
                  label={t("task.scopeLabel")}
                  value={teamLabel}
                />
                <InfoTile
                  icon={<ClipboardList className="size-4 text-[#486782]" />}
                  label={t("task.typeLabel")}
                  value={getTaskTypeLabel(row.task_type_name, row.task_type_code, sharedT)}
                />
                <InfoTile
                  icon={<Paperclip className="size-4 text-[#486782]" />}
                  label={t("task.commissionLabel")}
                  value={formatTaskCommissionMoney(row.commission_amount_rmb, locale)}
                />
                <InfoTile
                  icon={<Paperclip className="size-4 text-[#486782]" />}
                  label={t("task.submittedAtLabel")}
                  value={formatDateTime(row.submitted_at)}
                />
              </div>

              {normalizeOptionalString(row.submission_note) ? (
                <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
                  <p className="text-sm font-semibold text-[#486782]">
                    {t("task.submissionNoteLabel")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#4e5d68]">{row.submission_note}</p>
                </div>
              ) : null}

              <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
                <p className="text-sm font-semibold text-[#486782]">{t("task.assetsLabel")}</p>

                {row.assets.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.assets.map((asset) => {
                      const nextAssetBusyKey = `${row.submission_id}:${asset.id}`;
                      const busy = assetBusyKey === nextAssetBusyKey;

                      return (
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782] transition hover:bg-[#e1ebf0] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={busy}
                          key={asset.id}
                          onClick={() => onOpenAsset(row.submission_id, asset)}
                          type="button"
                        >
                          {busy ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                          ) : (
                            <Download className="size-3.5" />
                          )}
                          <span className="max-w-[180px] truncate">{asset.original_name}</span>
                          <span className="text-[#6f7b85]">{formatFileSize(asset.file_size_bytes)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[#6f7b85]">{t("task.assetsEmpty")}</p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TaskReviewActionGroup({
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
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <Button
        className="h-10 rounded-full bg-[#4c7259] px-4 text-white hover:bg-[#43664e]"
        disabled={Boolean(busyAction)}
        onClick={onApprove}
      >
        {busyAction === "approve" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ClipboardList className="size-4" />
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

function Badge({
  children,
  tone,
}: {
  children: string;
  tone: "blue" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "blue" && "bg-[#e4edf3] text-[#486782]",
        tone === "gold" && "bg-[#fbf1d9] text-[#9a6a07]",
      )}
    >
      {children}
    </span>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#f7f5f2] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium leading-7 text-[#23313a]">{value}</p>
    </div>
  );
}

function getDisplayName(name: string | null, email: string | null, fallbackLabel: string) {
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

function getDisplayEmail(email: string | null, fallbackLabel: string) {
  return normalizeOptionalString(email) ?? fallbackLabel;
}
