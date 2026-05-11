"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  LoaderCircle,
  Shuffle,
} from "lucide-react";

import {
  type AdminTaskRow,
  type AdminTasksPageData,
  type TaskTargetRole,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import {
  getTaskTargetRoleLabel,
  getTaskTargetRolesLabel,
} from "@/components/dashboard/tasks/tasks-display";

import {
  canReassignTask,
  type AssignmentFormState,
} from "./admin-tasks-utils";
import {
  TaskStatusPill,
} from "./admin-tasks-ui";
import { type PageFeedback } from "./admin-tasks-view-model-shared";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

type TargetRoleOptions = AdminTasksPageData["targetRoleOptions"];

export function AssignmentDialog({
  feedback,
  formState,
  onOpenChange,
  onTargetRoleToggle,
  onSubmit,
  open,
  pending,
  selectedTask,
  targetRoleOptions,
}: {
  feedback: PageFeedback;
  formState: AssignmentFormState;
  onOpenChange: (open: boolean) => void;
  onTargetRoleToggle: (role: TaskTargetRole) => void;
  onSubmit: () => void;
  open: boolean;
  pending: boolean;
  selectedTask: AdminTaskRow | null;
  targetRoleOptions: TargetRoleOptions;
}) {
  const t = useTranslations("Tasks.admin");
  const sharedT = useTranslations("Tasks.shared");
  const canChangeAssignment = selectedTask ? canReassignTask(selectedTask) : false;

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
            disabled={pending || !selectedTask || !canChangeAssignment}
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
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-[#23313a]">
                {selectedTask.task_name}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                {t("assignmentDialog.currentTargetRoles", {
                  targetRoles: getTaskTargetRolesLabel(selectedTask.target_roles, sharedT),
                })}
              </p>
            </div>

            {!canChangeAssignment ? (
              <PageBanner tone="info">{t("assignmentDialog.viewOnlyNotice")}</PageBanner>
            ) : (
              <div>
                <p className="mb-2 block text-sm font-semibold text-[#23313a]">
                  {t("assignmentDialog.targetRolesLabel")}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {targetRoleOptions.map((option) => {
                    const checked = formState.targetRoles.includes(option.role);

                    return (
                      <label
                        className={[
                          "flex min-h-11 items-center gap-3 rounded-[16px] border px-3 py-2 text-sm font-medium transition",
                          checked
                            ? "border-[#486782] bg-[#eef4f8] text-[#23313a]"
                            : "border-[#dfe6eb] bg-white text-[#60717d]",
                          pending
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-[#f8fbfd]",
                        ].join(" ")}
                        key={option.role}
                      >
                        <input
                          checked={checked}
                          className="size-4 accent-[#486782]"
                          disabled={pending}
                          onChange={() => onTargetRoleToggle(option.role)}
                          type="checkbox"
                        />
                        {getTaskTargetRoleLabel(option.role, sharedT)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardDialog>
  ) : null;
}
