"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import type { AdminPeoplePageData } from "@/lib/admin-people";

import { AdminPeopleAccountDialog } from "./admin-people-account-dialog";
import {
  AdminPeopleDirectorySection,
  AdminPeopleHeaderSection,
  AdminPeopleNoPermissionSection,
  AdminPeopleRecentChangesSection,
} from "./admin-people-sections";
import { useAdminPeopleViewModel } from "./use-admin-people-view-model";

export function AdminPeopleClient({
  initialData,
}: {
  initialData: AdminPeoplePageData;
}) {
  const { locale } = useLocale();
  const viewModel = useAdminPeopleViewModel({ initialData });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.feedback ? (
        <PageBanner tone={viewModel.feedback.tone}>
          {viewModel.feedback.message}
        </PageBanner>
      ) : null}

      <AdminPeopleHeaderSection summary={viewModel.summary} />

      {!viewModel.hasPermission ? (
        <AdminPeopleNoPermissionSection />
      ) : (
        <>
          <AdminPeopleDirectorySection
            currentViewerId={viewModel.currentViewerId}
            filteredPeople={viewModel.filteredPeople}
            locale={locale}
            onAdjustPerson={viewModel.openAccountDialog}
            onRoleFilterChange={viewModel.handleRoleFilterChange}
            onSearchTextChange={viewModel.setSearchText}
            onStatusFilterChange={viewModel.handleStatusFilterChange}
            roleFilter={viewModel.roleFilter}
            roleLabels={viewModel.roleLabels}
            roleOptions={viewModel.roleOptions}
            searchText={viewModel.searchText}
            statusFilter={viewModel.statusFilter}
            statusLabels={viewModel.statusLabels}
            statusOptions={viewModel.statusOptions}
          />

          <AdminPeopleRecentChangesSection
            changes={viewModel.recentChanges}
            locale={locale}
            roleLabels={viewModel.roleLabels}
            statusLabels={viewModel.statusLabels}
          />

          <AdminPeopleAccountDialog
            canSaveDraft={viewModel.canSaveDraft}
            draftNote={viewModel.draftNote}
            draftRole={viewModel.draftRole}
            draftStatus={viewModel.draftStatus}
            onClose={viewModel.closeAccountDialog}
            onDraftNoteChange={viewModel.setDraftNote}
            onDraftRoleChange={viewModel.handleDraftRoleChange}
            onDraftStatusChange={viewModel.handleDraftStatusChange}
            onSave={() => void viewModel.handleSaveAccountChange()}
            open={viewModel.dialogOpen}
            person={viewModel.selectedPerson}
            roleLabels={viewModel.roleLabels}
            roleOptions={viewModel.roleOptions}
            saving={viewModel.saving}
            selectedPersonIsCurrentViewer={viewModel.selectedPersonIsCurrentViewer}
            selectedPersonName={viewModel.selectedPersonName}
            statusLabels={viewModel.statusLabels}
            statusOptions={viewModel.statusOptions}
          />
        </>
      )}
    </section>
  );
}
