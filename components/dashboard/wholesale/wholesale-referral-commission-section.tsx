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
import type { WholesaleCustomer } from "@/lib/wholesale";

import {
  formatCurrency,
  formatNumber,
  getCustomerName,
} from "./wholesale-display";
import {
  WholesaleEmptyState,
  WholesalePageShell,
  WholesaleStatGrid,
  WholesaleTd,
  WholesaleTh,
} from "./wholesale-ui";
import type { WholesaleReferralCommissionRow } from "./wholesale-referral-commission";

const ALL = "all";

export function WholesaleReferralCommissionSection({
  customersById,
  referralRows,
}: {
  customersById: Map<string, WholesaleCustomer>;
  referralRows: WholesaleReferralCommissionRow[];
}) {
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState(ALL);
  const filteredRows = useMemo(() => {
    const searchValue = normalizeSearchText(search);

    return referralRows.filter((row) => {
      if (
        customerFilter !== ALL &&
        row.referrerCustomerId !== customerFilter &&
        row.referredCustomerId !== customerFilter
      ) {
        return false;
      }

      if (!searchValue) return true;

      return [
        getCustomerName(customersById, row.referrerCustomerId),
        getCustomerName(customersById, row.referredCustomerId),
        row.orderNumbers.join(" "),
        row.monthKey,
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [customerFilter, customersById, referralRows, search]);
  const totalReferralCommission = referralRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const chargedWaybillCount = referralRows.reduce(
    (sum, row) => sum + row.waybillCount,
    0,
  );
  const hasActiveFilters = search || customerFilter !== ALL;

  return (
    <WholesalePageShell
      description="汇总批发客户之间产生的推荐佣金，和业务员提成分开查看。"
      eyebrow="批发业务"
      title="佣金"
    >
      <WholesaleStatGrid
        stats={[
          { label: "佣金合计", value: formatCurrency(totalReferralCommission) },
          { label: "月度记录", value: `${referralRows.length}` },
          { label: "当前显示", value: `${filteredRows.length}` },
          { label: "计佣运单", value: `${chargedWaybillCount}` },
        ]}
      />
      <DashboardListSection
        actions={
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            disabled={!hasActiveFilters}
            onClick={() => {
              setSearch("");
              setCustomerFilter(ALL);
            }}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            清空筛选
          </Button>
        }
        description={`共 ${referralRows.length} 条月度佣金记录，当前显示 ${filteredRows.length} 条。`}
        title="客户推荐佣金"
      >
        <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <DashboardFilterField label="搜索佣金">
            <input
              className={dashboardFilterInputClassName}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="推荐客户、被推荐客户或订单编号"
              type="search"
              value={search}
            />
          </DashboardFilterField>
          <DashboardFilterField label="客户">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
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
        {filteredRows.length === 0 ? (
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
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[12%]" />
                    <col className="w-[28%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <WholesaleTh className="whitespace-normal">
                        推荐客户
                      </WholesaleTh>
                      <WholesaleTh className="whitespace-normal">
                        被推荐客户
                      </WholesaleTh>
                      <WholesaleTh className="whitespace-normal">月份</WholesaleTh>
                      <WholesaleTh className="whitespace-normal">
                        计算明细
                      </WholesaleTh>
                      <WholesaleTh className="whitespace-normal">佣金</WholesaleTh>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={`${row.referrerCustomerId}-${row.referredCustomerId}-${row.monthKey}`}
                      >
                        <WholesaleTd className="whitespace-normal">
                          {getCustomerName(customersById, row.referrerCustomerId)}
                        </WholesaleTd>
                        <WholesaleTd className="whitespace-normal">
                          {getCustomerName(customersById, row.referredCustomerId)}
                        </WholesaleTd>
                        <WholesaleTd className="whitespace-normal">
                          {row.monthKey}
                        </WholesaleTd>
                        <WholesaleTd className="whitespace-normal">
                          <ReferralCommissionBreakdown row={row} />
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
              {filteredRows.map((row) => (
                <div
                  className="rounded-[8px] border border-[#e4e8ec] bg-white p-4"
                  key={`${row.referrerCustomerId}-${row.referredCustomerId}-${row.monthKey}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[#23313a]">
                        {getCustomerName(customersById, row.referrerCustomerId)}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#6f7b85]">
                        推荐给 {getCustomerName(customersById, row.referredCustomerId)}
                      </p>
                      <p className="mt-1 text-xs text-[#7b858d]">
                        {row.monthKey}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#486782]">
                      {formatCurrency(row.amount)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <ReferralCommissionBreakdown row={row} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DashboardListSection>
    </WholesalePageShell>
  );
}

function ReferralCommissionBreakdown({
  row,
}: {
  row: WholesaleReferralCommissionRow;
}) {
  return (
    <div className="grid gap-1 text-xs leading-5 text-[#6f7b85]">
      <p>
        订单金额：{formatCurrency(row.monthlyOrderAmountRmb)}，金额佣金{" "}
        {formatCurrency(row.amountCommissionRmb)}
      </p>
      <p>
        运单数量：{formatNumber(row.waybillCount)}，运单奖励{" "}
        {formatCurrency(row.waybillBonusUsd, "USD")}
        {row.waybillBonusUsd > 0 ? ` / ${formatCurrency(row.waybillBonusRmb)}` : ""}
      </p>
      <p className="break-words [overflow-wrap:anywhere]">
        相关订单：{row.orderNumbers.length > 0 ? row.orderNumbers.join("、") : "暂无"}
      </p>
    </div>
  );
}
