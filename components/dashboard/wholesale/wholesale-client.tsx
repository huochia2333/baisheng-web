"use client";

import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import type { WholesalePageData } from "@/lib/wholesale";

import { WholesaleClaimsSection } from "./wholesale-claims-section";
import { WholesaleCommissionSection } from "./wholesale-commission-section";
import { WholesaleCustomersSection } from "./wholesale-customers-section";
import { WholesaleLogisticsSection } from "./wholesale-logistics-section";
import { WholesaleOrdersSection } from "./wholesale-orders-section";
import { WholesalePeopleSection } from "./wholesale-people-section";
import { WholesaleReferralsSection } from "./wholesale-referrals-section";
import { useWholesaleActions } from "./use-wholesale-actions";

export function WholesaleClient({ initialData }: { initialData: WholesalePageData }) {
  const actions = useWholesaleActions();
  const customersById = new Map(
    initialData.customers.map((customer) => [customer.id, customer]),
  );
  const profilesById = new Map(
    initialData.profiles.map((profile) => [profile.user_id, profile]),
  );
  const salesAccounts = initialData.profiles.filter(
    (profile) => profile.role === "salesman",
  );
  const registeredAccounts = initialData.profiles.filter(
    (profile) => profile.role === "client",
  );
  const canAdmin = initialData.currentRole === "administrator";
  const canUseSalesTools =
    initialData.currentRole === "salesman" || initialData.currentRole === "finance";
  const canEdit = canAdmin || canUseSalesTools;
  const canLinkCustomerAccount =
    canAdmin || canUseSalesTools;

  return (
    <div className="space-y-6">
      {actions.feedback ? (
        <PageBanner tone={actions.feedback.tone}>{actions.feedback.message}</PageBanner>
      ) : null}

      {initialData.section === "orders" ? (
        <WholesaleOrdersSection
          canEdit={canEdit}
          canManageAllOrders={canAdmin}
          currentUserId={initialData.currentUserId}
          customers={initialData.customers}
          customersById={customersById}
          exchangeRates={initialData.exchangeRates}
          logisticsOrders={initialData.logisticsOrders}
          logisticsStatuses={initialData.logisticsStatuses}
          onApproveOrderEditRequest={actions.approveOrderEditRequest}
          onMarkOrderSettled={actions.markOrderSettled}
          onCreateOrder={actions.createOrder}
          onRejectOrderEditRequest={actions.rejectOrderEditRequest}
          onRequestOrderEdit={actions.requestOrderEdit}
          onUpdateOrder={actions.updateOrder}
          onUpdateOrderSettlementRate={actions.updateOrderSettlementRate}
          orderChangeLogs={initialData.orderChangeLogs}
          orderEditRequests={initialData.orderEditRequests}
          orderEditWindowDays={initialData.orderEditSettings.directEditWindowDays}
          orders={initialData.orders}
          pendingKey={actions.pendingKey}
          profilesById={profilesById}
          purchaseOrders={initialData.purchaseOrders}
          salesAccounts={salesAccounts}
        />
      ) : null}

      {initialData.section === "order-claims" ? (
        <WholesaleClaimsSection
          actions={actions}
          canAdmin={canAdmin}
          canEdit={canEdit}
          customers={initialData.customers}
          customersById={customersById}
          orders={initialData.orders}
          pendingKey={actions.pendingKey}
          profilesById={profilesById}
          purchaseOrders={initialData.purchaseOrders}
        />
      ) : null}

      {initialData.section === "logistics" ? (
        <WholesaleLogisticsSection
          canEdit={canEdit}
          customers={initialData.customers}
          customersById={customersById}
          logisticsOrders={initialData.logisticsOrders}
          logisticsStatuses={initialData.logisticsStatuses}
          onCreateLogisticsStatus={actions.createLogisticsStatus}
          orders={initialData.orders}
          pendingKey={actions.pendingKey}
        />
      ) : null}

      {initialData.section === "customers" ? (
        <WholesaleCustomersSection
          canEdit={canEdit}
          canLinkCustomerAccount={canLinkCustomerAccount}
          customers={initialData.customers}
          onCreateCustomer={actions.createCustomer}
          onLinkCustomerAccount={actions.linkCustomerAccount}
          pendingKey={actions.pendingKey}
          profilesById={profilesById}
          registeredAccounts={registeredAccounts}
          salesAccounts={salesAccounts}
        />
      ) : null}

      {initialData.section === "people" ? (
        <WholesalePeopleSection
          salesAccounts={salesAccounts}
        />
      ) : null}

      {initialData.section === "referrals" ? (
        <WholesaleReferralsSection
          canEdit={canEdit}
          customers={initialData.customers}
          customersById={customersById}
          onCreateReferral={actions.createReferral}
          pendingKey={actions.pendingKey}
          referrals={initialData.referrals}
        />
      ) : null}

      {initialData.section === "commission" || initialData.section === "incentives" ? (
        <WholesaleCommissionSection
          canAdmin={canAdmin}
          commissionRuleSettings={initialData.commissionRuleSettings}
          commissions={initialData.commissions}
          customersById={customersById}
          exchangeRates={initialData.exchangeRates}
          logisticsOrders={initialData.logisticsOrders}
          logisticsStatuses={initialData.logisticsStatuses}
          onSettleCommission={actions.settleCommission}
          orders={initialData.orders}
          pendingKey={actions.pendingKey}
          profilesById={profilesById}
          referrals={initialData.referrals}
          variant={initialData.section}
        />
      ) : null}
    </div>
  );
}
