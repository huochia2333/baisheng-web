import type { CommissionRuleSetting } from "@/lib/commission-settings";
import {
  findLatestCnyExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";
import type {
  WholesaleCustomer,
  WholesaleLogisticsOrder,
  WholesaleOrder,
  WholesaleReferral,
} from "@/lib/wholesale";
import type { WholesaleLogisticsStatus } from "@/lib/wholesale-logistics-statuses";

export type WholesaleReferralCommissionRow = {
  amount: number;
  amountCommissionRmb: number;
  monthKey: string;
  monthlyOrderAmountRmb: number;
  orderNumbers: string[];
  referredCustomerId: string;
  referrerCustomerId: string;
  usdToCnyRate: number | null;
  waybillBonusRmb: number;
  waybillBonusUsd: number;
  waybillCount: number;
};

type ReferralCommissionConfig = {
  orderAmountRate: number;
  waybillBonusTiers: Array<{
    bonusUsd: number;
    threshold: number;
  }>;
};

export function buildReferralCommissionRows({
  commissionRuleSettings,
  customersById,
  exchangeRates,
  logisticsOrders,
  logisticsStatuses,
  orders,
  referrals,
}: {
  commissionRuleSettings: CommissionRuleSetting[];
  customersById: Map<string, WholesaleCustomer>;
  exchangeRates: ExchangeRateRow[];
  logisticsOrders: WholesaleLogisticsOrder[];
  logisticsStatuses: WholesaleLogisticsStatus[];
  orders: WholesaleOrder[];
  referrals: WholesaleReferral[];
}) {
  const config = getReferralCommissionConfig(commissionRuleSettings);
  const usdToCnyRate = readPositiveNumberOrNull(
    findLatestCnyExchangeRate(exchangeRates, "USD")?.daily_exchange_rate,
  );
  const referredToReferrer = new Map(
    referrals.map((referral) => [
      referral.referred_customer_id,
      referral.referrer_customer_id,
    ]),
  );
  const grouped = new Map<string, WholesaleReferralCommissionRow>();
  const countedWaybills = new Set<string>();

  for (const order of orders) {
    const referrerCustomerId = referredToReferrer.get(order.customer_id);

    if (!referrerCustomerId || !customersById.has(referrerCustomerId)) {
      continue;
    }

    const row = getOrCreateRow({
      grouped,
      monthKey: toMonthKey(order.order_month),
      referredCustomerId: order.customer_id,
      referrerCustomerId,
      usdToCnyRate,
    });

    row.monthlyOrderAmountRmb += Number(order.customer_payment_rmb_amount ?? 0);
    row.orderNumbers.push(order.order_number);
  }

  for (const logisticsOrder of logisticsOrders) {
    if (!logisticsOrder.customer_id) {
      continue;
    }

    const referrerCustomerId = referredToReferrer.get(logisticsOrder.customer_id);

    if (!referrerCustomerId || !customersById.has(referrerCustomerId)) {
      continue;
    }

    const row = getOrCreateRow({
      grouped,
      monthKey: toMonthKey(
        logisticsOrder.latest_checkpoint_at ?? logisticsOrder.created_at,
      ),
      referredCustomerId: logisticsOrder.customer_id,
      referrerCustomerId,
      usdToCnyRate,
    });

    addWaybillCount({
      countedWaybills,
      monthKey: row.monthKey,
      referredCustomerId: row.referredCustomerId,
      referrerCustomerId: row.referrerCustomerId,
      row,
      trackingNumber: logisticsOrder.international_tracking_number,
    });
  }

  for (const logisticsStatus of logisticsStatuses) {
    if (!logisticsStatus.customer_id) {
      continue;
    }

    const referrerCustomerId = referredToReferrer.get(logisticsStatus.customer_id);

    if (!referrerCustomerId || !customersById.has(referrerCustomerId)) {
      continue;
    }

    const row = getOrCreateRow({
      grouped,
      monthKey: toMonthKey(
        logisticsStatus.last_checked_at ??
          logisticsStatus.source_updated_at ??
          logisticsStatus.created_at,
      ),
      referredCustomerId: logisticsStatus.customer_id,
      referrerCustomerId,
      usdToCnyRate,
    });

    addWaybillCount({
      countedWaybills,
      monthKey: row.monthKey,
      referredCustomerId: row.referredCustomerId,
      referrerCustomerId: row.referrerCustomerId,
      row,
      trackingNumber: logisticsStatus.tracking_number,
    });
  }

  for (const row of grouped.values()) {
    row.amountCommissionRmb = roundMoney(
      row.monthlyOrderAmountRmb * config.orderAmountRate,
    );
    row.waybillBonusUsd = getWaybillBonusUsd(
      row.waybillCount,
      config.waybillBonusTiers,
    );
    row.waybillBonusRmb = roundMoney(
      row.usdToCnyRate === null ? 0 : row.waybillBonusUsd * row.usdToCnyRate,
    );
    row.amount = roundMoney(row.amountCommissionRmb + row.waybillBonusRmb);
  }

  return [...grouped.values()]
    .filter(
      (row) =>
        row.monthlyOrderAmountRmb > 0 ||
        row.waybillCount > 0 ||
        row.amount > 0,
    )
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
}

function addWaybillCount({
  countedWaybills,
  monthKey,
  referredCustomerId,
  referrerCustomerId,
  row,
  trackingNumber,
}: {
  countedWaybills: Set<string>;
  monthKey: string;
  referredCustomerId: string;
  referrerCustomerId: string;
  row: WholesaleReferralCommissionRow;
  trackingNumber: string;
}) {
  // 同一物流号可能同时存在于旧费用记录和新状态表里。
  // 计佣时按推荐人、被推荐客户、月份和物流号去重，避免重复加运单数。
  const normalizedTrackingNumber = trackingNumber.trim().toUpperCase();
  const key = [
    referrerCustomerId,
    referredCustomerId,
    monthKey,
    normalizedTrackingNumber,
  ].join(":");

  if (countedWaybills.has(key)) {
    return;
  }

  countedWaybills.add(key);
  row.waybillCount += 1;
}

function getOrCreateRow({
  grouped,
  monthKey,
  referredCustomerId,
  referrerCustomerId,
  usdToCnyRate,
}: {
  grouped: Map<string, WholesaleReferralCommissionRow>;
  monthKey: string;
  referredCustomerId: string;
  referrerCustomerId: string;
  usdToCnyRate: number | null;
}) {
  const key = `${referrerCustomerId}:${referredCustomerId}:${monthKey}`;
  const current = grouped.get(key);

  if (current) {
    return current;
  }

  const row: WholesaleReferralCommissionRow = {
    amount: 0,
    amountCommissionRmb: 0,
    monthKey,
    monthlyOrderAmountRmb: 0,
    orderNumbers: [],
    referredCustomerId,
    referrerCustomerId,
    usdToCnyRate,
    waybillBonusRmb: 0,
    waybillBonusUsd: 0,
    waybillCount: 0,
  };

  grouped.set(key, row);
  return row;
}

function getReferralCommissionConfig(
  rows: CommissionRuleSetting[],
): ReferralCommissionConfig {
  const amountRule = rows.find(
    (row) => row.ruleCode === "wholesale_referral_order_amount_rate",
  );
  const bonusRule = rows.find(
    (row) => row.ruleCode === "wholesale_referral_waybill_bonus",
  );

  return {
    orderAmountRate: readPositiveNumber(amountRule?.config.rate, 0.02),
    waybillBonusTiers: [
      {
        bonusUsd: readPositiveNumber(
          bonusRule?.config.tier_3_bonus_usd,
          500,
        ),
        threshold: readPositiveNumber(
          bonusRule?.config.tier_3_threshold,
          5000,
        ),
      },
      {
        bonusUsd: readPositiveNumber(
          bonusRule?.config.tier_2_bonus_usd,
          200,
        ),
        threshold: readPositiveNumber(
          bonusRule?.config.tier_2_threshold,
          1000,
        ),
      },
      {
        bonusUsd: readPositiveNumber(
          bonusRule?.config.tier_1_bonus_usd,
          50,
        ),
        threshold: readPositiveNumber(
          bonusRule?.config.tier_1_threshold,
          200,
        ),
      },
    ],
  };
}

function getWaybillBonusUsd(
  waybillCount: number,
  tiers: ReferralCommissionConfig["waybillBonusTiers"],
) {
  return tiers.find((tier) => waybillCount > tier.threshold)?.bonusUsd ?? 0;
}

function toMonthKey(value: string | null | undefined) {
  if (!value) {
    return new Date().toISOString().slice(0, 7);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 7);
  }

  return date.toISOString().slice(0, 7);
}

function readPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function readPositiveNumberOrNull(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;

  return typeof numberValue === "number" &&
    Number.isFinite(numberValue) &&
    numberValue > 0
    ? numberValue
    : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
