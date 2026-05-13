"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Paperclip,
  UsersRound,
} from "lucide-react";

import type { AdminTaskRow } from "@/lib/admin-tasks";
import type { AdminTaskSubmissionMedia } from "@/lib/admin-task-submission-media";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  formatTaskCommissionMoney,
  getTaskAcceptanceLimitLabel,
  getTaskAcceptanceProgressLabel,
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskTargetRolesLabel,
  getTaskTypeLabel,
  resolveTaskActorLabel,
} from "@/components/dashboard/tasks/tasks-display";
import {
  TaskDataPill as DataPill,
  TaskInfoTile as InfoTile,
  TaskStatusPill,
} from "@/components/dashboard/tasks/task-ui";

import { AdminTaskSubmissionMediaPanel } from "./admin-task-submission-media";
import { canEditTask } from "./admin-tasks-utils";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

export function AdminTaskDetailDialog({
  task,
  submissionMedia,
  submissionMediaBusyId,
  submissionMediaLoading,
  onDownloadSubmissionMedia,
  onOpenChange,
  onPreviewSubmissionMedia,
}: {
  task: AdminTaskRow | null;
  submissionMedia: AdminTaskSubmissionMedia[];
  submissionMediaBusyId: string | null;
  submissionMediaLoading: boolean;
  onDownloadSubmissionMedia: (media: AdminTaskSubmissionMedia) => void;
  onOpenChange: (open: boolean) => void;
  onPreviewSubmissionMedia: (media: AdminTaskSubmissionMedia) => void;
}) {
  const t = useTranslations("Tasks.admin.card");
  const sharedT = useTranslations("Tasks.shared");
  const { locale } = useLocale();

  if (!task) {
    return null;
  }

  const canEdit = canEditTask(task);
  const targetRolesLabel = getTaskTargetRolesLabel(task.target_roles, sharedT);
  const taskTypeLabel = getTaskTypeLabel(task.task_type_label, task.task_type_code, sharedT);
  const commissionLabel = formatTaskCommissionMoney(task.commission_amount_rmb, locale);
  const progressLabel = getTaskAcceptanceProgressLabel(task, sharedT);

  return (
    <DashboardDialog
      onOpenChange={onOpenChange}
      open
      title={t("detailsTitle")}
    >
      <div className="space-y-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TaskStatusPill status={task.status} />
            <DataPill accent="blue">
              <UsersRound className="size-3.5" />
              {targetRolesLabel}
            </DataPill>
            <DataPill accent="blue">{taskTypeLabel}</DataPill>
            <DataPill accent="gold">{commissionLabel}</DataPill>
            <DataPill accent="blue">{progressLabel}</DataPill>
            {task.attachments.length > 0 ? (
              <DataPill accent="blue">
                <Paperclip className="size-3.5" />
                {getTaskAttachmentCountLabel(task.attachments.length, sharedT)}
              </DataPill>
            ) : null}
          </div>
          <h3 className="break-words text-2xl font-bold tracking-tight text-[#23313a]">
            {task.task_name}
          </h3>
        </div>

        <section className="rounded-[24px] border border-[#ebe7e1] bg-white p-5">
          <p className="text-sm font-semibold text-[#23313a]">{t("introTitle")}</p>
          <p className="mt-3 break-words text-sm leading-7 text-[#6f7b85]">
            {getTaskIntroText(task.task_intro, sharedT)}
          </p>
        </section>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-[#23313a]">{t("infoTitle")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile label={t("assignmentLabel")} value={targetRolesLabel} />
            <InfoTile label={t("taskTypeLabel")} value={taskTypeLabel} />
            <InfoTile label={t("commissionAmountLabel")} value={commissionLabel} />
            <InfoTile
              label={t("acceptanceLimitLabel")}
              value={getTaskAcceptanceLimitLabel(task, sharedT)}
            />
            <InfoTile label={t("acceptanceProgressLabel")} value={progressLabel} />
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
        </section>

        {task.review_reject_reason ? (
          <section className="rounded-[22px] border border-[#f1d1d1] bg-[#fff6f6] p-4">
            <p className="text-sm font-semibold text-[#b13d3d]">{t("reviewRejectReasonLabel")}</p>
            <p className="mt-2 break-words text-sm leading-7 text-[#7b4f4f]">
              {task.review_reject_reason}
            </p>
          </section>
        ) : null}

        {task.attachments.length > 0 ? (
          <section className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-4">
            <p className="text-sm font-semibold text-[#486782]">{t("attachmentsOverview")}</p>
            <div className="mt-3 space-y-2">
              {task.attachments.map((attachment) => (
                <div
                  className="flex flex-col gap-2 rounded-[18px] bg-white px-3 py-2 text-sm text-[#23313a] sm:flex-row sm:items-center sm:justify-between"
                  key={attachment.id}
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <Paperclip className="mt-1 size-3.5 shrink-0 text-[#486782]" />
                    <span className="break-all">{attachment.original_name}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#6f7b85]">
                    {formatFileSize(attachment.file_size_bytes)}
                  </span>
                </div>
              ))}
            </div>
          </section>
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
    </DashboardDialog>
  );
}
