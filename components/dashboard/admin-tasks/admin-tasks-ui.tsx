"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  LoaderCircle,
  Paperclip,
  PencilLine,
  Shuffle,
  Trash2,
  UsersRound,
} from "lucide-react";

import type { AdminTaskRow } from "@/lib/admin-tasks";
import type { AdminTaskSubmissionMedia } from "@/lib/admin-task-submission-media";

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
  getTaskMoreAttachmentsLabel,
  getTaskTargetRolesLabel,
  getTaskTypeLabel,
  resolveTaskActorLabel,
} from "@/components/dashboard/tasks/tasks-display";
import {
  TaskDataPill as DataPill,
  TaskInfoTile as InfoTile,
  TaskStatusPill,
} from "@/components/dashboard/tasks/task-ui";
import {
  canDeleteTask,
  canEditTask,
  canReassignTask,
} from "./admin-tasks-utils";
import { AdminTaskSubmissionMediaPanel } from "./admin-task-submission-media";

export {
  TaskFilterField as FilterField,
  TaskSearchField as SearchField,
  TaskStatusPill,
} from "@/components/dashboard/tasks/task-ui";

export function TaskCard({
  task,
  reassignBusy,
  deleteBusy,
  submissionMedia,
  submissionMediaBusyId,
  submissionMediaLoading,
  onEdit,
  onReassign,
  onDelete,
  onDownloadSubmissionMedia,
  onPreviewSubmissionMedia,
}: {
  task: AdminTaskRow;
  reassignBusy: boolean;
  deleteBusy: boolean;
  submissionMedia: AdminTaskSubmissionMedia[];
  submissionMediaBusyId: string | null;
  submissionMediaLoading: boolean;
  onEdit: () => void;
  onReassign: () => void;
  onDelete: () => void;
  onDownloadSubmissionMedia: (media: AdminTaskSubmissionMedia) => void;
  onPreviewSubmissionMedia: (media: AdminTaskSubmissionMedia) => void;
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
              <DataPill accent="blue">
                <UsersRound className="size-3.5" />
                {getTaskTargetRolesLabel(task.target_roles, sharedT)}
              </DataPill>
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
            value={getTaskTargetRolesLabel(task.target_roles, sharedT)}
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

        {task.status === "completed" ? (
          <AdminTaskSubmissionMediaPanel
            busyMediaId={submissionMediaBusyId}
            loading={submissionMediaLoading}
            media={submissionMedia}
            onDownload={onDownloadSubmissionMedia}
            onPreview={onPreviewSubmissionMedia}
          />
        ) : null}

        {!canEdit ? (
          <p className="text-xs leading-6 text-[#8a949c]">{t("completedLockedNotice")}</p>
        ) : null}
      </div>
    </article>
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
