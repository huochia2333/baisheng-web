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
  type TaskScope,
} from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import {
  getTaskAssignmentLabel,
  getTaskTeamName,
} from "@/components/dashboard/tasks/tasks-display";

import {
  canReassignTask,
  type AssignmentFormState,
} from "./admin-tasks-utils";
import {
  FormField,
  TaskScopePill,
  TaskStatusPill,
} from "./admin-tasks-ui";
import {
  type PageFeedback,
  taskSelectClassName,
} from "./admin-tasks-view-model-shared";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

type TeamOptions = AdminTasksPageData["teamOptions"];

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

            {!canChangeAssignment ? (
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
