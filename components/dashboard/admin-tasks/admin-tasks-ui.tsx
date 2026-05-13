"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  Eye,
  LoaderCircle,
  Paperclip,
  PencilLine,
  Shuffle,
  Trash2,
  UsersRound,
} from "lucide-react";

import type { AdminTaskRow } from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDateTime } from "@/components/dashboard/dashboard-shared-ui";
import {
  formatTaskCommissionMoney,
  getTaskAcceptanceProgressLabel,
  getTaskAttachmentCountLabel,
  getTaskIntroText,
  getTaskTargetRolesLabel,
  getTaskTypeLabel,
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

export {
  TaskFilterField as FilterField,
  TaskSearchField as SearchField,
  TaskStatusPill,
} from "@/components/dashboard/tasks/task-ui";

export function TaskCard({
  task,
  reassignBusy,
  deleteBusy,
  onEdit,
  onReassign,
  onDelete,
  onViewDetails,
}: {
  task: AdminTaskRow;
  reassignBusy: boolean;
  deleteBusy: boolean;
  onEdit: () => void;
  onReassign: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}) {
  const t = useTranslations("Tasks.admin.card");
  const sharedT = useTranslations("Tasks.shared");
  const { locale } = useLocale();
  const canEdit = canEditTask(task);
  const canDelete = canDeleteTask(task);
  const canChangeAssignment = canReassignTask(task);
  const targetRolesLabel = getTaskTargetRolesLabel(task.target_roles, sharedT);
  const taskTypeLabel = getTaskTypeLabel(task.task_type_label, task.task_type_code, sharedT);
  const commissionLabel = formatTaskCommissionMoney(task.commission_amount_rmb, locale);
  const progressLabel = getTaskAcceptanceProgressLabel(task, sharedT);

  return (
    <article className="rounded-[24px] border border-[#ebe7e1] bg-white p-5 shadow-[0_12px_26px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <TaskStatusPill status={task.status} />
            <DataPill accent="blue">
              <UsersRound className="size-3.5" />
              {targetRolesLabel}
            </DataPill>
            <DataPill accent="blue">{taskTypeLabel}</DataPill>
            {task.attachments.length > 0 ? (
              <DataPill accent="blue">
                <Paperclip className="size-3.5" />
                {getTaskAttachmentCountLabel(task.attachments.length, sharedT)}
              </DataPill>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
            <Button
              className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-[#486782] hover:bg-[#eef3f6]"
              onClick={onViewDetails}
              type="button"
            >
              <Eye className="size-4" />
              {t("viewDetails")}
            </Button>
            <Button
              className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-[#486782] hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canEdit}
              onClick={onEdit}
              type="button"
            >
              <PencilLine className="size-4" />
              {t("edit")}
            </Button>
            <Button
              className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-[#486782] hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="h-9 rounded-full border border-[#f1d1d1] bg-[#fff2f2] px-3 text-[#b13d3d] hover:bg-[#fce5e5] disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="min-w-0">
          <h3 className="break-words text-xl font-bold tracking-tight text-[#23313a]">
            {task.task_name}
          </h3>
          <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-[#6f7b85]">
            {getTaskIntroText(task.task_intro, sharedT)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoTile label={t("commissionAmountLabel")} value={commissionLabel} />
          <InfoTile label={t("acceptanceProgressLabel")} value={progressLabel} />
          <InfoTile label={t("createdAtLabel")} value={formatDateTime(task.created_at)} />
        </div>
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
