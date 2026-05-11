"use client";

import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";

import {
  ADMIN_TASK_ATTACHMENT_MAX_FILES,
  ADMIN_TASK_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  type AdminTaskRow,
  type AdminTasksPageData,
  type TaskTargetRole,
  type TaskTypeOption,
} from "@/lib/admin-tasks";
import {
  IMAGE_UPLOAD_MAX_SIZE_BYTES,
  OTHER_UPLOAD_MAX_SIZE_BYTES,
  VIDEO_UPLOAD_MAX_SIZE_BYTES,
} from "@/lib/upload-file-size-limits";

import { formatFileSize } from "@/components/dashboard/dashboard-shared-ui";
import {
  getTaskTargetRoleLabel,
  getTaskTargetRolesLabel,
} from "@/components/dashboard/tasks/tasks-display";

import { type CreateTaskFormState } from "./admin-tasks-utils";
import {
  FormField,
  TaskStatusPill,
} from "./admin-tasks-ui";
import {
  taskInputClassName,
  taskSelectClassName,
  taskTextareaClassName,
} from "./admin-tasks-view-model-shared";

type TargetRoleOptions = AdminTasksPageData["targetRoleOptions"];

export function TaskEditSummaryCard({
  task,
}: {
  task: AdminTaskRow;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");

  return (
    <div className="rounded-[24px] border border-[#e6ebef] bg-[#f8fbfc] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusPill status={task.status} />
      </div>
      <p className="mt-4 text-lg font-semibold tracking-tight text-[#23313a]">
        {task.task_name}
      </p>
      <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
        {t("editDialog.currentTargetRoles", {
          targetRoles: getTaskTargetRolesLabel(task.target_roles, sharedT),
        })}
      </p>
    </div>
  );
}

export function TaskFormFields({
  canChangeAssignment,
  formState,
  onCommissionAmountChange,
  onTargetRoleToggle,
  onTaskIntroChange,
  onTaskNameChange,
  onTaskTypeChange,
  pending,
  taskTypeOptions,
  targetRoleOptions,
}: {
  canChangeAssignment: boolean;
  formState: CreateTaskFormState;
  onCommissionAmountChange: (value: string) => void;
  onTargetRoleToggle: (role: TaskTargetRole) => void;
  onTaskIntroChange: (value: string) => void;
  onTaskNameChange: (value: string) => void;
  onTaskTypeChange: (taskTypeCode: string) => void;
  pending: boolean;
  taskTypeOptions: TaskTypeOption[];
  targetRoleOptions: TargetRoleOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const selectableTaskTypes = taskTypeOptions.filter(
    (taskType) => taskType.isActive || taskType.code === formState.taskTypeCode,
  );

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FormField label={t("createDialog.taskNameLabel")}>
          <input
            className={taskInputClassName}
            disabled={pending}
            onChange={(event) => onTaskNameChange(event.target.value)}
            placeholder={t("createDialog.taskNamePlaceholder")}
            type="text"
            value={formState.taskName}
          />
        </FormField>

        <TargetRoleCheckboxGrid
          disabled={pending || !canChangeAssignment}
          onToggle={onTargetRoleToggle}
          selectedRoles={formState.targetRoles}
          targetRoleOptions={targetRoleOptions}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FormField label={t("createDialog.taskTypeLabel")}>
          <select
            className={taskSelectClassName}
            disabled={pending}
            onChange={(event) => onTaskTypeChange(event.target.value)}
            value={formState.taskTypeCode}
          >
            <option value="">{t("createDialog.taskTypePlaceholder")}</option>
            {selectableTaskTypes.map((taskType) => (
              <option key={taskType.code} value={taskType.code}>
                {taskType.displayName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t("createDialog.commissionAmountLabel")}>
          <input
            className={taskInputClassName}
            disabled={pending}
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

      <FormField label={t("createDialog.taskIntroLabel")}>
        <textarea
          className={taskTextareaClassName}
          disabled={pending}
          onChange={(event) => onTaskIntroChange(event.target.value)}
          placeholder={t("createDialog.taskIntroPlaceholder")}
          value={formState.taskIntro}
        />
      </FormField>
    </>
  );
}

function TargetRoleCheckboxGrid({
  disabled,
  onToggle,
  selectedRoles,
  targetRoleOptions,
}: {
  disabled: boolean;
  onToggle: (role: TaskTargetRole) => void;
  selectedRoles: TaskTargetRole[];
  targetRoleOptions: TargetRoleOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-[#23313a]">
        {t("createDialog.targetRolesLabel")}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {targetRoleOptions.map((option) => {
          const checked = selectedRoles.includes(option.role);

          return (
            <label
              className={[
                "flex min-h-11 items-center gap-3 rounded-[16px] border px-3 py-2 text-sm font-medium transition",
                checked
                  ? "border-[#486782] bg-[#eef4f8] text-[#23313a]"
                  : "border-[#dfe6eb] bg-white text-[#60717d]",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#f8fbfd]",
              ].join(" ")}
              key={option.role}
            >
              <input
                checked={checked}
                className="size-4 accent-[#486782]"
                disabled={disabled}
                onChange={() => onToggle(option.role)}
                type="checkbox"
              />
              {getTaskTargetRoleLabel(option.role, sharedT)}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-6 text-[#7b858d]">
        {t("createDialog.targetRolesHint")}
      </p>
    </fieldset>
  );
}

export function CreateTaskAttachmentsField({
  files,
  onFilesChange,
  onRemoveFile,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  const t = useTranslations("Tasks.admin");

  return (
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
              imageMaxPerFile: formatFileSize(IMAGE_UPLOAD_MAX_SIZE_BYTES),
              videoMaxPerFile: formatFileSize(VIDEO_UPLOAD_MAX_SIZE_BYTES),
              otherMaxPerFile: formatFileSize(OTHER_UPLOAD_MAX_SIZE_BYTES),
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

        {files.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {files.map((file, index) => (
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
  );
}

export function EditTaskAttachmentsField({
  task,
}: {
  task: AdminTaskRow;
}) {
  const t = useTranslations("Tasks.admin");

  return (
    <FormField label={t("createDialog.attachmentsLabel")}>
      <div className="rounded-[24px] border border-[#e6ebef] bg-[#f8fbfc] p-5">
        {task.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {task.attachments.map((attachment) => (
              <span
                className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-2 text-xs font-medium text-[#486782]"
                key={attachment.id}
              >
                <Paperclip className="size-3.5" />
                {attachment.original_name}
                <span className="text-[#6f7b85]">
                  {formatFileSize(attachment.file_size_bytes)}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-[#7b858d]">
            {t("editDialog.noAttachments")}
          </p>
        )}
        <p className="mt-4 text-sm leading-7 text-[#6f7b85]">
          {t("editDialog.attachmentsLocked")}
        </p>
      </div>
    </FormField>
  );
}
