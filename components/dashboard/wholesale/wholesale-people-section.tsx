"use client";

import { useMemo, useState } from "react";

import { Plus, UserCog, UsersRound } from "lucide-react";

import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { Button } from "@/components/ui/button";
import { normalizeSearchText } from "@/lib/value-normalizers";
import type { WholesaleCustomer, WholesaleProfile } from "@/lib/wholesale";

import { getProfileName } from "./wholesale-display";
import { WholesalePeopleDialogs } from "./wholesale-people-dialogs";
import {
  WholesaleCustomerPeopleTab,
  WholesaleSalesAccountPeopleTab,
} from "./wholesale-people-tabs";
import { WholesalePageShell } from "./wholesale-ui";

type WholesalePeopleSectionProps = {
  canEdit: boolean;
  canLinkCustomerAccount: boolean;
  customers: WholesaleCustomer[];
  onCreateCustomer: (formData: FormData) => void | Promise<void>;
  onLinkCustomerAccount: (formData: FormData) => void | Promise<void>;
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  registeredAccounts: WholesaleProfile[];
  salesAccounts: WholesaleProfile[];
};

type PeopleTab = "customers" | "sales-accounts";

const ALL = "all";

export function WholesalePeopleSection({
  canEdit,
  canLinkCustomerAccount,
  customers,
  onCreateCustomer,
  onLinkCustomerAccount,
  pendingKey,
  profilesById,
  registeredAccounts,
  salesAccounts,
}: WholesalePeopleSectionProps) {
  const [activeTab, setActiveTab] = useState<PeopleTab>("customers");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<WholesaleProfile | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerKindFilter, setCustomerKindFilter] = useState(ALL);
  const [customerSalesFilter, setCustomerSalesFilter] = useState(ALL);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountRoleFilter, setAccountRoleFilter] = useState(ALL);
  const [accountStatusFilter, setAccountStatusFilter] = useState(ALL);
  const linkedRegisteredUserIds = useMemo(
    () =>
      new Set(
        customers
          .map((customer) => customer.registered_user_id)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    [customers],
  );
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );
  const filteredCustomers = useMemo(() => {
    const searchValue = normalizeSearchText(customerSearch);

    return customers.filter((customer) => {
      if (customerKindFilter !== ALL && customer.customer_kind !== customerKindFilter) {
        return false;
      }

      if (
        customerSalesFilter !== ALL &&
        (customer.assigned_sales_user_id ?? "") !== customerSalesFilter
      ) {
        return false;
      }

      if (!searchValue) return true;

      const assignedSales = getProfileName(profilesById, customer.assigned_sales_user_id);
      const linkedProfile = customer.registered_user_id
        ? profilesById.get(customer.registered_user_id)
        : null;

      return [
        customer.unique_name,
        customer.other_names.join(" "),
        customer.contact_details ?? "",
        customer.source ?? "",
        customer.notes ?? "",
        assignedSales,
        linkedProfile?.name ?? "",
        linkedProfile?.email ?? "",
        linkedProfile?.phone ?? "",
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [
    customerKindFilter,
    customerSalesFilter,
    customerSearch,
    customers,
    profilesById,
  ]);
  const filteredAccounts = useMemo(() => {
    const searchValue = normalizeSearchText(accountSearch);

    return salesAccounts.filter((profile) => {
      if (accountRoleFilter !== ALL && profile.role !== accountRoleFilter) {
        return false;
      }

      if (accountStatusFilter !== ALL && profile.status !== accountStatusFilter) {
        return false;
      }

      if (!searchValue) return true;

      return [
        profile.name ?? "",
        profile.email ?? "",
        profile.phone ?? "",
        profile.city ?? "",
        profile.role ?? "",
        profile.status ?? "",
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [accountRoleFilter, accountSearch, accountStatusFilter, salesAccounts]);
  const hasCustomerFilters =
    customerSearch || customerKindFilter !== ALL || customerSalesFilter !== ALL;
  const hasAccountFilters =
    accountSearch || accountRoleFilter !== ALL || accountStatusFilter !== ALL;

  return (
    <WholesalePageShell
      actions={
        canEdit && activeTab === "customers" ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            onClick={() => setCreateDialogOpen(true)}
            type="button"
          >
            <Plus className="size-4" />
            新增客户
          </Button>
        ) : null
      }
      description="统一管理批发客户档案，以及可以承接批发客户和订单的业务员账号。"
      eyebrow="批发业务"
      title="人员管理"
    >
      <DashboardSegmentedTabs
        onChange={setActiveTab}
        options={[
          {
            badge: customers.length,
            icon: <UsersRound className="size-4" />,
            key: "customers",
            label: "批发客户",
          },
          {
            badge: salesAccounts.length,
            icon: <UserCog className="size-4" />,
            key: "sales-accounts",
            label: "业务员账户",
          },
        ]}
        value={activeTab}
      />

      {activeTab === "customers" ? (
        <WholesaleCustomerPeopleTab
          customerKindFilter={customerKindFilter}
          customerSalesFilter={customerSalesFilter}
          customerSearch={customerSearch}
          customers={customers}
          filteredCustomers={filteredCustomers}
          hasCustomerFilters={Boolean(hasCustomerFilters)}
          onCustomerKindFilterChange={setCustomerKindFilter}
          onCustomerSalesFilterChange={setCustomerSalesFilter}
          onCustomerSearchChange={setCustomerSearch}
          onResetCustomerFilters={() => {
            setCustomerSearch("");
            setCustomerKindFilter(ALL);
            setCustomerSalesFilter(ALL);
          }}
          onSelectCustomer={(customer) => setSelectedCustomerId(customer.id)}
          profilesById={profilesById}
          salesAccounts={salesAccounts}
        />
      ) : (
        <WholesaleSalesAccountPeopleTab
          accountRoleFilter={accountRoleFilter}
          accountSearch={accountSearch}
          accountStatusFilter={accountStatusFilter}
          filteredAccounts={filteredAccounts}
          hasAccountFilters={Boolean(hasAccountFilters)}
          onAccountRoleFilterChange={setAccountRoleFilter}
          onAccountSearchChange={setAccountSearch}
          onAccountStatusFilterChange={setAccountStatusFilter}
          onResetAccountFilters={() => {
            setAccountSearch("");
            setAccountRoleFilter(ALL);
            setAccountStatusFilter(ALL);
          }}
          onSelectProfile={setSelectedProfile}
          salesAccounts={salesAccounts}
        />
      )}

      <WholesalePeopleDialogs
        canLinkCustomerAccount={canLinkCustomerAccount}
        createDialogOpen={createDialogOpen}
        linkedRegisteredUserIds={linkedRegisteredUserIds}
        onCreateCustomer={onCreateCustomer}
        onCreateDialogOpenChange={setCreateDialogOpen}
        onLinkCustomerAccount={onLinkCustomerAccount}
        onSelectedCustomerIdChange={setSelectedCustomerId}
        onSelectedProfileChange={setSelectedProfile}
        pendingKey={pendingKey}
        profilesById={profilesById}
        registeredAccounts={registeredAccounts}
        salesAccounts={salesAccounts}
        selectedCustomer={selectedCustomer}
        selectedCustomerId={selectedCustomerId}
        selectedProfile={selectedProfile}
      />
    </WholesalePageShell>
  );
}
