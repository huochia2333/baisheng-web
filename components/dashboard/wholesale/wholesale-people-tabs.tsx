"use client";

import { RefreshCcw } from "lucide-react";

import {
  DashboardFilterField,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { WholesaleCustomer, WholesaleProfile } from "@/lib/wholesale";

import { WholesaleCustomerDirectory, WholesaleSalesAccountDirectory } from "./wholesale-people-directories";

type WholesaleCustomerPeopleTabProps = {
  customerKindFilter: string;
  customerSalesFilter: string;
  customerSearch: string;
  customers: WholesaleCustomer[];
  filteredCustomers: WholesaleCustomer[];
  hasCustomerFilters: boolean;
  onCustomerKindFilterChange: (value: string) => void;
  onCustomerSalesFilterChange: (value: string) => void;
  onCustomerSearchChange: (value: string) => void;
  onResetCustomerFilters: () => void;
  onSelectCustomer: (customer: WholesaleCustomer) => void;
  profilesById: Map<string, WholesaleProfile>;
  salesAccounts: WholesaleProfile[];
};

type WholesaleSalesAccountPeopleTabProps = {
  accountRoleFilter: string;
  accountSearch: string;
  accountStatusFilter: string;
  filteredAccounts: WholesaleProfile[];
  hasAccountFilters: boolean;
  onAccountRoleFilterChange: (value: string) => void;
  onAccountSearchChange: (value: string) => void;
  onAccountStatusFilterChange: (value: string) => void;
  onResetAccountFilters: () => void;
  onSelectProfile: (profile: WholesaleProfile) => void;
  salesAccounts: WholesaleProfile[];
};

const ALL = "all";

export function WholesaleCustomerPeopleTab({
  customerKindFilter,
  customerSalesFilter,
  customerSearch,
  customers,
  filteredCustomers,
  hasCustomerFilters,
  onCustomerKindFilterChange,
  onCustomerSalesFilterChange,
  onCustomerSearchChange,
  onResetCustomerFilters,
  onSelectCustomer,
  profilesById,
  salesAccounts,
}: WholesaleCustomerPeopleTabProps) {
  return (
    <DashboardListSection
      actions={
        <Button
          className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
          disabled={!hasCustomerFilters}
          onClick={onResetCustomerFilters}
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
            onChange={(event) => onCustomerSearchChange(event.target.value)}
            placeholder="客户名称、联系方式、来源或业务员"
            type="search"
            value={customerSearch}
          />
        </DashboardFilterField>
        <DashboardFilterField label="客户类型">
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) => onCustomerKindFilterChange(event.target.value)}
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
            onChange={(event) => onCustomerSalesFilterChange(event.target.value)}
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
        onSelect={onSelectCustomer}
        profilesById={profilesById}
      />
    </DashboardListSection>
  );
}

export function WholesaleSalesAccountPeopleTab({
  accountRoleFilter,
  accountSearch,
  accountStatusFilter,
  filteredAccounts,
  hasAccountFilters,
  onAccountRoleFilterChange,
  onAccountSearchChange,
  onAccountStatusFilterChange,
  onResetAccountFilters,
  onSelectProfile,
  salesAccounts,
}: WholesaleSalesAccountPeopleTabProps) {
  return (
    <DashboardListSection
      actions={
        <Button
          className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
          disabled={!hasAccountFilters}
          onClick={onResetAccountFilters}
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
            onChange={(event) => onAccountSearchChange(event.target.value)}
            placeholder="姓名、邮箱、手机或城市"
            type="search"
            value={accountSearch}
          />
        </DashboardFilterField>
        <DashboardFilterField label="账号身份">
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) => onAccountRoleFilterChange(event.target.value)}
            value={accountRoleFilter}
          >
            <option value={ALL}>全部身份</option>
            <option value="salesman">业务员</option>
          </select>
        </DashboardFilterField>
        <DashboardFilterField label="账号状态">
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) => onAccountStatusFilterChange(event.target.value)}
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
        onSelect={onSelectProfile}
      />
    </DashboardListSection>
  );
}
