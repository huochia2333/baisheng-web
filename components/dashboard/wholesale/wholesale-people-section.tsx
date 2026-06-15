"use client";

import { useMemo, useState } from "react";

import { Plus, RefreshCcw, UserCog, UsersRound } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  DashboardFilterField,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { Button } from "@/components/ui/button";
import { normalizeSearchText } from "@/lib/value-normalizers";
import type {
  WholesaleCustomer,
  WholesaleProfile,
} from "@/lib/wholesale";

import { WholesaleCustomerDetails } from "./wholesale-customer-details";
import { getProfileName } from "./wholesale-display";
import {
  WholesaleAccountDetails,
  WholesaleCustomerDirectory,
  WholesaleSalesAccountDirectory,
} from "./wholesale-people-directories";
import {
  WholesaleField,
  WholesalePageShell,
  WholesaleSelect,
  WholesaleSubmitButton,
  WholesaleTextarea,
} from "./wholesale-ui";

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
        <DashboardListSection
          actions={
            <Button
              className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
              disabled={!hasCustomerFilters}
              onClick={() => {
                setCustomerSearch("");
                setCustomerKindFilter(ALL);
                setCustomerSalesFilter(ALL);
              }}
              type="button"
              variant="outline"
            >
              <RefreshCcw className="size-4" />
              清空筛选
            </Button>
          }
          description={`共 ${customers.length} 位客户，当前显示 ${filteredCustomers.length} 位。`}
          title="批发客户"
        >
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <DashboardFilterField label="搜索客户">
              <input
                className={dashboardFilterInputClassName}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="客户名称、联系方式、来源或业务员"
                type="search"
                value={customerSearch}
              />
            </DashboardFilterField>
            <DashboardFilterField label="客户类型">
              <select
                className={dashboardFilterInputClassName}
                onChange={(event) => setCustomerKindFilter(event.target.value)}
                value={customerKindFilter}
              >
                <option value={ALL}>全部类型</option>
                <option value="registered_account">已注册账户</option>
                <option value="sales_created">业务员登记账户</option>
              </select>
            </DashboardFilterField>
            <DashboardFilterField label="关联业务员">
              <select
                className={dashboardFilterInputClassName}
                onChange={(event) => setCustomerSalesFilter(event.target.value)}
                value={customerSalesFilter}
              >
                <option value={ALL}>全部业务员</option>
                {salesAccounts.map((profile) => (
                  <option key={profile.user_id} value={profile.user_id}>
                    {profile.name || profile.email}
                  </option>
                ))}
              </select>
            </DashboardFilterField>
          </div>
          <WholesaleCustomerDirectory
            customers={filteredCustomers}
            onSelect={(customer) => setSelectedCustomerId(customer.id)}
            profilesById={profilesById}
          />
        </DashboardListSection>
      ) : (
        <DashboardListSection
          actions={
            <Button
              className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
              disabled={!hasAccountFilters}
              onClick={() => {
                setAccountSearch("");
                setAccountRoleFilter(ALL);
                setAccountStatusFilter(ALL);
              }}
              type="button"
              variant="outline"
            >
              <RefreshCcw className="size-4" />
              清空筛选
            </Button>
          }
          description={`共 ${salesAccounts.length} 个账号，当前显示 ${filteredAccounts.length} 个。`}
          title="业务员账户"
        >
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <DashboardFilterField label="搜索账号">
              <input
                className={dashboardFilterInputClassName}
                onChange={(event) => setAccountSearch(event.target.value)}
                placeholder="姓名、邮箱、手机或城市"
                type="search"
                value={accountSearch}
              />
            </DashboardFilterField>
            <DashboardFilterField label="账号身份">
              <select
                className={dashboardFilterInputClassName}
                onChange={(event) => setAccountRoleFilter(event.target.value)}
                value={accountRoleFilter}
                >
                  <option value={ALL}>全部身份</option>
                  <option value="salesman">业务员</option>
                </select>
              </DashboardFilterField>
            <DashboardFilterField label="账号状态">
              <select
                className={dashboardFilterInputClassName}
                onChange={(event) => setAccountStatusFilter(event.target.value)}
                value={accountStatusFilter}
              >
                <option value={ALL}>全部状态</option>
                <option value="active">正常</option>
                <option value="inactive">未启用</option>
                <option value="suspended">已停用</option>
              </select>
            </DashboardFilterField>
          </div>
          <WholesaleSalesAccountDirectory
            accounts={filteredAccounts}
            onSelect={setSelectedProfile}
          />
        </DashboardListSection>
      )}

      <DashboardDialog
        description="客户唯一标识名称用于认领 1688 订单和物流归属，其他名称可填写客户常用昵称或店铺名。"
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
        title="新增批发客户"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateCustomer(new FormData(event.currentTarget));
            event.currentTarget.reset();
            setCreateDialogOpen(false);
          }}
        >
          <WholesaleField label="客户唯一标识名称" name="unique_name" required />
          <WholesaleField label="客户其他名称" name="other_names" />
          <WholesaleField label="联系方式" name="contact_details" />
          <WholesaleField label="客户来源" name="source" />
          <WholesaleSelect label="关联业务员" name="assigned_sales_user_id">
            <option value="">暂不分配</option>
            {salesAccounts.map((profile) => (
              <option key={profile.user_id} value={profile.user_id}>
                {profile.name || profile.email}
              </option>
            ))}
          </WholesaleSelect>
          <div className="md:col-span-2">
            <WholesaleTextarea label="备注" name="notes" />
          </div>
          <div className="flex justify-end md:col-span-2">
            <WholesaleSubmitButton pending={pendingKey === "customer:create"}>
              保存客户
            </WholesaleSubmitButton>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        onOpenChange={(open) => {
          if (!open) setSelectedCustomerId(null);
        }}
        open={Boolean(selectedCustomerId)}
        title={selectedCustomer?.unique_name ?? "客户详情"}
      >
        {selectedCustomer ? (
          <WholesaleCustomerDetails
            canLinkAccount={canLinkCustomerAccount}
            customer={selectedCustomer}
            linkedRegisteredUserIds={linkedRegisteredUserIds}
            onLinkRegisteredUser={onLinkCustomerAccount}
            pendingKey={pendingKey}
            profilesById={profilesById}
            registeredAccounts={registeredAccounts}
          />
        ) : null}
      </DashboardDialog>

      <DashboardDialog
        onOpenChange={(open) => {
          if (!open) setSelectedProfile(null);
        }}
        open={Boolean(selectedProfile)}
        title={selectedProfile?.name || selectedProfile?.email || "账号详情"}
      >
        {selectedProfile ? (
          <WholesaleAccountDetails profile={selectedProfile} />
        ) : null}
      </DashboardDialog>
    </WholesalePageShell>
  );
}
