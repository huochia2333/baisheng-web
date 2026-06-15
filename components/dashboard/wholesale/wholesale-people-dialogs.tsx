"use client";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import type { WholesaleCustomer, WholesaleProfile } from "@/lib/wholesale";

import { WholesaleCustomerDetails } from "./wholesale-customer-details";
import { WholesaleAccountDetails } from "./wholesale-people-directories";
import {
  WholesaleField,
  WholesaleSelect,
  WholesaleSubmitButton,
  WholesaleTextarea,
} from "./wholesale-ui";

type WholesalePeopleDialogsProps = {
  canLinkCustomerAccount: boolean;
  createDialogOpen: boolean;
  linkedRegisteredUserIds: Set<string>;
  onCreateCustomer: (formData: FormData) => void | Promise<void>;
  onCreateDialogOpenChange: (open: boolean) => void;
  onLinkCustomerAccount: (formData: FormData) => void | Promise<void>;
  onSelectedCustomerIdChange: (id: string | null) => void;
  onSelectedProfileChange: (profile: WholesaleProfile | null) => void;
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  registeredAccounts: WholesaleProfile[];
  salesAccounts: WholesaleProfile[];
  selectedCustomer: WholesaleCustomer | null;
  selectedCustomerId: string | null;
  selectedProfile: WholesaleProfile | null;
};

export function WholesalePeopleDialogs({
  canLinkCustomerAccount,
  createDialogOpen,
  linkedRegisteredUserIds,
  onCreateCustomer,
  onCreateDialogOpenChange,
  onLinkCustomerAccount,
  onSelectedCustomerIdChange,
  onSelectedProfileChange,
  pendingKey,
  profilesById,
  registeredAccounts,
  salesAccounts,
  selectedCustomer,
  selectedCustomerId,
  selectedProfile,
}: WholesalePeopleDialogsProps) {
  return (
    <>
      <DashboardDialog
        description="客户唯一标识名称用于认领 1688 订单和物流归属，其他名称可填写客户常用昵称或店铺名。"
        onOpenChange={onCreateDialogOpenChange}
        open={createDialogOpen}
        title="新增批发客户"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateCustomer(new FormData(event.currentTarget));
            event.currentTarget.reset();
            onCreateDialogOpenChange(false);
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
          if (!open) onSelectedCustomerIdChange(null);
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
          if (!open) onSelectedProfileChange(null);
        }}
        open={Boolean(selectedProfile)}
        title={selectedProfile?.name || selectedProfile?.email || "账号详情"}
      >
        {selectedProfile ? (
          <WholesaleAccountDetails profile={selectedProfile} />
        ) : null}
      </DashboardDialog>
    </>
  );
}
