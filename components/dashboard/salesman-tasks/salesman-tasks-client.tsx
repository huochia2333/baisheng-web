"use client";

import { CheckCheck, CircleCheckBig, ClipboardList, Clock3, History, ShieldAlert, Upload, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  SalesmanTaskFocusFilter,
  SalesmanTasksPageData,
  SalesmanTasksSearchParams,
  SalesmanTaskScopeFilter,
} from "@/lib/salesman-tasks";
import { Button } from "@/components/ui/button";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import {
  DashboardFilterPanel,
  DashboardListSection,
} from "@/components/dashboard/dashboard-section-panel";
import { EmptyState, PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import { SalesmanTaskSubmitDialog } from "./salesman-task-submit-dialog";
import {
  FilterField,
  SalesmanTaskCard,
  SearchField,
} from "./salesman-tasks-ui";
import { useSalesmanTasksPage } from "./use-salesman-tasks-page";

export function SalesmanTasksClient({
  initialData,
  initialView,
}: {
  initialData: SalesmanTasksPageData;
  initialView: SalesmanTasksSearchParams;
}) {
  const t = useTranslations("Tasks.salesman");
  const sharedT = useTranslations("Tasks.shared");
  const viewModel = useSalesmanTasksPage({ initialData, initialView });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.pageFeedback ? (
        <PageBanner tone={viewModel.pageFeedback.tone}>{viewModel.pageFeedback.message}</PageBanner>
      ) : null}

      <DashboardSectionHeader
        actions={
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            disabled={!viewModel.canView}
            onClick={() =>
              viewModel.updateFilter(
                "focus",
                viewModel.filters.focus === "completed" ? "all" : "completed",
              )
            }
            type="button"
          >
            <History className="size-4" />
            {viewModel.filters.focus === "completed" ? t("header.allTasks") : t("header.history")}
          </Button>
        }
        badge={t("header.badge")}
        badgeClassName="bg-[#e6edf2]"
        description={t("header.description")}
        metrics={[
          {
            accent: "blue",
            icon: <ClipboardList className="size-5" />,
            key: "all",
            label: t("summary.all"),
            value: viewModel.summary.all,
          },
          {
            accent: "gold",
            icon: <Clock3 className="size-5" />,
            key: "available",
            label: t("summary.available"),
            value: viewModel.summary.available,
          },
          {
            accent: "blue",
            icon: <CircleCheckBig className="size-5" />,
            key: "inProgress",
            label: t("summary.inProgress"),
            value: viewModel.summary.inProgress,
          },
          {
            accent: "gold",
            icon: <Upload className="size-5" />,
            key: "reviewing",
            label: t("summary.reviewing"),
            value: viewModel.summary.reviewing,
          },
          {
            accent: "blue",
            icon: <XCircle className="size-5" />,
            key: "rejected",
            label: t("summary.rejected"),
            value: viewModel.summary.rejected,
          },
          {
            accent: "green",
            icon: <CheckCheck className="size-5" />,
            key: "completed",
            label: t("summary.completed"),
            value: viewModel.summary.completed,
          },
        ]}
        metricsClassName="sm:grid-cols-2 xl:grid-cols-6"
        metricsPlacement="below"
        title={t("header.title")}
      />

      {!viewModel.canView ? (
        <EmptyState
          description={t("states.noPermissionDescription")}
          icon={<ShieldAlert className="size-6" />}
          title={t("states.noPermissionTitle")}
        />
      ) : (
        <>
          <DashboardFilterPanel
            gridClassName="grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.6fr))]"
            variant="standalone"
          >
              <SearchField
                label={t("filters.searchLabel")}
                onChange={(value) => viewModel.updateFilter("searchText", value)}
                placeholder={t("filters.searchPlaceholder")}
                value={viewModel.filters.searchText}
              />

              <FilterField
                label={t("filters.focusLabel")}
                onChange={(value) => viewModel.updateFilter("focus", value as SalesmanTaskFocusFilter)}
                value={viewModel.filters.focus}
              >
                <option value="all">{t("filters.focusAll")}</option>
                <option value="available">{t("filters.focusAvailable")}</option>
                <option value="in_progress">{t("filters.focusInProgress")}</option>
                <option value="reviewing">{t("filters.focusReviewing")}</option>
                <option value="rejected">{t("filters.focusRejected")}</option>
                <option value="completed">{t("filters.focusCompleted")}</option>
              </FilterField>

              <FilterField
                label={t("filters.scopeLabel")}
                onChange={(value) => viewModel.updateFilter("scope", value as SalesmanTaskScopeFilter)}
                value={viewModel.filters.scope}
              >
                <option value="all">{t("filters.scopeAll")}</option>
                <option value="public">{sharedT("scope.public")}</option>
                <option value="team">{sharedT("scope.team")}</option>
              </FilterField>
          </DashboardFilterPanel>

          <DashboardListSection
            bodyClassName="space-y-4"
            description={t("list.description", { count: viewModel.filteredTasks.length })}
            title={t("list.title")}
          >
            {viewModel.filteredTasks.length === 0 ? (
              <EmptyState
                description={t("states.emptyDescription")}
                icon={<ClipboardList className="size-6" />}
                title={t("states.emptyTitle")}
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {viewModel.tasksPagination.items.map((task) => (
                  <SalesmanTaskCard
                    attachmentBusyKey={viewModel.attachmentBusyKey}
                    busy={viewModel.busyTaskId === task.id || viewModel.isRefreshing}
                    key={task.id}
                    onAccept={() => void viewModel.handleAcceptTask(task.id)}
                    onOpenAttachment={(attachment) => void viewModel.handleOpenAttachment(task.id, attachment)}
                    onSubmitReview={() => viewModel.openSubmitDialog(task)}
                    task={task}
                    teamNameById={viewModel.teamNameById}
                    viewerId={viewModel.viewerId}
                  />
                ))}
              </div>
            )}

            <DashboardPaginationControls
              endIndex={viewModel.tasksPagination.endIndex}
              hasNextPage={viewModel.tasksPagination.hasNextPage}
              hasPreviousPage={viewModel.tasksPagination.hasPreviousPage}
              onNextPage={viewModel.goToNextPage}
              onPreviousPage={viewModel.goToPreviousPage}
              page={viewModel.tasksPagination.page}
              pageCount={viewModel.tasksPagination.pageCount}
              startIndex={viewModel.tasksPagination.startIndex}
              totalItems={viewModel.tasksPagination.totalItems}
            />
          </DashboardListSection>
        </>
      )}

      <SalesmanTaskSubmitDialog
        feedback={viewModel.submitDialogFeedback}
        files={viewModel.submitDialogFiles}
        note={viewModel.submitDialogNote}
        onFilesChange={(files) =>
          viewModel.setSubmitDialogFiles((current) => [...current, ...files])
        }
        onNoteChange={viewModel.setSubmitDialogNote}
        onOpenChange={viewModel.handleSubmitDialogOpenChange}
        onRemoveFile={(index) =>
          viewModel.setSubmitDialogFiles((current) =>
            current.filter((_, fileIndex) => fileIndex !== index),
          )
        }
        onSubmit={() => void viewModel.handleSubmitReview()}
        open={viewModel.submitDialogOpen}
        pending={viewModel.submitDialogPending}
        task={viewModel.submitDialogTask}
      />
    </section>
  );
}
