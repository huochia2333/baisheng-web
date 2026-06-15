"use client";

import { useMemo, useState } from "react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  DashboardFilterField,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import {
  buildOrderCurrencyOptions,
  deriveRmbAmountValue,
  formatEditableNumericValue,
} from "@/components/dashboard/admin-orders/admin-orders-utils";
import {
  findLatestCnyExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";

import type {
  WholesaleCustomer,
  WholesaleProfile,
} from "@/lib/wholesale";

import { formatCurrency } from "./wholesale-display";
import {
  WholesaleField,
  WholesaleSelect,
  WholesaleSubmitButton,
  WholesaleTextarea,
} from "./wholesale-ui";

const PAYMENT_PLATFORM_OPTIONS = [
  "银行转账",
  "支付宝",
  "微信支付",
  "PayPal",
  "Wise",
  "Payoneer",
  "WorldFirst",
  "PingPong",
  "Stripe",
  "现金",
  "其他",
] as const;

type WholesaleOrderFormDialogProps = {
  customers: WholesaleCustomer[];
  exchangeRates: ExchangeRateRow[];
  onCreateOrder: (formData: FormData) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  salesAccounts: WholesaleProfile[];
};

export function WholesaleOrderFormDialog({
  customers,
  exchangeRates,
  onCreateOrder,
  onOpenChange,
  open,
  pending,
  salesAccounts,
}: WholesaleOrderFormDialogProps) {
  const currencyOptions = useMemo(() => {
    const options = buildOrderCurrencyOptions(exchangeRates);

    return options.some((option) => option.currency === "CNY")
      ? options
      : [
          ...options,
          {
            currency: "CNY",
            dailyExchangeRate: "1",
            transactionRate: "0.99",
          },
        ];
  }, [exchangeRates]);
  const defaultCurrency =
    currencyOptions.find((option) => option.currency === "USD")?.currency ??
    currencyOptions[0]?.currency ??
    "CNY";
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const activeCurrency = selectedCurrency ?? defaultCurrency;
  const selectedRate = useMemo(
    () => findLatestCnyExchangeRate(exchangeRates, activeCurrency),
    [activeCurrency, exchangeRates],
  );
  const settlementExchangeRate =
    formatEditableNumericValue(selectedRate?.daily_exchange_rate) ||
    (activeCurrency === "CNY" ? "1" : "");
  const rmbAmountPreview = deriveRmbAmountValue(
    paymentAmount,
    settlementExchangeRate,
  );
  const resetFormState = () => {
    setSelectedCurrency(null);
    setPaymentAmount("");
  };

  return (
    <DashboardDialog
      description="订单编号会自动生成。填写客户支付、采购、运费和订单月份后，系统会自动计算打包费、毛利、毛利率、单位毛利和业务提成。"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetFormState();
        }

        onOpenChange(nextOpen);
      }}
      open={open}
      title="新建批发订单"
    >
      <form
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onCreateOrder(new FormData(event.currentTarget));
          event.currentTarget.reset();
          resetFormState();
          onOpenChange(false);
        }}
      >
        <WholesaleSelect label="客户名" name="customer_id" required>
          <option value="">选择客户</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.unique_name}
            </option>
          ))}
        </WholesaleSelect>
        <WholesaleSelect label="关联业务员" name="sales_user_id">
          <option value="">暂不分配</option>
          {salesAccounts.map((profile) => (
            <option key={profile.user_id} value={profile.user_id}>
              {profile.name || profile.email}
            </option>
          ))}
        </WholesaleSelect>
        <WholesaleField
          label="小单数量"
          min={0}
          name="small_order_count"
          required
          type="number"
        />
        <WholesaleField
          label="产品采购金额"
          min={0}
          name="product_purchase_amount"
          required
          step="0.01"
          type="number"
        />
        <WholesaleField
          label="国际运费"
          min={0}
          name="international_shipping_fee"
          required
          step="0.01"
          type="number"
        />
        <WholesaleField
          label="其他费用"
          min={0}
          name="other_fee"
          step="0.01"
          type="number"
        />
        <WholesaleField
          label="推荐佣金费用"
          min={0}
          name="referral_commission_fee"
          step="0.01"
          type="number"
        />
        <WholesaleField label="快递公司" name="courier_company" />
        <WholesaleSelect
          label="客户支付币种"
          name="customer_payment_currency"
          onChange={(event) => setSelectedCurrency(event.target.value)}
          required
          value={activeCurrency}
        >
          <option value="">选择币种</option>
          {currencyOptions.map((option) => (
            <option key={option.currency} value={option.currency}>
              {option.currency}
            </option>
          ))}
        </WholesaleSelect>
        <DashboardFilterField label="结汇汇率">
          <input
            className={dashboardFilterInputClassName}
            min={0}
            name="settlement_exchange_rate"
            readOnly
            required
            step="0.000001"
            type="number"
            value={settlementExchangeRate}
          />
          <p className="mt-2 text-xs leading-5 text-[#7b8790]">
            按当前币种汇率自动填入，保存时会再次确认当前汇率。
          </p>
        </DashboardFilterField>
        <DashboardFilterField label="客户支付金额">
          <input
            className={dashboardFilterInputClassName}
            min={0}
            name="customer_payment_amount"
            onChange={(event) => setPaymentAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={paymentAmount}
          />
          {rmbAmountPreview ? (
            <p className="mt-2 text-xs leading-5 text-[#7b8790]">
              预计人民币金额 {formatCurrency(Number(rmbAmountPreview))}
            </p>
          ) : null}
        </DashboardFilterField>
        <WholesaleSelect label="收款平台" name="payment_platform">
          <option value="">选择收款平台</option>
          {PAYMENT_PLATFORM_OPTIONS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </WholesaleSelect>
        <WholesaleField label="订单计入月份" name="order_month" required type="month" />
        <div className="md:col-span-2 xl:col-span-4">
          <WholesaleTextarea label="备注" name="notes" />
        </div>
        <div className="flex justify-end md:col-span-2 xl:col-span-4">
          <WholesaleSubmitButton pending={pending}>保存订单</WholesaleSubmitButton>
        </div>
      </form>
    </DashboardDialog>
  );
}
