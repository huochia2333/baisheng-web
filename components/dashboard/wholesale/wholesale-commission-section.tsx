"use client";

import { useMemo, useState } from "react";

import { Calculator, RefreshCcw } from "lucide-react";

import {
  DashboardFilterField,
  DashboardListSection,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import { normalizeSearchText } from "@/lib/value-normalizers";
import type {
  WholesaleCommission,
  WholesaleCustomer,
  WholesaleOrder,
  WholesaleProfile,
  WholesaleReferral,
} from "@/lib/wholesale";

import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  getCustomerName,
  getProfileName,
  WHOLESALE_STATUS_LABELS,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesalePageShell,
  WholesaleStatGrid,
  WholesaleStatusBadge,
  WholesaleTd,
  WholesaleTh,
} from "./wholesale-ui";

type WholesaleCommissionSectionProps = {
  canAdmin: boolean;
  commissions: WholesaleCommission[];
  customersById: Map<string, WholesaleCustomer>;
  onSettleCommission: (commissionId: string) => void;
  orders: WholesaleOrder[];
  pendingKey: string | null;
  profilesById: Map<string, WholesaleProfile>;
  referrals: WholesaleReferral[];
  variant: "commission" | "incentives";
};

const ALL = "all";

export function WholesaleCommissionSection({
  canAdmin,
  commissions,
  customersById,
  onSettleCommission,
  orders,
  pendingKey,
  profilesById,
  referrals,
  variant,
}: WholesaleCommissionSectionProps) {
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionCustomerFilter, setCommissionCustomerFilter] = useState(ALL);
  const [incentiveSearch, setIncentiveSearch] = useState("");
  const [incentiveStatusFilter, setIncentiveStatusFilter] = useState(ALL);
  const [incentiveSalesFilter, setIncentiveSalesFilter] = useState(ALL);
  const orderById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );
  const referralRows = useMemo(
    () => buildReferralCommissionRows(orders, referrals, customersById),
    [customersById, orders, referrals],
  );
  const filteredReferralRows = useMemo(() => {
    const searchValue = normalizeSearchText(commissionSearch);

    return referralRows.filter((row) => {
      if (
        commissionCustomerFilter !== ALL &&
        row.referrerCustomerId !== commissionCustomerFilter &&
        row.referredCustomerId !== commissionCustomerFilter
      ) {
        return false;
      }

      if (!searchValue) return true;

      return [
        getCustomerName(customersById, row.referrerCustomerId),
        getCustomerName(customersById, row.referredCustomerId),
        row.orderNumbers.join(" "),
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [commissionCustomerFilter, commissionSearch, customersById, referralRows]);
  const filteredCommissions = useMemo(() => {
    const searchValue = normalizeSearchText(incentiveSearch);

    return commissions.filter((commission) => {
      const order = orderById.get(commission.order_id);

      if (
        incentiveStatusFilter !== ALL &&
        commission.status !== incentiveStatusFilter
      ) {
        return false;
      }

      if (
        incentiveSalesFilter !== ALL &&
        (commission.beneficiary_user_id ?? "") !== incentiveSalesFilter
      ) {
        return false;
      }

      if (!searchValue) return true;

      return [
        order?.order_number ?? "",
        getCustomerName(customersById, commission.customer_id),
        getProfileName(profilesById, commission.beneficiary_user_id),
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [
    commissions,
    customersById,
    incentiveSalesFilter,
    incentiveSearch,
    incentiveStatusFilter,
    orderById,
    profilesById,
  ]);
  const totalCommission = commissions.reduce(
    (sum, row) => sum + Number(row.commission_amount_rmb ?? 0),
    0,
  );
  const pendingCommission = commissions
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + Number(row.commission_amount_rmb ?? 0), 0);
  const totalReferralCommission = referralRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const salesAccounts = useMemo(() => {
    const userIds = new Set(
      commissions
        .map((commission) => commission.beneficiary_user_id)
        .filter((value): value is string => Boolean(value)),
    );

    return [...userIds].map((userId) => ({
      label: getProfileName(profilesById, userId),
      userId,
    }));
  }, [commissions, profilesById]);

  if (variant === "commission") {
    const hasActiveFilters =
      commissionSearch || commissionCustomerFilter !== ALL;

    return (
      <WholesalePageShell
        description="汇总批发客户之间产生的推荐佣金，和业务员提成分开查看。"
        eyebrow="批发业务"
        title="佣金"
      >
        <WholesaleStatGrid
          stats={[
            { label: "佣金合计", value: formatCurrency(totalReferralCommission) },
            { label: "佣金记录", value: `${referralRows.length}` },
            { label: "当前显示", value: `${filteredReferralRows.length}` },
            { label: "关联订单", value: `${orders.length}` },
          ]}
        />
        <DashboardListSection
          actions={
            <Button
              className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
              disabled={!hasActiveFilters}
              onClick={() => {
                setCommissionSearch("");
                setCommissionCustomerFilter(ALL);
              }}
              type="button"
              variant="outline"
            >
              <RefreshCcw className="size-4" />
              清空筛选
            </Button>
          }
          description={`共 ${referralRows.length} 条佣金记录，当前显示 ${filteredReferralRows.length} 条。`}
          title="客户推荐佣金"
        >
          <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <DashboardFilterField label="搜索佣金">
              <input
                className={dashboardFilterInputClassName}
                onChange={(event) => setCommissionSearch(event.target.value)}
                placeholder="推荐客户、被推荐客户或订单编号"
                type="search"
                value={commissionSearch}
              />
            </DashboardFilterField>
            <DashboardFilterField label="客户">
              <select
                className={dashboardFilterInputClassName}
                onChange={(event) => setCommissionCustomerFilter(event.target.value)}
                value={commissionCustomerFilter}
              >
                <option value={ALL}>全部客户</option>
                {[...customersById.values()].map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.unique_name}
                  </option>
                ))}
              </select>
            </DashboardFilterField>
          </div>
          {filteredReferralRows.length === 0 ? (
            <WholesaleEmptyState
              description="没有匹配的客户推荐佣金。"
              icon={<Calculator className="size-5" />}
              title="暂无匹配佣金"
            />
          ) : (
            <>
              <div className="hidden md:block">
                <DashboardTableFrame>
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[28%]" />
                  <col className="w-[26%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr>
                    <WholesaleTh className="whitespace-normal">推荐客户</WholesaleTh>
                    <WholesaleTh className="whitespace-normal">被推荐客户</WholesaleTh>
                    <WholesaleTh className="whitespace-normal">相关订单</WholesaleTh>
                    <WholesaleTh className="whitespace-normal">佣金</WholesaleTh>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferralRows.map((row) => (
                    <tr key={`${row.referrerCustomerId}-${row.referredCustomerId}`}>
                      <WholesaleTd className="whitespace-normal">
                        {getCustomerName(customersById, row.referrerCustomerId)}
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        {getCustomerName(customersById, row.referredCustomerId)}
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        {row.orderNumbers.join("、")}
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        {formatCurrency(row.amount)}
                      </WholesaleTd>
                    </tr>
                  ))}
                </tbody>
                </table>
                </DashboardTableFrame>
              </div>
              <div className="grid gap-3 md:hidden">
                {filteredReferralRows.map((row) => (
                  <div
                    className="rounded-[8px] border border-[#e4e8ec] bg-white p-4"
                    key={`${row.referrerCustomerId}-${row.referredCustomerId}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-[#23313a]">
                          {getCustomerName(customersById, row.referrerCustomerId)}
                        </p>
                        <p className="mt-1 break-words text-sm text-[#6f7b85]">
                          推荐给 {getCustomerName(customersById, row.referredCustomerId)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#486782]">
                        {formatCurrency(row.amount)}
                      </p>
                    </div>
                    <p className="mt-3 break-words text-sm text-[#6f7b85]">
                      相关订单：{row.orderNumbers.join("、")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DashboardListSection>
      </WholesalePageShell>
    );
  }

  const hasActiveFilters =
    incentiveSearch || incentiveStatusFilter !== ALL || incentiveSalesFilter !== ALL;

  return (
    <WholesalePageShell
      description="批发订单保存后会自动计算业务提成：订单人民币金额 10000 以内按毛利 10%，大于 10000 按毛利 12%。"
      eyebrow="批发业务"
      title="提成"
    >
      <WholesaleStatGrid
        stats={[
          { label: "提成合计", value: formatCurrency(totalCommission) },
          { label: "待结算提成", value: formatCurrency(pendingCommission) },
          { label: "提成记录", value: `${commissions.length}` },
          { label: "当前显示", value: `${filteredCommissions.length}` },
        ]}
      />

      <DashboardListSection
        actions={
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            disabled={!hasActiveFilters}
            onClick={() => {
              setIncentiveSearch("");
              setIncentiveStatusFilter(ALL);
              setIncentiveSalesFilter(ALL);
            }}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            清空筛选
          </Button>
        }
        description={`共 ${commissions.length} 条提成记录，当前显示 ${filteredCommissions.length} 条。`}
        title="业务员提成"
      >
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <DashboardFilterField label="搜索提成">
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => setIncentiveSearch(event.target.value)}
              placeholder="订单编号、客户或业务员"
              type="search"
              value={incentiveSearch}
            />
          </DashboardFilterField>
          <DashboardFilterField label="业务员">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setIncentiveSalesFilter(event.target.value)}
              value={incentiveSalesFilter}
            >
              <option value={ALL}>全部业务员</option>
              {salesAccounts.map((account) => (
                <option key={account.userId} value={account.userId}>
                  {account.label}
                </option>
              ))}
            </select>
          </DashboardFilterField>
          <DashboardFilterField label="结算状态">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setIncentiveStatusFilter(event.target.value)}
              value={incentiveStatusFilter}
            >
              <option value={ALL}>全部状态</option>
              <option value="pending">待结算</option>
              <option value="settled">已结算</option>
              <option value="cancelled">已取消</option>
            </select>
          </DashboardFilterField>
        </div>

        {filteredCommissions.length === 0 ? (
          <WholesaleEmptyState
            description="批发订单保存后，系统会按毛利自动生成提成记录。"
            icon={<Calculator className="size-5" />}
            title="暂无匹配提成"
          />
        ) : (
          <>
            <div className="hidden md:block">
              <DashboardTableFrame>
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr>
                  <WholesaleTh className="whitespace-normal">订单编号</WholesaleTh>
                  <WholesaleTh className="whitespace-normal">客户</WholesaleTh>
                  <WholesaleTh className="whitespace-normal">业务员</WholesaleTh>
                  <WholesaleTh className="whitespace-normal">订单金额</WholesaleTh>
                  <WholesaleTh className="whitespace-normal">提成</WholesaleTh>
                  <WholesaleTh className="whitespace-normal">状态</WholesaleTh>
                  {canAdmin ? <WholesaleTh className="whitespace-normal">结算</WholesaleTh> : null}
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => {
                  const order = orderById.get(commission.order_id);

                  return (
                    <tr key={commission.id}>
                      <WholesaleTd className="whitespace-normal">
                        <p className="font-semibold">
                          {order?.order_number ?? "未找到订单"}
                        </p>
                        <p className="mt-1 text-xs text-[#71808d]">
                          {formatDateTime(commission.calculated_at)}
                        </p>
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        {getCustomerName(customersById, commission.customer_id)}
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        {getProfileName(profilesById, commission.beneficiary_user_id)}
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        <p>{formatCurrency(commission.order_payment_rmb_amount)}</p>
                        <p className="mt-1 text-xs text-[#71808d]">
                          毛利 {formatCurrency(commission.gross_profit_rmb)}
                        </p>
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        <p>{formatCurrency(commission.commission_amount_rmb)}</p>
                        <p className="mt-1 text-xs text-[#71808d]">
                          {formatPercent(commission.commission_rate)}
                        </p>
                      </WholesaleTd>
                      <WholesaleTd className="whitespace-normal">
                        <WholesaleStatusBadge
                          tone={
                            commission.status === "settled"
                              ? "success"
                              : commission.status === "cancelled"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {WHOLESALE_STATUS_LABELS[commission.status]}
                        </WholesaleStatusBadge>
                      </WholesaleTd>
                      {canAdmin ? (
                        <WholesaleTd className="whitespace-normal">
                          <Button
                            className="h-9 rounded-full bg-[#486782] px-3 text-xs font-semibold text-white hover:bg-[#3e5f79] disabled:opacity-60"
                            disabled={
                              commission.status !== "pending" ||
                              pendingKey === "commission:settle"
                            }
                            onClick={() => onSettleCommission(commission.id)}
                            type="button"
                          >
                            标记结算
                          </Button>
                        </WholesaleTd>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
              </table>
              </DashboardTableFrame>
            </div>
            <div className="grid gap-3 md:hidden">
              {filteredCommissions.map((commission) => {
                const order = orderById.get(commission.order_id);

                return (
                  <div
                    className="rounded-[8px] border border-[#e4e8ec] bg-white p-4"
                    key={commission.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-[#23313a]">
                          {order?.order_number ?? "未找到订单"}
                        </p>
                        <p className="mt-1 break-words text-sm text-[#6f7b85]">
                          {getCustomerName(customersById, commission.customer_id)}
                        </p>
                      </div>
                      <WholesaleStatusBadge
                        tone={
                          commission.status === "settled"
                            ? "success"
                            : commission.status === "cancelled"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {WHOLESALE_STATUS_LABELS[commission.status]}
                      </WholesaleStatusBadge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#5e6b75]">
                      <p>
                        业务员：
                        {getProfileName(profilesById, commission.beneficiary_user_id)}
                      </p>
                      <p>订单金额：{formatCurrency(commission.order_payment_rmb_amount)}</p>
                      <p>毛利：{formatCurrency(commission.gross_profit_rmb)}</p>
                      <p>
                        提成：{formatCurrency(commission.commission_amount_rmb)}
                        （{formatPercent(commission.commission_rate)}）
                      </p>
                    </div>
                    {canAdmin ? (
                      <Button
                        className="mt-4 h-9 rounded-full bg-[#486782] px-3 text-xs font-semibold text-white hover:bg-[#3e5f79] disabled:opacity-60"
                        disabled={
                          commission.status !== "pending" ||
                          pendingKey === "commission:settle"
                        }
                        onClick={() => onSettleCommission(commission.id)}
                        type="button"
                      >
                        标记结算
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DashboardListSection>
    </WholesalePageShell>
  );
}

function buildReferralCommissionRows(
  orders: WholesaleOrder[],
  referrals: WholesaleReferral[],
  customersById: Map<string, WholesaleCustomer>,
) {
  const referredToReferrer = new Map(
    referrals.map((referral) => [
      referral.referred_customer_id,
      referral.referrer_customer_id,
    ]),
  );
  const grouped = new Map<
    string,
    {
      amount: number;
      orderNumbers: string[];
      referredCustomerId: string;
      referrerCustomerId: string;
    }
  >();

  for (const order of orders) {
    const referrerCustomerId = referredToReferrer.get(order.customer_id);
    const amount = Number(order.referral_commission_fee ?? 0);

    if (!referrerCustomerId || amount <= 0 || !customersById.has(referrerCustomerId)) {
      continue;
    }

    const key = `${referrerCustomerId}:${order.customer_id}`;
    const current =
      grouped.get(key) ??
      {
        amount: 0,
        orderNumbers: [],
        referredCustomerId: order.customer_id,
        referrerCustomerId,
      };

    current.amount += amount;
    current.orderNumbers.push(order.order_number);
    grouped.set(key, current);
  }

  return [...grouped.values()];
}
