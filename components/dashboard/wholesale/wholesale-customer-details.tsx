"use client";

import { Link2 } from "lucide-react";

import type { WholesaleCustomer, WholesaleProfile } from "@/lib/wholesale";

import { WholesaleDetailGrid } from "./wholesale-detail-grid";
import {
  formatDate,
  getProfileName,
  WHOLESALE_STATUS_LABELS,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesaleSelect,
  WholesaleStatusBadge,
  WholesaleSubmitButton,
} from "./wholesale-ui";

type WholesaleCustomerDetailsProps = {
  canLinkAccount: boolean;
  customer: WholesaleCustomer;
  linkedRegisteredUserIds: Set<string>;
  onLinkRegisteredUser: (formData: FormData) => void | Promise<void>;
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  registeredAccounts: WholesaleProfile[];
};

export function WholesaleCustomerDetails({
  canLinkAccount,
  customer,
  linkedRegisteredUserIds,
  onLinkRegisteredUser,
  pendingKey,
  profilesById,
  registeredAccounts,
}: WholesaleCustomerDetailsProps) {
  const linkedProfile = customer.registered_user_id
    ? profilesById.get(customer.registered_user_id)
    : null;
  const availableRegisteredAccounts = registeredAccounts.filter(
    (profile) => !linkedRegisteredUserIds.has(profile.user_id),
  );
  const rows = [
    { label: "客户唯一名称", value: customer.unique_name },
    {
      label: "其他名称",
      value:
        customer.other_names.length > 0
          ? customer.other_names.join("、")
          : "未记录",
    },
    { label: "联系方式", value: customer.contact_details ?? "未记录" },
    { label: "客户来源", value: customer.source ?? "未记录" },
    {
      label: "关联业务员",
      value: getProfileName(profilesById, customer.assigned_sales_user_id),
    },
    {
      label: "客户类型",
      value: (
        <WholesaleStatusBadge>
          {WHOLESALE_STATUS_LABELS[customer.customer_kind]}
        </WholesaleStatusBadge>
      ),
    },
    {
      label: "关联注册账号",
      value: linkedProfile ? getRegisteredAccountLabel(linkedProfile) : "未关联",
    },
    { label: "登记时间", value: formatDate(customer.created_at) },
    { label: "备注", value: customer.notes ?? "未记录" },
  ];

  return (
    <div className="space-y-5">
      <WholesaleDetailGrid rows={rows} />
      {customer.registered_user_id ? (
        <p className="rounded-[18px] border border-[#dfe8df] bg-[#f5fbf5] px-4 py-3 text-sm leading-6 text-[#42614b]">
          这个客户已经和注册账号合并，客户登录后会看到自己名下的批发订单、物流和佣金。
        </p>
      ) : canLinkAccount ? (
        <div className="rounded-[18px] border border-[#ebe7e1] bg-white p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#263640]">
            <Link2 className="size-4 text-[#486782]" />
            关联合并注册账号
          </div>
          {availableRegisteredAccounts.length > 0 ? (
            <form
              className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void onLinkRegisteredUser(new FormData(event.currentTarget));
              }}
            >
              <input name="customer_id" type="hidden" value={customer.id} />
              <WholesaleSelect
                label="选择客户注册账号"
                name="registered_user_id"
                required
              >
                <option value="">选择要合并的账号</option>
                {availableRegisteredAccounts.map((profile) => (
                  <option key={profile.user_id} value={profile.user_id}>
                    {getRegisteredAccountLabel(profile)}
                  </option>
                ))}
              </WholesaleSelect>
              <div className="flex items-end justify-end">
                <WholesaleSubmitButton
                  pending={pendingKey === `customer:link-account:${customer.id}`}
                >
                  合并账号
                </WholesaleSubmitButton>
              </div>
              <p className="text-sm leading-6 text-[#6f7b85] sm:col-span-2">
                合并后，这个注册账号会承接当前客户名下已有和后续的批发订单、物流、佣金。
              </p>
            </form>
          ) : (
            <WholesaleEmptyState
              description="当前没有未合并的客户注册账号。客户完成注册后，就可以在这里选择并合并。"
              icon={<Link2 className="size-5" />}
              title="暂无可合并账号"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function getRegisteredAccountLabel(profile: WholesaleProfile) {
  const displayName = profile.name?.trim() || "未填写姓名";
  const contact = [profile.email, profile.phone].filter(Boolean).join(" / ");

  return contact ? `${displayName}（${contact}）` : displayName;
}
