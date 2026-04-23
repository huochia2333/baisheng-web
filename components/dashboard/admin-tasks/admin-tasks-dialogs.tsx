"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  LoaderCircle,
  Paperclip,
  Plus,
  Shuffle,
} from "lucide-react";

import {
  ADMIN_TASK_ATTACHMENT_MAX_FILES,
  ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  type AdminTaskRow,
  type AdminTasksPageData,
  type TaskScope,
  type TaskTypeOption,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import {
  PageBanner,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  getTaskAssignmentLabel,
  getTaskTeamName,
} from "@/components/dashboard/tasks/tasks-display";

import {
  canManageTask,
  type AssignmentFormState,
  type CreateTaskFormState,
} from "./admin-tasks-utils";
import {
  FormField,
  TaskScopePill,
  TaskStatusPill,
} from "./admin-tasks-ui";
import {
  type PageFeedback,
  taskInputClassName,
  taskSelectClassName,
  taskTextareaClassName,
} from "./admin-tasks-view-model-shared";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

type TeamOptions = AdminTasksPageData["teamOptions"];

export function CreateTaskDialog({
  feedback,
  formState,
  onFilesChange,
  onOpenChange,
  onRemoveFile,
  onScopeChange,
  onTaskTypeChange,
  onSubmit,
  onCommissionAmountChange,
  onTaskIntroChange,
  onTaskNameChange,
  onTeamChange,
  open,
  pending,
  teamOptions,
  taskTypeOptions,
}: {
  feedback: PageFeedback;
  formState: CreateTaskFormState;
  onFilesChange: (files: File[]) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveFile: (index: number) => void;
  onScopeChange: (scope: TaskScope) => void;
  onTaskTypeChange: (taskTypeCode: string) => void;
  onSubmit: () => void;
  onCommissionAmountChange: (value: string) => void;
  onTaskIntroChange: (value: string) => void;
  onTaskNameChange: (value: string) => void;
  onTeamChange: (teamId: string) => void;
  open: boolean;
  pending: boolean;
  teamOptions: TeamOptions;
  taskTypeOptions: TaskTypeOption[];
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");

  return open ? (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {t("createDialog.cancel")}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t("createDialog.submit")}
          </Button>
        </>
      }
      description={t("createDialog.description")}
      onOpenChange={onOpenChange}
      open
      title={t("createDialog.title")}
    >
      <div className="space-y-6">
        {feedback ? (
          <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <FormField label={t("createDialog.taskNameLabel")}>
            <input
              className={taskInputClassName}
              onChange={(event) => onTaskNameChange(event.target.value)}
              placeholder={t("createDialog.taskNamePlaceholder")}
              type="text"
              value={formState.taskName}
            />
          </FormField>

          <FormField label={t("createDialog.scopeLabel")}>
            <select
              className={taskSelectClassName}
              onChange={(event) => onScopeChange(event.target.value as TaskScope)}
              value={formState.scope}
            >
              <option value="public">{sharedT("scope.public")}</option>
              <option value="team">{sharedT("scope.team")}</option>
            </select>
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <FormField label={t("createDialog.taskTypeLabel")}>
            <select
              className={taskSelectClassName}
              onChange={(event) => onTaskTypeChange(event.target.value)}
              value={formState.taskTypeCode}
            >
              <option value="">{t("createDialog.taskTypePlaceholder")}</option>
              {taskTypeOptions.map((taskType) => (
                <option key={taskType.code} value={taskType.code}>
                  {taskType.displayName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t("createDialog.commissionAmountLabel")}>
            <input
              className={taskInputClassName}
              inputMode="decimal"
              min="0"
              onChange={(event) => onCommissionAmountChange(event.target.value)}
              placeholder={t("createDialog.commissionAmountPlaceholder")}
              step="0.01"
              type="number"
              value={formState.commissionAmount}
            />
          </FormField>
        </div>

        {formState.taskTypeCode ? (
          <p className="text-sm leading-7 text-[#6f7b85]">
            {taskTypeOptions.find((taskType) => taskType.code === formState.taskTypeCode)?.description
              ?? t("createDialog.taskTypeHint")}
          </p>
        ) : null}

        {formState.scope === "team" ? (
          <FormField label={t("createDialog.teamLabel")}>
            <select
              className={taskSelectClassName}
              onChange={(event) => onTeamChange(event.target.value)}
              value={formState.teamId}
            >
              <option value="">{t("createDialog.teamPlaceholder")}</option>
              {teamOptions.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {getTaskTeamName(team.team_name, sharedT)}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        <FormField label={t("createDialog.taskIntroLabel")}>
          <textarea
            className={taskTextareaClassName}
            onChange={(event) => onTaskIntroChange(event.target.value)}
            placeholder={t("createDialog.taskIntroPlaceholder")}
            value={formState.taskIntro}
          />
        </FormField>

        <FormField label={t("createDialog.attachmentsLabel")}>
          <div className="rounded-[24px] border border-dashed border-[#cfd8df] bg-[#fbfaf8] p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-8 text-center transition hover:bg-[#f8fbfd]">
              <Paperclip className="size-5 text-[#486782]" />
              <span className="mt-3 text-sm font-semibold text-[#23313a]">
                {t("createDialog.attachmentsCta")}
              </span>
              <span className="mt-2 text-xs leading-6 text-[#7b858d]">
                {t("createDialog.attachmentsHint", {
                  maxFiles: ADMIN_TASK_ATTACHMENT_MAX_FILES,
                  maxPerFile: formatFileSize(ADMIN_TASK_ATTACHMENT_MAX_FILE_SIZE_BYTES),
                  maxTotal: formatFileSize(ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES),
                })}
              </span>
              <input
                className="sr-only"
                multiple
                onChange={(event) => {
                  onFilesChange(Array.from(event.target.files ?? []));
                  event.currentTarget.value = "";
                }}
                type="file"
              />
            </label>

            {formState.files.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {formState.files.map((file, index) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782] transition hover:bg-[#e1ebf0]"
                    key={`${file.name}-${file.size}-${index}`}
                    onClick={() => onRemoveFile(index)}
                    type="button"
                  >
                    <Paperclip className="size-3.5" />
                    {file.name}
                    <span className="text-[#6f7b85]">{formatFileSize(file.size)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#7b858d]">
                {t("createDialog.noAttachments")}
              </p>
            )}
          </div>
        </FormField>
      </div>
    </DashboardDialog>
  ) : null;
}

export function AssignmentDialog({
  feedback,
  formState,
  onOpenChange,
  onScopeChange,
  onSubmit,
  onTeamChange,
  open,
  pending,
  selectedTask,
  teamOptions,
}: {
  feedback: PageFeedback;
  formState: AssignmentFormState;
  onOpenChange: (open: boolean) => void;
  onScopeChange: (scope: TaskScope) => void;
  onSubmit: () => void;
  onTeamChange: (teamId: string) => void;
  open: boolean;
  pending: boolean;
  selectedTask: AdminTaskRow | null;
  teamOptions: TeamOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const manageable = selectedTask ? canManageTask(selectedTask) : false;

  return open ? (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {t("assignmentDialog.cancel")}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={pending || !selectedTask || !manageable}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Shuffle className="size-4" />
            )}
            {t("assignmentDialog.submit")}
          </Button>
        </>
      }
      description={t("assignmentDialog.description")}
      onOpenChange={onOpenChange}
      open
      title={
        selectedTask
          ? t("assignmentDialog.titleWithName", {
              taskName: selectedTask.task_name,
            })
          : t("assignmentDialog.title")
      }
    >
      <div className="space-y-6">
        {feedback ? (
          <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner>
        ) : null}

        {selectedTask ? (
          <>
            <div className="rounded-[24px] border border-[#e6ebef] bg-[#f8fbfc] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusPill status={selectedTask.status} />
                <TaskScopePill scope={selectedTask.scope} />
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-[#23313a]">
                {selectedTask.task_name}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                {t("assignmentDialog.currentAssignment", {
                  assignmentLabel: getTaskAssignmentLabel(
                    selectedTask.scope,
                    selectedTask.team?.team_name,
                    sharedT,
                  ),
                })}
              </p>
            </div>

            {!manageable ? (
              <PageBanner tone="info">{t("assignmentDialog.viewOnlyNotice")}</PageBanner>
            ) : (
              <>
                <FormField label={t("assignmentDialog.scopeLabel")}>
                  <select
                    className={taskSelectClassName}
                    onChange={(event) => onScopeChange(event.target.value as TaskScope)}
                    value={formState.scope}
                  >
                    <option value="public">{sharedT("scope.public")}</option>
                    <option value="team">{sharedT("scope.team")}</option>
                  </select>
                </FormField>

                {formState.scope === "team" ? (
                  <FormField label={t("assignmentDialog.teamLabel")}>
                    <select
                      className={taskSelectClassName}
                      onChange={(event) => onTeamChange(event.target.value)}
                      value={formState.teamId}
                    >
                      <option value="">{t("assignmentDialog.teamPlaceholder")}</option>
                      {teamOptions.map((team) => (
                        <option key={team.team_id} value={team.team_id}>
                          {getTaskTeamName(team.team_name, sharedT)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
    </DashboardDialog>
  ) : null;
}
