"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  Globe2,
  LoaderCircle,
  Paperclip,
  PencilLine,
  Search,
  Shuffle,
  Trash2,
  UsersRound,
} from "lucide-react";

import type {
  AdminTaskRow,
  TaskScope,
  TaskStatus,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  formatTaskCommissionMoney,
  getTaskAssignmentLabel,
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskMoreAttachmentsLabel,
  getTaskScopeLabel,
  getTaskStatusMeta,
  getTaskTypeLabel,
  resolveTaskActorLabel,
} from "@/components/dashboard/tasks/tasks-display";
import {
  canDeleteTask,
  canEditTask,
  canReassignTask,
} from "./admin-tasks-utils";

const selectFieldClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export function TaskCard({
  task,
  reassignBusy,
  deleteBusy,
  onEdit,
  onReassign,
  onDelete,
}: {
  task: AdminTaskRow;
  reassignBusy: boolean;
  deleteBusy: boolean;
  onEdit: () => void;
  onReassign: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Tasks.admin.card");
  const sharedT = useTranslations("Tasks.shared");
  const { locale } = useLocale();
  const canEdit = canEditTask(task);
  const canDelete = canDeleteTask(task);
  const canChangeAssignment = canReassignTask(task);

  return (
    <article className="rounded-[28px] border border-[#ebe7e1] bg-white p-6 shadow-[0_14px_30px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
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

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#23313a]">
              {task.task_name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
              {getTaskIntroText(task.task_intro, sharedT)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canEdit}
              onClick={onEdit}
              type="button"
            >
              <PencilLine className="size-4" />
              {t("edit")}
            </Button>
            <Button
              className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canChangeAssignment || reassignBusy}
              onClick={onReassign}
              type="button"
            >
              {reassignBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Shuffle className="size-4" />
              )}
              {t("reassign")}
            </Button>
            <Button
              className="h-10 rounded-full border border-[#f1d1d1] bg-[#fff2f2] px-4 text-[#b13d3d] hover:bg-[#fce5e5] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canDelete || deleteBusy}
              onClick={onDelete}
              type="button"
            >
              {deleteBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t("delete")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoTile
            label={t("assignmentLabel")}
            value={getTaskAssignmentLabel(task.scope, task.team?.team_name, sharedT)}
          />
          <InfoTile
            label={t("taskTypeLabel")}
            value={getTaskTypeLabel(task.task_type_label, task.task_type_code, sharedT)}
          />
          <InfoTile
            label={t("commissionAmountLabel")}
            value={formatTaskCommissionMoney(task.commission_amount_rmb, locale)}
          />
          <InfoTile
            label={t("creatorLabel")}
            value={resolveTaskActorLabel(task.creator, task.created_by_user_id, sharedT)}
          />
          <InfoTile
            label={t("assigneeLabel")}
            value={resolveTaskActorLabel(task.accepted_by, task.accepted_by_user_id, sharedT)}
          />
          <InfoTile label={t("createdAtLabel")} value={formatDateTime(task.created_at)} />
          <InfoTile label={t("acceptedAtLabel")} value={formatDateTime(task.accepted_at)} />
          <InfoTile label={t("submittedAtLabel")} value={formatDateTime(task.submitted_at)} />
          <InfoTile label={t("reviewedAtLabel")} value={formatDateTime(task.reviewed_at)} />
          <InfoTile label={t("completedAtLabel")} value={formatDateTime(task.completed_at)} />
        </div>

        {task.review_reject_reason ? (
          <div className="rounded-[22px] border border-[#f1d1d1] bg-[#fff6f6] p-4">
            <p className="text-sm font-semibold text-[#b13d3d]">{t("reviewRejectReasonLabel")}</p>
            <p className="mt-2 text-sm leading-7 text-[#7b4f4f]">{task.review_reject_reason}</p>
          </div>
        ) : null}

        {task.attachments.length > 0 ? (
          <div className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">{t("attachmentsOverview")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.attachments.slice(0, 4).map((attachment) => (
                <DataPill accent="blue" key={attachment.id}>
                  <Paperclip className="size-3.5" />
                  {attachment.original_name}
                  <span className="text-[#6f7b85]">
                    {formatFileSize(attachment.file_size_bytes)}
                  </span>
                </DataPill>
              ))}
              {task.attachments.length > 4 ? (
                <DataPill accent="gold">
                  {getTaskMoreAttachmentsLabel(task.attachments.length - 4, sharedT)}
                </DataPill>
              ) : null}
            </div>
          </div>
        ) : null}

        {!canEdit ? (
          <p className="text-xs leading-6 text-[#8a949c]">{t("completedLockedNotice")}</p>
        ) : !canChangeAssignment ? (
          <p className="text-xs leading-6 text-[#8a949c]">{t("assignmentLockedNotice")}</p>
        ) : null}
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
        className={selectFieldClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#23313a]">{label}</span>
      {children}
    </label>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
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

export function TaskScopePill({ scope }: { scope: TaskScope }) {
  const sharedT = useTranslations("Tasks.shared");

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        scope === "public"
          ? "bg-[#edf2f7] text-[#486782]"
          : "bg-[#eef6ef] text-[#4c7259]",
      ].join(" ")}
    >
      {scope === "public" ? (
        <Globe2 className="size-3.5" />
      ) : (
        <UsersRound className="size-3.5" />
      )}
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

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-7 text-[#23313a]">{value}</p>
    </div>
  );
}
