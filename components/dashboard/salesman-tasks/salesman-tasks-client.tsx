"use client";

import { CheckCheck, CircleCheckBig, ClipboardList, Clock3, ShieldAlert, Upload, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  SalesmanTaskFocusFilter,
  SalesmanTasksPageData,
  SalesmanTasksSearchParams,
  SalesmanTaskScopeFilter,
} from "@/lib/salesman-tasks";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
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

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e6edf2] px-3 py-1 text-xs font-semibold text-[#486782]">
              {t("header.badge")}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              {t("header.title")}
            </h2>
            <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{t("header.description")}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <DashboardMetricCard
            accent="blue"
            icon={<ClipboardList className="size-5" />}
            label={t("summary.all")}
            value={viewModel.summary.all}
          />
          <DashboardMetricCard
            accent="gold"
            icon={<Clock3 className="size-5" />}
            label={t("summary.available")}
            value={viewModel.summary.available}
          />
          <DashboardMetricCard
            accent="blue"
            icon={<CircleCheckBig className="size-5" />}
            label={t("summary.inProgress")}
            value={viewModel.summary.inProgress}
          />
          <DashboardMetricCard
            accent="gold"
            icon={<Upload className="size-5" />}
            label={t("summary.reviewing")}
            value={viewModel.summary.reviewing}
          />
          <DashboardMetricCard
            accent="blue"
            icon={<XCircle className="size-5" />}
            label={t("summary.rejected")}
            value={viewModel.summary.rejected}
          />
          <DashboardMetricCard
            accent="green"
            icon={<CheckCheck className="size-5" />}
            label={t("summary.completed")}
            value={viewModel.summary.completed}
          />
        </div>
      </section>

      {!viewModel.canView ? (
        <EmptyState
          description={t("states.noPermissionDescription")}
          icon={<ShieldAlert className="size-6" />}
          title={t("states.noPermissionTitle")}
        />
      ) : (
        <>
          <section className="rounded-[26px] border border-white/85 bg-white/80 p-5 shadow-[0_14px_32px_rgba(96,113,128,0.06)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.6fr))]">
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
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{t("list.title")}</h3>
              <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                {t("list.description", { count: viewModel.filteredTasks.length })}
              </p>
            </div>

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
          </section>
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
