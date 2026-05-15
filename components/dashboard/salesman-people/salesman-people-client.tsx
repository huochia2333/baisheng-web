"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import type { SalesmanPeoplePageData } from "@/lib/salesman-people";

import {
  SalesmanPeopleDirectorySection,
  SalesmanPeopleHeaderSection,
  SalesmanPeopleNoPermissionSection,
} from "./salesman-people-sections";
import { SalesmanCustomerTypeDialog } from "./salesman-customer-type-dialog";
import { useSalesmanPeopleViewModel } from "./use-salesman-people-view-model";

export function SalesmanPeopleClient({
  initialData,
}: {
  initialData: SalesmanPeoplePageData;
}) {
  const { locale } = useLocale();
  const viewModel = useSalesmanPeopleViewModel({ initialData });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.feedback ? (
        <PageBanner tone={viewModel.feedback.tone}>
          {viewModel.feedback.message}
        </PageBanner>
      ) : null}

      <SalesmanPeopleHeaderSection summary={viewModel.summary} />

      {!viewModel.hasPermission ? (
        <SalesmanPeopleNoPermissionSection />
      ) : (
        <>
          <SalesmanPeopleDirectorySection
            customerTypeLabels={viewModel.customerTypeLabels}
            filteredCustomers={viewModel.filteredCustomers}
            locale={locale}
            onAdjustCustomerType={viewModel.openCustomerTypeDialog}
            onSearchTextChange={viewModel.setSearchText}
            searchText={viewModel.searchText}
          />

          <SalesmanCustomerTypeDialog
            canSave={viewModel.canSaveDraft}
            customer={viewModel.selectedCustomer}
            customerTypeLabels={viewModel.customerTypeLabels}
            customerTypeOptions={viewModel.customerTypeOptions}
            draftType={viewModel.draftType}
            onClose={viewModel.closeCustomerTypeDialog}
            onDraftTypeChange={viewModel.handleDraftTypeChange}
            onSave={() => void viewModel.handleSaveCustomerType()}
            open={viewModel.dialogOpen}
            saving={viewModel.saving}
          />
        </>
      )}
    </section>
  );
}
