"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  LoaderCircle,
  PencilLine,
  Plus,
} from "lucide-react";

import {
  type AdminTaskRow,
  type AdminTasksPageData,
  type TaskTargetRole,
  type TaskTypeOption,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import {
  canEditTask,
  canReassignTask,
  type CreateTaskFormState,
} from "./admin-tasks-utils";
import {
  CreateTaskAttachmentsField,
  EditTaskAttachmentsField,
  TaskEditSummaryCard,
  TaskFormFields,
} from "./admin-task-form-sections";
import { type PageFeedback } from "./admin-tasks-view-model-shared";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

type TargetRoleOptions = AdminTasksPageData["targetRoleOptions"];

type TaskFormDialogProps = {
  description: string;
  feedback: PageFeedback;
  formState: CreateTaskFormState;
  onCommissionAmountChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onTargetRoleToggle: (role: TaskTargetRole) => void;
  onSubmit: () => void;
  onTaskIntroChange: (value: string) => void;
  onTaskNameChange: (value: string) => void;
  onTaskTypeChange: (taskTypeCode: string) => void;
  open: boolean;
  pending: boolean;
  selectedTask: AdminTaskRow | null;
  submitLabel: string;
  taskTypeOptions: TaskTypeOption[];
  targetRoleOptions: TargetRoleOptions;
  title: string;
};

type CreateTaskDialogProps = Omit<TaskFormDialogProps, "description" | "selectedTask" | "submitLabel" | "title"> & {
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
};

type EditTaskDialogProps = Omit<TaskFormDialogProps, "description" | "submitLabel" | "title">;

export function CreateTaskDialog({
  feedback,
  formState,
  onCommissionAmountChange,
  onFilesChange,
  onOpenChange,
  onRemoveFile,
  onTargetRoleToggle,
  onSubmit,
  onTaskIntroChange,
  onTaskNameChange,
  onTaskTypeChange,
  open,
  pending,
  taskTypeOptions,
  targetRoleOptions,
}: CreateTaskDialogProps) {
  const t = useTranslations("Tasks.admin");

  return (
    <TaskFormDialog
      description={t("createDialog.description")}
      feedback={feedback}
      formState={formState}
      onCommissionAmountChange={onCommissionAmountChange}
      onFilesChange={onFilesChange}
      onOpenChange={onOpenChange}
      onRemoveFile={onRemoveFile}
      onTargetRoleToggle={onTargetRoleToggle}
      onSubmit={onSubmit}
      onTaskIntroChange={onTaskIntroChange}
      onTaskNameChange={onTaskNameChange}
      onTaskTypeChange={onTaskTypeChange}
      open={open}
      pending={pending}
      selectedTask={null}
      submitLabel={t("createDialog.submit")}
      taskTypeOptions={taskTypeOptions}
      targetRoleOptions={targetRoleOptions}
      title={t("createDialog.title")}
    />
  );
}

export function EditTaskDialog({
  feedback,
  formState,
  onCommissionAmountChange,
  onOpenChange,
  onTargetRoleToggle,
  onSubmit,
  onTaskIntroChange,
  onTaskNameChange,
  onTaskTypeChange,
  open,
  pending,
  selectedTask,
  taskTypeOptions,
  targetRoleOptions,
}: EditTaskDialogProps) {
  const t = useTranslations("Tasks.admin");

  if (!selectedTask || !canEditTask(selectedTask)) {
    return null;
  }

  return (
    <TaskFormDialog
      description={t("editDialog.description")}
      feedback={feedback}
      formState={formState}
      onCommissionAmountChange={onCommissionAmountChange}
      onOpenChange={onOpenChange}
      onTargetRoleToggle={onTargetRoleToggle}
      onSubmit={onSubmit}
      onTaskIntroChange={onTaskIntroChange}
      onTaskNameChange={onTaskNameChange}
      onTaskTypeChange={onTaskTypeChange}
      open={open}
      pending={pending}
      selectedTask={selectedTask}
      submitLabel={t("editDialog.submit")}
      taskTypeOptions={taskTypeOptions}
      targetRoleOptions={targetRoleOptions}
      title={t("editDialog.titleWithName", { taskName: selectedTask.task_name })}
    />
  );
}

function TaskFormDialog({
  description,
  feedback,
  formState,
  onCommissionAmountChange,
  onOpenChange,
  onTargetRoleToggle,
  onSubmit,
  onTaskIntroChange,
  onTaskNameChange,
  onTaskTypeChange,
  open,
  pending,
  selectedTask,
  submitLabel,
  taskTypeOptions,
  targetRoleOptions,
  title,
  onFilesChange,
  onRemoveFile,
}: TaskFormDialogProps & {
  onFilesChange?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
}) {
  const t = useTranslations("Tasks.admin");
  const createMode = selectedTask === null;
  const canChangeAssignment = selectedTask ? canReassignTask(selectedTask) : true;

  return open ? (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {createMode ? t("createDialog.cancel") : t("editDialog.cancel")}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : createMode ? (
              <Plus className="size-4" />
            ) : (
              <PencilLine className="size-4" />
            )}
            {submitLabel}
          </Button>
        </>
      }
      description={description}
      onOpenChange={onOpenChange}
      open
      title={title}
    >
      <div className="space-y-6">
        {feedback ? (
          <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner>
        ) : null}

        {selectedTask ? <TaskEditSummaryCard task={selectedTask} /> : null}

        {selectedTask && !canChangeAssignment ? (
          <PageBanner tone="info">{t("editDialog.targetRolesLockedHint")}</PageBanner>
        ) : null}

        <TaskFormFields
          canChangeAssignment={canChangeAssignment}
          formState={formState}
          onCommissionAmountChange={onCommissionAmountChange}
          onTargetRoleToggle={onTargetRoleToggle}
          onTaskIntroChange={onTaskIntroChange}
          onTaskNameChange={onTaskNameChange}
          onTaskTypeChange={onTaskTypeChange}
          pending={pending}
          taskTypeOptions={taskTypeOptions}
          targetRoleOptions={targetRoleOptions}
        />

        {createMode && onFilesChange && onRemoveFile ? (
          <CreateTaskAttachmentsField
            files={formState.files}
            onFilesChange={onFilesChange}
            onRemoveFile={onRemoveFile}
          />
        ) : selectedTask ? (
          <EditTaskAttachmentsField task={selectedTask} />
        ) : null}
      </div>
    </DashboardDialog>
  ) : null;
}
