"use client";

import { useCallback, useOptimistic, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AdminTaskMediaLibraryData } from "@/lib/admin-task-media-library";
import type { AdminTaskReviewBoardData } from "@/lib/admin-task-reviews";
import {
  type AdminTaskTargetRoleFilter,
  type AdminTasksPageData,
  type AdminTasksSearchParams,
} from "@/lib/admin-tasks";

import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import {
  AssignmentDialog,
} from "./admin-tasks-dialogs";
import { AdminTaskFilePreviewDialog } from "./admin-task-file-preview-dialog";
import { AdminTaskMediaLibrarySection } from "./admin-task-media-library-section";
import {
  AdminTaskReviewSection,
} from "./admin-task-review-section";
import {
  CreateTaskDialog,
  EditTaskDialog,
} from "./admin-task-form-dialog";
import { TaskTypeManagementDialog } from "./admin-task-type-management-dialog";
import {
  AdminTasksBoardTabs,
  type AdminTasksBoard,
} from "./admin-tasks-board-tabs";
import {
  AdminTasksFiltersSection,
  AdminTasksHeroSection,
  AdminTasksListSection,
  AdminTasksNoPermissionState,
} from "./admin-tasks-sections";
import { useAdminTaskMediaLibrary } from "./use-admin-task-media-library";
import { useAdminTaskReviewBoard } from "./use-admin-task-review-board";
import { useAdminTasksViewModel } from "./use-admin-tasks-view-model";

export function AdminTasksClient({
  initialData,
  initialMediaLibraryData,
  initialReviewData,
  initialView,
}: {
  initialData: AdminTasksPageData;
  initialMediaLibraryData: AdminTaskMediaLibraryData;
  initialReviewData: AdminTaskReviewBoardData;
  initialView: AdminTasksSearchParams;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewModel = useAdminTasksViewModel({
    initialData,
    initialView,
  });
  const reviewBoard = useAdminTaskReviewBoard(initialReviewData);
  const mediaLibrary = useAdminTaskMediaLibrary(initialMediaLibraryData);
  const routeActiveBoard: AdminTasksBoard =
    searchParams.get("tab") === "reviews"
      ? "reviews"
      : searchParams.get("tab") === "media-library"
        ? "mediaLibrary"
        : "tasks";
  const [isBoardSwitchPending, startBoardSwitchTransition] = useTransition();
  const [activeBoard, setOptimisticActiveBoard] = useOptimistic(
    routeActiveBoard,
    (_currentBoard, nextBoard: AdminTasksBoard) => nextBoard,
  );

  const handleBoardChange = useCallback(
    (board: AdminTasksBoard) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (board === "reviews") {
        nextSearchParams.set("tab", "reviews");
      } else if (board === "mediaLibrary") {
        nextSearchParams.set("tab", "media-library");
      } else {
        nextSearchParams.delete("tab");
      }

      const queryString = nextSearchParams.toString();
      startBoardSwitchTransition(() => {
        setOptimisticActiveBoard(board);
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [
      pathname,
      router,
      searchParams,
      setOptimisticActiveBoard,
      startBoardSwitchTransition,
    ],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      <AdminTasksBoardTabs
        activeBoard={activeBoard}
        onBoardChange={handleBoardChange}
        pendingBoard={isBoardSwitchPending ? activeBoard : null}
      />

      {activeBoard === "reviews" ? (
        <>
          {reviewBoard.pageFeedback ? (
            <PageBanner tone={reviewBoard.pageFeedback.tone}>
              {reviewBoard.pageFeedback.message}
            </PageBanner>
          ) : null}

          <AdminTaskReviewSection
            assetBusyKey={reviewBoard.assetBusyKey}
            busyRows={reviewBoard.busyRows}
            canView={reviewBoard.canView}
            isRefreshing={reviewBoard.isRefreshing}
            onOpenAsset={reviewBoard.handleOpenAsset}
            onRefresh={reviewBoard.handleRefresh}
            onReviewAction={reviewBoard.handleTaskReview}
            rows={reviewBoard.rows}
          />

          <AdminTaskFilePreviewDialog
            downloadBusy={reviewBoard.previewDownloadBusy}
            file={reviewBoard.previewAsset}
            onDownload={(file) => void reviewBoard.handlePreviewDownload(file)}
            onOpenChange={reviewBoard.closePreview}
          />
        </>
      ) : activeBoard === "mediaLibrary" ? (
        <>
          {mediaLibrary.pageFeedback ? (
            <PageBanner tone={mediaLibrary.pageFeedback.tone}>
              {mediaLibrary.pageFeedback.message}
            </PageBanner>
          ) : null}

          <AdminTaskMediaLibrarySection
            busyItemId={mediaLibrary.busyItemId}
            canView={mediaLibrary.canView}
            filteredItems={mediaLibrary.filteredItems}
            isRefreshing={mediaLibrary.isRefreshing}
            items={mediaLibrary.items}
            kindFilter={mediaLibrary.kindFilter}
            onDownload={(item) => void mediaLibrary.handleDownload(item)}
            onKindFilterChange={mediaLibrary.setKindFilter}
            onPreview={(item) => void mediaLibrary.handlePreview(item)}
            onRefresh={mediaLibrary.handleRefresh}
            onSearchTextChange={mediaLibrary.setSearchText}
            searchText={mediaLibrary.searchText}
          />

          <AdminTaskFilePreviewDialog
            downloadBusy={mediaLibrary.previewDownloadBusy}
            file={mediaLibrary.previewItem}
            onDownload={(file) => void mediaLibrary.handlePreviewDownload(file)}
            onOpenChange={mediaLibrary.closePreview}
          />
        </>
      ) : (
        <>
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
            onAcceptanceLimitChange={(value) =>
              viewModel.updateCreateField("acceptanceLimit", value)
            }
            onAcceptanceUnlimitedChange={(value) =>
              viewModel.updateCreateField("acceptanceUnlimited", value)
            }
            onReviewRequiresAttachmentChange={(value) =>
              viewModel.updateCreateField("reviewRequiresAttachment", value)
            }
            onFilesChange={viewModel.handleCreateFilesChange}
            onOpenChange={viewModel.handleCreateDialogOpenChange}
            onRemoveFile={viewModel.removeCreateFile}
            onTargetRoleToggle={viewModel.handleCreateTargetRoleToggle}
            onTaskTypeChange={viewModel.handleCreateTaskTypeChange}
            onSubmit={() => void viewModel.handleCreateTask()}
            onCommissionAmountChange={(value) =>
              viewModel.updateCreateField("commissionAmount", value)
            }
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
            onAcceptanceLimitChange={(value) =>
              viewModel.updateEditField("acceptanceLimit", value)
            }
            onAcceptanceUnlimitedChange={(value) =>
              viewModel.updateEditField("acceptanceUnlimited", value)
            }
            onReviewRequiresAttachmentChange={(value) =>
              viewModel.updateEditField("reviewRequiresAttachment", value)
            }
            onOpenChange={viewModel.handleEditDialogOpenChange}
            onTargetRoleToggle={viewModel.handleEditTargetRoleToggle}
            onSubmit={() => void viewModel.handleEditTask()}
            onTaskTypeChange={viewModel.handleEditTaskTypeChange}
            onCommissionAmountChange={(value) =>
              viewModel.updateEditField("commissionAmount", value)
            }
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
        </>
      )}
    </section>
  );
}
