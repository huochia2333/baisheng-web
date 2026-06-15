"use client";

import { UserCog, UsersRound } from "lucide-react";

import { DashboardTableFrame } from "@/components/dashboard/dashboard-section-panel";
import type { WholesaleCustomer, WholesaleProfile } from "@/lib/wholesale";

import { WholesaleDetailGrid } from "./wholesale-detail-grid";
import {
  formatDate,
  getProfileName,
  WHOLESALE_STATUS_LABELS,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesaleStatusBadge,
  WholesaleTd,
  WholesaleTh,
} from "./wholesale-ui";

export function WholesaleCustomerDirectory({
  customers,
  onSelect,
  profilesById,
}: {
  customers: WholesaleCustomer[];
  onSelect: (customer: WholesaleCustomer) => void;
  profilesById: Map<string, WholesaleProfile>;
}) {
  if (customers.length === 0) {
    return (
      <WholesaleEmptyState
        description="没有匹配的批发客户。可以调整筛选条件，或新增客户。"
        icon={<UsersRound className="size-5" />}
        title="暂无匹配客户"
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <DashboardTableFrame>
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[24%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr>
                <WholesaleTh className="whitespace-normal">客户</WholesaleTh>
                <WholesaleTh className="whitespace-normal">联系方式</WholesaleTh>
                <WholesaleTh className="whitespace-normal">关联业务员</WholesaleTh>
                <WholesaleTh className="whitespace-normal">客户类型</WholesaleTh>
                <WholesaleTh className="whitespace-normal">登记时间</WholesaleTh>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-[#fcfbf8]"
                  key={customer.id}
                  onClick={() => onSelect(customer)}
                >
                  <WholesaleTd className="whitespace-normal">
                    <p className="font-semibold">{customer.unique_name}</p>
                    <p className="mt-1 text-xs text-[#71808d]">
                      {customer.other_names.length > 0
                        ? customer.other_names.join("、")
                        : "未记录其他名称"}
                    </p>
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    <p>{customer.contact_details ?? "未记录"}</p>
                    <p className="mt-1 text-xs text-[#71808d]">
                      {customer.source ?? "未记录来源"}
                    </p>
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    {getProfileName(profilesById, customer.assigned_sales_user_id)}
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    <WholesaleStatusBadge>
                      {WHOLESALE_STATUS_LABELS[customer.customer_kind]}
                    </WholesaleStatusBadge>
                    <p className="mt-2 text-xs text-[#71808d]">
                      {customer.registered_user_id
                        ? getProfileName(profilesById, customer.registered_user_id)
                        : "未合并注册账号"}
                    </p>
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    {formatDate(customer.created_at)}
                  </WholesaleTd>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      </div>
      <div className="grid gap-3 md:hidden">
        {customers.map((customer) => (
          <button
            className="rounded-[22px] border border-[#ebe7e1] bg-white p-4 text-left shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
            key={customer.id}
            onClick={() => onSelect(customer)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-[#23313a]">
                  {customer.unique_name}
                </p>
                <p className="mt-1 break-words text-sm text-[#6f7b85]">
                  {customer.contact_details ?? "未记录联系方式"}
                </p>
              </div>
              <WholesaleStatusBadge>
                {WHOLESALE_STATUS_LABELS[customer.customer_kind]}
              </WholesaleStatusBadge>
            </div>
            <p className="mt-3 text-sm text-[#6f7b85]">
              业务员：{getProfileName(profilesById, customer.assigned_sales_user_id)}
            </p>
            <p className="mt-1 text-sm text-[#6f7b85]">
              注册账号：
              {customer.registered_user_id
                ? getProfileName(profilesById, customer.registered_user_id)
                : "未合并"}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}

export function WholesaleSalesAccountDirectory({
  accounts,
  onSelect,
}: {
  accounts: WholesaleProfile[];
  onSelect: (profile: WholesaleProfile) => void;
}) {
  if (accounts.length === 0) {
    return (
      <WholesaleEmptyState
        description="没有匹配的业务员账号。"
        icon={<UserCog className="size-5" />}
        title="暂无匹配账号"
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <DashboardTableFrame>
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr>
                <WholesaleTh className="whitespace-normal">姓名</WholesaleTh>
                <WholesaleTh className="whitespace-normal">联系方式</WholesaleTh>
                <WholesaleTh className="whitespace-normal">城市</WholesaleTh>
                <WholesaleTh className="whitespace-normal">身份</WholesaleTh>
                <WholesaleTh className="whitespace-normal">状态</WholesaleTh>
              </tr>
            </thead>
            <tbody>
              {accounts.map((profile) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-[#fcfbf8]"
                  key={profile.user_id}
                  onClick={() => onSelect(profile)}
                >
                  <WholesaleTd className="whitespace-normal">
                    {profile.name ?? "未填写"}
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    <p>{profile.email ?? "未填写邮箱"}</p>
                    <p className="mt-1 text-xs text-[#71808d]">
                      {profile.phone ?? "未填写手机"}
                    </p>
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    {profile.city ?? "未填写"}
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    {profile.role === "promoter" ? "地推" : "业务员"}
                  </WholesaleTd>
                  <WholesaleTd className="whitespace-normal">
                    <WholesaleStatusBadge
                      tone={profile.status === "active" ? "success" : "warning"}
                    >
                      {profile.status === "active" ? "正常" : "未启用"}
                    </WholesaleStatusBadge>
                  </WholesaleTd>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      </div>
      <div className="grid gap-3 md:hidden">
        {accounts.map((profile) => (
          <button
            className="rounded-[8px] border border-[#e4e8ec] bg-white p-4 text-left transition hover:border-[#bfcbd7]"
            key={profile.user_id}
            onClick={() => onSelect(profile)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-[#23313a]">
                  {profile.name ?? "未填写"}
                </p>
                <p className="mt-1 break-words text-sm text-[#6f7b85]">
                  {profile.email ?? profile.phone ?? "未填写联系方式"}
                </p>
              </div>
              <WholesaleStatusBadge
                tone={profile.status === "active" ? "success" : "warning"}
              >
                {profile.status === "active" ? "正常" : "未启用"}
              </WholesaleStatusBadge>
            </div>
            <p className="mt-3 text-sm text-[#6f7b85]">
              身份：{profile.role === "promoter" ? "地推" : "业务员"}
            </p>
            <p className="mt-1 text-sm text-[#6f7b85]">
              城市：{profile.city ?? "未填写"}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}

export function WholesaleAccountDetails({ profile }: { profile: WholesaleProfile }) {
  const rows = [
    { label: "姓名", value: profile.name ?? "未填写" },
    { label: "邮箱", value: profile.email ?? "未填写" },
    { label: "手机号", value: profile.phone ?? "未填写" },
    { label: "城市", value: profile.city ?? "未填写" },
    { label: "身份", value: profile.role === "promoter" ? "地推" : "业务员" },
    { label: "状态", value: profile.status === "active" ? "正常" : "未启用" },
  ];

  return <WholesaleDetailGrid rows={rows} />;
}
