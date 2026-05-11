"use client";

import {
  type AdminTaskTargetRoleFilter,
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
import { TaskTypeManagementDialog } from "./admin-task-type-management-dialog";
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
        onManageTaskTypes={viewModel.openTaskTypeDialog}
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
            onTargetRoleChange={(value) =>
              viewModel.updateFilter("targetRole", value as AdminTaskTargetRoleFilter)
            }
            onSearchTextChange={(value) => viewModel.updateFilter("searchText", value)}
            targetRoleOptions={viewModel.targetRoleOptions}
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
        onTargetRoleToggle={viewModel.handleCreateTargetRoleToggle}
        onTaskTypeChange={viewModel.handleCreateTaskTypeChange}
        onSubmit={() => void viewModel.handleCreateTask()}
        onCommissionAmountChange={(value) => viewModel.updateCreateField("commissionAmount", value)}
        onTaskIntroChange={(value) => viewModel.updateCreateField("taskIntro", value)}
        onTaskNameChange={(value) => viewModel.updateCreateField("taskName", value)}
        open={viewModel.createDialogOpen}
        pending={viewModel.createPending}
        targetRoleOptions={viewModel.targetRoleOptions}
        taskTypeOptions={viewModel.taskTypeOptions}
      />

      <EditTaskDialog
        feedback={viewModel.editDialogFeedback}
        formState={viewModel.editFormState}
        onOpenChange={viewModel.handleEditDialogOpenChange}
        onTargetRoleToggle={viewModel.handleEditTargetRoleToggle}
        onSubmit={() => void viewModel.handleEditTask()}
        onTaskTypeChange={viewModel.handleEditTaskTypeChange}
        onCommissionAmountChange={(value) => viewModel.updateEditField("commissionAmount", value)}
        onTaskIntroChange={(value) => viewModel.updateEditField("taskIntro", value)}
        onTaskNameChange={(value) => viewModel.updateEditField("taskName", value)}
        open={viewModel.editDialogOpen}
        pending={viewModel.editPending}
        selectedTask={viewModel.editingTask}
        taskTypeOptions={viewModel.taskTypeOptions}
        targetRoleOptions={viewModel.targetRoleOptions}
      />

      <AssignmentDialog
        feedback={viewModel.assignmentDialogFeedback}
        formState={viewModel.assignmentFormState}
        onOpenChange={viewModel.handleAssignmentDialogOpenChange}
        onTargetRoleToggle={viewModel.handleAssignmentTargetRoleToggle}
        onSubmit={() => void viewModel.handleSaveAssignment()}
        open={viewModel.assignmentDialogOpen}
        pending={viewModel.assignmentPending}
        selectedTask={viewModel.selectedTask}
        targetRoleOptions={viewModel.targetRoleOptions}
      />

      <TaskTypeManagementDialog
        editingTaskType={viewModel.editingTaskType}
        feedback={viewModel.taskTypeDialogFeedback}
        formPending={viewModel.taskTypeFormPending}
        formState={viewModel.taskTypeFormState}
        onDeactivate={(taskType) => void viewModel.handleDeactivateTaskType(taskType)}
        onFieldChange={viewModel.updateTaskTypeFormField}
        onOpenChange={viewModel.handleTaskTypeDialogOpenChange}
        onStartCreate={viewModel.startCreateTaskType}
        onStartEdit={viewModel.startEditTaskType}
        onSubmit={() => void viewModel.handleSubmitTaskType()}
        open={viewModel.taskTypeDialogOpen}
        pendingCode={viewModel.taskTypePendingCode}
        taskTypeOptions={viewModel.taskTypeOptions}
      />
    </section>
  );
}
