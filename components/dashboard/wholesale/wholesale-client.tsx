"use client";

import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import type { WholesalePageData } from "@/lib/wholesale";

import { WholesaleClaimsSection } from "./wholesale-claims-section";
import { WholesaleCommissionSection } from "./wholesale-commission-section";
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
  const canEdit = canAdmin || initialData.currentRole === "salesman";
  const canLinkCustomerAccount =
    canAdmin || initialData.currentRole === "salesman";

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
          onMarkOrderSettled={actions.markOrderSettled}
          onCreateOrder={actions.createOrder}
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
          onCreateLogisticsOrder={actions.createLogisticsOrder}
          orders={initialData.orders}
          pendingKey={actions.pendingKey}
        />
      ) : null}

      {initialData.section === "people" ? (
        <WholesalePeopleSection
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
          commissions={initialData.commissions}
          customersById={customersById}
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
