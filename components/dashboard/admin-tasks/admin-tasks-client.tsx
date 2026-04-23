"use client";

import {
  type AdminTaskScopeFilter,
  type AdminTaskStatusFilter,
  type AdminTasksPageData,
  type AdminTasksSearchParams,
} from "@/lib/admin-tasks";

import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import {
  AssignmentDialog,
} from "./admin-tasks-dialogs";
import {
  CreateTaskDialog,
  EditTaskDialog,
} from "./admin-task-form-dialog";
import {
  AdminTasksFiltersSection,
  AdminTasksHeroSection,
  AdminTasksListSection,
  AdminTasksNoPermissionState,
} from "./admin-tasks-sections";
import { useAdminTasksViewModel } from "./use-admin-tasks-view-model";

export function AdminTasksClient({
  initialData,
  initialView,
}: {
  initialData: AdminTasksPageData;
  initialView: AdminTasksSearchParams;
}) {
  const viewModel = useAdminTasksViewModel({
    initialData,
    initialView,
  });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.pageFeedback ? (
        <PageBanner tone={viewModel.pageFeedback.tone}>
          {viewModel.pageFeedback.message}
        </PageBanner>
      ) : null}

      <AdminTasksHeroSection
        canView={viewModel.canView}
        isRefreshing={viewModel.isRefreshing}
        onCreate={viewModel.openCreateDialog}
        onRefresh={viewModel.handleRefresh}
        onToggleCompletedHistory={() =>
          viewModel.updateFilter(
            "status",
            viewModel.filters.status === "completed" ? "all" : "completed",
          )
        }
        showCompletedHistory={viewModel.filters.status === "completed"}
        stats={viewModel.stats}
      />

      {!viewModel.canView ? (
        <AdminTasksNoPermissionState />
      ) : (
        <>
          <AdminTasksFiltersSection
            filters={viewModel.filters}
            onScopeChange={(value) =>
              viewModel.updateFilter("scope", value as AdminTaskScopeFilter)
            }
            onSearchTextChange={(value) => viewModel.updateFilter("searchText", value)}
            onStatusChange={(value) =>
              viewModel.updateFilter("status", value as AdminTaskStatusFilter)
            }
            onTeamChange={(value) => viewModel.updateFilter("teamId", value)}
            teamOptions={viewModel.teamOptions}
          />

          <AdminTasksListSection
            assignmentPendingTaskId={viewModel.assignmentPendingTaskId}
            deletePendingTaskId={viewModel.deletePendingTaskId}
            filteredCount={viewModel.filteredTasks.length}
            onDeleteTask={(task) => void viewModel.handleDeleteTask(task)}
            onEditTask={viewModel.openEditDialog}
            onNextPage={viewModel.goToNextPage}
            onPreviousPage={viewModel.goToPreviousPage}
            onReassignTask={viewModel.openAssignmentDialog}
            tasksPagination={viewModel.tasksPagination}
          />
        </>
      )}

      <CreateTaskDialog
        feedback={viewModel.createDialogFeedback}
        formState={viewModel.createFormState}
        onFilesChange={viewModel.handleCreateFilesChange}
        onOpenChange={viewModel.handleCreateDialogOpenChange}
        onRemoveFile={viewModel.removeCreateFile}
        onScopeChange={viewModel.handleCreateScopeChange}
        onTaskTypeChange={viewModel.handleCreateTaskTypeChange}
        onSubmit={() => void viewModel.handleCreateTask()}
        onCommissionAmountChange={(value) => viewModel.updateCreateField("commissionAmount", value)}
        onTaskIntroChange={(value) => viewModel.updateCreateField("taskIntro", value)}
        onTaskNameChange={(value) => viewModel.updateCreateField("taskName", value)}
        onTeamChange={(value) => viewModel.updateCreateField("teamId", value)}
        open={viewModel.createDialogOpen}
        pending={viewModel.createPending}
        teamOptions={viewModel.teamOptions}
        taskTypeOptions={viewModel.taskTypeOptions}
      />

      <EditTaskDialog
        feedback={viewModel.editDialogFeedback}
        formState={viewModel.editFormState}
        onOpenChange={viewModel.handleEditDialogOpenChange}
        onScopeChange={viewModel.handleEditScopeChange}
        onSubmit={() => void viewModel.handleEditTask()}
        onTaskTypeChange={viewModel.handleEditTaskTypeChange}
        onCommissionAmountChange={(value) => viewModel.updateEditField("commissionAmount", value)}
        onTaskIntroChange={(value) => viewModel.updateEditField("taskIntro", value)}
        onTaskNameChange={(value) => viewModel.updateEditField("taskName", value)}
        onTeamChange={(value) => viewModel.updateEditField("teamId", value)}
        open={viewModel.editDialogOpen}
        pending={viewModel.editPending}
        selectedTask={viewModel.editingTask}
        taskTypeOptions={viewModel.taskTypeOptions}
        teamOptions={viewModel.teamOptions}
      />

      <AssignmentDialog
        feedback={viewModel.assignmentDialogFeedback}
        formState={viewModel.assignmentFormState}
        onOpenChange={viewModel.handleAssignmentDialogOpenChange}
        onScopeChange={viewModel.handleAssignmentScopeChange}
        onSubmit={() => void viewModel.handleSaveAssignment()}
        onTeamChange={viewModel.handleAssignmentTeamChange}
        open={viewModel.assignmentDialogOpen}
        pending={viewModel.assignmentPending}
        selectedTask={viewModel.selectedTask}
        teamOptions={viewModel.teamOptions}
      />
    </section>
  );
}
