"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  CircleCheckBig,
  Globe2,
  LoaderCircle,
  Paperclip,
  Search,
  Upload,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  formatTaskCommissionMoney,
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskScopeLabel,
  getTaskStatusMeta,
  getTaskTypeLabel,
  resolveSalesmanTaskTargetLabel,
} from "@/components/dashboard/tasks/tasks-display";
import type { SalesmanTaskRow } from "@/lib/salesman-tasks";

export function SalesmanTaskCard({
  task,
  viewerId,
  busy,
  attachmentBusyKey,
  teamNameById,
  onAccept,
  onOpenAttachment,
  onSubmitReview,
}: {
  task: SalesmanTaskRow;
  viewerId: string | null;
  busy: boolean;
  attachmentBusyKey: string | null;
  teamNameById: Map<string, string>;
  onAccept: () => void;
  onOpenAttachment: (attachment: SalesmanTaskRow["attachments"][number]) => void;
  onSubmitReview: () => void;
}) {
  const t = useTranslations("Tasks.salesman.card");
  const sharedT = useTranslations("Tasks.shared");
  const { locale } = useLocale();
  const isMine = task.accepted_by_user_id === viewerId;
  const targetLabel = resolveSalesmanTaskTargetLabel(task, teamNameById, sharedT);
  const hasReviewFeedback = Boolean(task.review_reject_reason);

  return (
    <article className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusPill status={task.status} />
          <TaskScopePill scope={task.scope} />
          <DataPill accent="blue">
            {getTaskTypeLabel(task.task_type_label, task.task_type_code, sharedT)}
          </DataPill>
          <DataPill accent="gold">
            {formatTaskCommissionMoney(task.commission_amount_rmb, locale)}
          </DataPill>
          {task.attachments.length > 0 ? (
            <DataPill accent="blue">
              <Paperclip className="size-3.5" />
              {getTaskAttachmentCountLabel(task.attachments.length, sharedT)}
            </DataPill>
          ) : null}
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{task.task_name}</h3>
          <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
            {getTaskIntroText(task.task_intro, sharedT)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            label={t("taskTypeLabel")}
            value={getTaskTypeLabel(task.task_type_label, task.task_type_code, sharedT)}
          />
          <InfoTile
            label={t("commissionAmountLabel")}
            value={formatTaskCommissionMoney(task.commission_amount_rmb, locale)}
          />
          <InfoTile label={t("taskScopeLabel")} value={targetLabel} />
          <InfoTile label={t("createdAtLabel")} value={formatDateTime(task.created_at)} />
          <InfoTile label={t("acceptedAtLabel")} value={formatDateTime(task.accepted_at)} />
          <InfoTile label={t("submittedAtLabel")} value={formatDateTime(task.submitted_at)} />
          <InfoTile label={t("reviewedAtLabel")} value={formatDateTime(task.reviewed_at)} />
          <InfoTile label={t("completedAtLabel")} value={formatDateTime(task.completed_at)} />
        </div>

        {task.attachments.length > 0 ? (
          <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">{t("attachmentsTitle")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.attachments.map((attachment) => {
                const attachmentKey = `${task.id}:${attachment.id}`;
                const attachmentBusy = attachmentBusyKey === attachmentKey;

                return (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782] transition hover:bg-[#e1ebf0] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={attachmentBusy}
                    key={attachment.id}
                    onClick={() => onOpenAttachment(attachment)}
                    type="button"
                  >
                    {attachmentBusy ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="size-3.5" />
                    )}
                    {attachment.original_name}
                    <span className="text-[#6f7b85]">{formatFileSize(attachment.file_size_bytes)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasReviewFeedback ? (
          <div className="rounded-[22px] border border-[#f1d1d1] bg-[#fff6f6] p-4">
            <p className="text-sm font-semibold text-[#b13d3d]">{t("reviewRejectReasonLabel")}</p>
            <p className="mt-2 text-sm leading-7 text-[#7b4f4f]">{task.review_reject_reason}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {task.status === "to_be_accepted" ? (
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] disabled:opacity-70"
              disabled={busy}
              onClick={onAccept}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CircleCheckBig className="size-4" />
              )}
              {t("accept")}
            </Button>
          ) : null}

          {(task.status === "accepted" || task.status === "rejected") && isMine ? (
            <Button
              className="h-11 rounded-full bg-[#4c7259] px-5 text-white hover:bg-[#43664f] disabled:opacity-70"
              disabled={busy}
              onClick={onSubmitReview}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {task.status === "rejected" ? t("resubmit") : t("submitReview")}
            </Button>
          ) : null}

          {task.status === "accepted" && !isMine ? (
            <p className="text-sm leading-7 text-[#7b858d]">{t("takenByOthers")}</p>
          ) : null}

          {task.status === "reviewing" ? (
            <p className="text-sm leading-7 text-[#7b858d]">
              {isMine ? t("reviewingByMe") : t("reviewingByOthers")}
            </p>
          ) : null}

          {task.status === "rejected" && !isMine ? (
            <p className="text-sm leading-7 text-[#7b858d]">{t("rejectedByOthers")}</p>
          ) : null}

          {task.status === "completed" ? (
            <p className="text-sm leading-7 text-[#7b858d]">
              {isMine ? t("completedByMe") : t("completedGeneric")}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SearchField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]">
        <Search className="size-4 text-[#7a8790]" />
        <input
          className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

export function FilterField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <select
        className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function TaskStatusPill({ status }: { status: SalesmanTaskRow["status"] }) {
  const sharedT = useTranslations("Tasks.shared");
  const mapping = getTaskStatusMeta(status, sharedT);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        mapping.accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
        mapping.accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        mapping.accent === "orange" ? "bg-[#fdebd2] text-[#a76516]" : "",
        mapping.accent === "rose" ? "bg-[#fae8e8] text-[#b13d3d]" : "",
        mapping.accent === "green" ? "bg-[#e7f3ea] text-[#4c7259]" : "",
      ].join(" ")}
    >
      {mapping.label}
    </span>
  );
}

function TaskScopePill({ scope }: { scope: SalesmanTaskRow["scope"] }) {
  const sharedT = useTranslations("Tasks.shared");

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        scope === "public" ? "bg-[#edf2f7] text-[#486782]" : "bg-[#eef6ef] text-[#4c7259]",
      ].join(" ")}
    >
      {scope === "public" ? <Globe2 className="size-3.5" /> : <UsersRound className="size-3.5" />}
      {getTaskScopeLabel(scope, sharedT)}
    </span>
  );
}

function DataPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: "blue" | "gold";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-7 text-[#23313a]">{value}</p>
    </div>
  );
}
