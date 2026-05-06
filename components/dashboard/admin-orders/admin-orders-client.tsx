"use client";

import { useCallback } from "react";

import { ReceiptText, ShieldAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { type AdminOrdersPageData } from "@/lib/admin-orders";
import { type ExchangeRatesPageData } from "@/lib/exchange-rates";

import { EmptyState, PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates/exchange-rates-client";

import {
  OrdersHeaderSection,
  OrdersTableSection,
} from "./admin-orders-sections";
import { type OrdersClientMode } from "./admin-orders-client-config";
import {
  AdminOrdersTabs,
  type AdminOrdersTab,
} from "./admin-orders-tabs";
import {
  OrderDetailsDialog,
  OrderFormDialog,
} from "./admin-orders-ui";
import { useAdminOrdersViewModel } from "./use-admin-orders-view-model";

export function AdminOrdersClient({
  initialExchangeRatesData = null,
  initialData,
  mode = "admin",
}: {
  initialExchangeRatesData?: ExchangeRatesPageData | null;
  initialData: AdminOrdersPageData;
  mode?: OrdersClientMode;
}) {
  const t = useTranslations("Orders");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewModel = useAdminOrdersViewModel({ initialData, mode });
  const canShowTabs = mode === "admin" && initialExchangeRatesData !== null;
  const activeTab: AdminOrdersTab =
    canShowTabs && searchParams.get("tab") === "exchange-rates"
      ? "exchange-rates"
      : "orders";

  const handleTabChange = useCallback(
    (tab: AdminOrdersTab) => {
      if (!canShowTabs) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (tab === "exchange-rates") {
        nextSearchParams.set("tab", "exchange-rates");
      } else {
        nextSearchParams.delete("tab");
      }

      const queryString = nextSearchParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [canShowTabs, pathname, router, searchParams],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {canShowTabs ? (
        <AdminOrdersTabs activeTab={activeTab} onTabChange={handleTabChange} />
      ) : null}

      {activeTab === "exchange-rates" && initialExchangeRatesData ? (
        <ExchangeRatesClient
          embedded
          homeHref="/admin/orders"
          initialData={initialExchangeRatesData}
          mode="manage"
        />
      ) : (
        <>
      {viewModel.pageFeedback ? (
        <PageBanner tone={viewModel.pageFeedback.tone}>
          {viewModel.pageFeedback.message}
        </PageBanner>
      ) : null}

      <OrdersHeaderSection
        badge={viewModel.viewConfig.badge}
        canCreateOrders={viewModel.canCreateOrders}
        canOpenCreateDialog={viewModel.canOpenCreateDialog}
        createTitle={viewModel.viewConfig.createTitle}
        description={viewModel.viewConfig.description}
        noCreateTargetHint={viewModel.viewConfig.noCreateTargetHint}
        onCreate={viewModel.openCreateDialog}
        summary={viewModel.summary}
        title={viewModel.viewConfig.title}
      />

      {viewModel.canViewOrders === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewModel.viewConfig.noPermissionDescription}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noViewPermissionTitle")}
          />
        </section>
      ) : viewModel.totalOrdersCount === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={viewModel.viewConfig.emptyDescription}
            icon={<ReceiptText className="size-6" />}
            title={t("states.emptyTitle")}
          />
        </section>
      ) : (
        <OrdersTableSection
          canViewOrderCosts={viewModel.canViewOrderCosts}
          filters={viewModel.filters}
          matchedOrdersCount={viewModel.matchedOrdersCount}
          onClearFilters={viewModel.clearFilters}
          onOrderEntryUserChange={viewModel.handleOrderEntryUserChange}
          onOrderNumberChange={viewModel.handleOrderNumberChange}
          onOrderingUserChange={viewModel.handleOrderingUserChange}
          onSelectOrder={viewModel.handleSelectOrder}
          orderTypeMetaById={viewModel.orderTypeMetaById}
          pagination={viewModel.ordersPaginationState}
          rows={viewModel.orders}
          showCreatedAtColumn={viewModel.viewConfig.showCreatedAtColumn}
          showOrderEntryColumn={viewModel.viewConfig.showOrderEntryColumn}
          showOrderEntryFilter={viewModel.viewConfig.showOrderEntryFilter}
          showOrderingColumn={viewModel.viewConfig.showOrderingColumn}
          showOrderingFilter={viewModel.viewConfig.showOrderingFilter}
          totalOrdersCount={viewModel.totalOrdersCount}
          userLabelById={viewModel.userLabelById}
        />
      )}

      <OrderFormDialog
        description={viewModel.viewConfig.createDescription}
        feedback={viewModel.createDialogFeedback}
        formState={viewModel.createFormState}
        lockExchangeRateFields
        lockOrderEntryUser={viewModel.viewConfig.lockOrderEntryToCurrentViewer}
        mode="create"
        open={viewModel.createDialogOpen}
        orderDiscountOptions={viewModel.orderDiscountOptions}
        orderEntryUserOptions={viewModel.orderEntryUserOptions}
        orderTypeOptions={viewModel.orderTypeOptions}
        orderUserOptions={viewModel.userOptions}
        orderingUserOptions={viewModel.orderingUserOptions}
        pending={viewModel.createPending}
        purchaseOrderTypeOptions={viewModel.purchaseOrderTypeOptions}
        serviceOrderTypeOptions={viewModel.serviceOrderTypeOptions}
        showCostField={viewModel.canViewOrderCosts}
        submitLabel={viewModel.viewConfig.createTitle}
        title={viewModel.viewConfig.createTitle}
        onFieldChange={viewModel.updateCreateFormField}
        onOpenChange={viewModel.handleCreateDialogOpenChange}
        onSubmit={viewModel.handleCreateOrder}
      />

      <OrderFormDialog
        description={t("dialogs.editDescription")}
        feedback={viewModel.editDialogFeedback}
        formState={viewModel.editFormState}
        lockCurrencyField
        lockExchangeRateFields
        mode="edit"
        open={viewModel.editDialogOpen}
        orderDiscountOptions={viewModel.orderDiscountOptions}
        orderTypeOptions={viewModel.orderTypeOptions}
        orderUserOptions={viewModel.userOptions}
        pending={viewModel.editPending}
        purchaseOrderTypeOptions={viewModel.purchaseOrderTypeOptions}
        serviceOrderTypeOptions={viewModel.serviceOrderTypeOptions}
        showCostField={viewModel.canViewOrderCosts}
        supplementaryLoading={viewModel.editSupplementaryLoading}
        submitLabel={t("dialogs.saveChanges")}
        title={t("dialogs.editTitle")}
        onFieldChange={viewModel.updateEditFormField}
        onOpenChange={viewModel.handleEditDialogOpenChange}
        onSubmit={viewModel.handleEditOrder}
      />

      <OrderDetailsDialog
        canDelete={viewModel.canDeleteOrders}
        canEdit={viewModel.canEditOrders}
        canViewCost={viewModel.canViewOrderCosts}
        deletePending={viewModel.deletePending}
        forceDeletePending={viewModel.forceDeletePending}
        onDelete={viewModel.handleDeleteOrder}
        onEdit={viewModel.openEditDialog}
        onForceDelete={viewModel.handleForceDeleteOrder}
        onOpenChange={viewModel.handleOrderDetailsOpenChange}
        order={viewModel.selectedOrder}
        orderTypeMetaById={viewModel.orderTypeMetaById}
        showOrderEntryUser={viewModel.viewConfig.showOrderEntryDetail}
        showOrderingUser={viewModel.viewConfig.showOrderingDetail}
        supabase={viewModel.supabase}
        userLabelById={viewModel.userLabelById}
      />
        </>
      )}
    </section>
  );
}
