"use client";

import { useMemo, useState } from "react";

import { Network, Plus, Search } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  DashboardFilterField,
  DashboardListSection,
} from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import { normalizeSearchText } from "@/lib/value-normalizers";
import type {
  WholesaleCustomer,
  WholesaleReferral,
} from "@/lib/wholesale";

import { formatDate } from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesalePageShell,
  WholesaleSelect,
  WholesaleSubmitButton,
} from "./wholesale-ui";

type WholesaleReferralsSectionProps = {
  canEdit: boolean;
  customers: WholesaleCustomer[];
  customersById: Map<string, WholesaleCustomer>;
  onCreateReferral: (formData: FormData) => void | Promise<void>;
  pendingKey: string | null;
  referrals: WholesaleReferral[];
};

export function WholesaleReferralsSection({
  canEdit,
  customers,
  customersById,
  onCreateReferral,
  pendingKey,
  referrals,
}: WholesaleReferralsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const tree = useMemo(
    () => buildReferralTree(customers, referrals, customersById),
    [customers, customersById, referrals],
  );
  const filteredTree = useMemo(
    () => filterTree(tree, searchText),
    [searchText, tree],
  );

  return (
    <WholesalePageShell
      actions={
        canEdit ? (
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            <Plus className="size-4" />
            新增推荐关系
          </Button>
        ) : null
      }
      description="展示批发客户之间的推荐关系，用于后续按批发订单汇总客户推荐佣金。"
      eyebrow="批发业务"
      title="推荐树"
    >
      <DashboardListSection
        description={`共 ${referrals.length} 条推荐关系。`}
        title="客户推荐树"
      >
        <div className="mb-5">
          <DashboardFilterField label="搜索客户">
            <div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]">
              <Search className="size-4 text-[#7a8790]" />
              <input
                className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="输入客户名称查找推荐关系"
                type="search"
                value={searchText}
              />
            </div>
          </DashboardFilterField>
        </div>

        {filteredTree.length === 0 ? (
          <WholesaleEmptyState
            description="没有匹配的批发客户推荐关系。"
            icon={<Network className="size-5" />}
            title="暂无推荐关系"
          />
        ) : (
          <div className="space-y-3">
            {filteredTree.map((node) => (
              <ReferralTreeNode key={node.customer.id} node={node} />
            ))}
          </div>
        )}
      </DashboardListSection>

      <DashboardDialog
        description="一个客户只能有一个直接推荐人；推荐佣金会根据被推荐客户的订单汇总。"
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="新增推荐关系"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateReferral(new FormData(event.currentTarget));
            event.currentTarget.reset();
            setDialogOpen(false);
          }}
        >
          <WholesaleSelect label="推荐客户" name="referrer_customer_id" required>
            <option value="">选择推荐客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.unique_name}
              </option>
            ))}
          </WholesaleSelect>
          <WholesaleSelect label="被推荐客户" name="referred_customer_id" required>
            <option value="">选择被推荐客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.unique_name}
              </option>
            ))}
          </WholesaleSelect>
          <div className="flex justify-end md:col-span-2">
            <WholesaleSubmitButton pending={pendingKey === "referral:create"}>
              保存关系
            </WholesaleSubmitButton>
          </div>
        </form>
      </DashboardDialog>
    </WholesalePageShell>
  );
}

type TreeNode = {
  children: TreeNode[];
  createdAt: string | null;
  customer: WholesaleCustomer;
};

function ReferralTreeNode({ node }: { node: TreeNode }) {
  return (
    <div className="rounded-[22px] border border-[#ebe7e1] bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[#23313a]">
            {node.customer.unique_name}
          </p>
          <p className="mt-1 text-sm text-[#71808d]">
            {node.createdAt ? `推荐时间：${formatDate(node.createdAt)}` : "推荐起点"}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
          下级 {node.children.length}
        </span>
      </div>
      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3 border-l border-[#dfe5ea] pl-4">
          {node.children.map((child) => (
            <ReferralTreeNode key={child.customer.id} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildReferralTree(
  customers: WholesaleCustomer[],
  referrals: WholesaleReferral[],
  customersById: Map<string, WholesaleCustomer>,
) {
  const createTreeNode = (
    customer: WholesaleCustomer,
    createdAt: string | null = null,
  ): TreeNode => ({
    children: [],
    createdAt,
    customer,
  });

  const nodeByCustomerId = new Map<string, TreeNode>(
    customers.map((customer) => [
      customer.id,
      createTreeNode(customer),
    ]),
  );
  const childIds = new Set<string>();

  for (const referral of referrals) {
    const referrerNode = nodeByCustomerId.get(referral.referrer_customer_id);
    const referredCustomer = customersById.get(referral.referred_customer_id);

    if (!referrerNode || !referredCustomer) continue;

    const referredNode =
      nodeByCustomerId.get(referral.referred_customer_id) ??
      createTreeNode(referredCustomer, referral.created_at);

    referredNode.createdAt = referral.created_at;
    referrerNode.children.push(referredNode);
    nodeByCustomerId.set(referral.referred_customer_id, referredNode);
    childIds.add(referral.referred_customer_id);
  }

  return [...nodeByCustomerId.values()]
    .filter((node) => !childIds.has(node.customer.id) && node.children.length > 0)
    .sort((a, b) => a.customer.unique_name.localeCompare(b.customer.unique_name, "zh"));
}

function filterTree(nodes: TreeNode[], searchText: string): TreeNode[] {
  const searchValue = normalizeSearchText(searchText);

  if (!searchValue) return nodes;

  return nodes
    .map((node) => filterNode(node, searchValue))
    .filter((node): node is TreeNode => Boolean(node));
}

function filterNode(node: TreeNode, searchValue: string): TreeNode | null {
  const matched = normalizeSearchText(
    `${node.customer.unique_name} ${node.customer.other_names.join(" ")}`,
  ).includes(searchValue);
  const children = node.children
    .map((child) => filterNode(child, searchValue))
    .filter((child): child is TreeNode => Boolean(child));

  if (!matched && children.length === 0) return null;

  return {
    ...node,
    children: matched ? node.children : children,
  };
}
