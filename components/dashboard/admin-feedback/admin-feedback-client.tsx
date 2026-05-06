"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import type { AdminWorkspaceFeedbackPageData } from "@/lib/workspace-feedback";

import {
  AdminFeedbackFilterSection,
  AdminFeedbackHeaderSection,
  AdminFeedbackListSection,
  AdminFeedbackNoPermissionSection,
} from "./admin-feedback-sections";
import { useAdminFeedbackViewModel } from "./use-admin-feedback-view-model";

export function AdminFeedbackClient({
  initialData,
}: {
  initialData: AdminWorkspaceFeedbackPageData;
}) {
  const { locale } = useLocale();
  const viewModel = useAdminFeedbackViewModel({ initialData });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.pageFeedback ? (
        <PageBanner tone={viewModel.pageFeedback.tone}>
          {viewModel.pageFeedback.message}
        </PageBanner>
      ) : null}

      <AdminFeedbackHeaderSection summary={viewModel.summary} />

      {!viewModel.hasPermission ? (
        <AdminFeedbackNoPermissionSection />
      ) : (
        <>
          <AdminFeedbackFilterSection
            onSearchTextChange={viewModel.setSearchText}
            onStatusFilterChange={viewModel.handleStatusFilterChange}
            onTypeFilterChange={viewModel.handleTypeFilterChange}
            searchText={viewModel.searchText}
            statusFilter={viewModel.statusFilter}
            statusLabels={viewModel.statusLabels}
            statusOptions={viewModel.statusOptions}
            typeFilter={viewModel.typeFilter}
            typeLabels={viewModel.typeLabels}
            typeOptions={viewModel.typeOptions}
          />

          <AdminFeedbackListSection
            feedbackItems={viewModel.filteredFeedback}
            locale={locale}
            onStatusChange={viewModel.handleStatusChange}
            pendingStatusId={viewModel.pendingStatusId}
            roleLabels={viewModel.roleLabels}
            statusLabels={viewModel.statusLabels}
            statusOptions={viewModel.statusOptions}
            typeLabels={viewModel.typeLabels}
          />
        </>
      )}
    </section>
  );
}
