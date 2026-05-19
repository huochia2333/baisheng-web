import {
  findLatestCnyExchangeRate,
  normalizeCurrencyCode,
  sortExchangeRateRows,
  type ExchangeRateRow,
  type ExchangeRateSyncPairRow,
} from "@/lib/exchange-rates";

import {
  formatEditableNumericValue,
  parseNumericValue,
} from "./admin-orders-display";

export type OrderCurrencyOption = {
  currency: string;
  dailyExchangeRate: string;
  transactionRate: string;
};

export function buildOrderCurrencyOptions(
  orderCurrencyRates: ExchangeRateRow[],
  syncPairs: ExchangeRateSyncPairRow[] = [],
): OrderCurrencyOption[] {
  const rateByCurrency = new Map<string, ExchangeRateRow>();

  for (const row of sortExchangeRateRows(orderCurrencyRates)) {
    const currency = normalizeCurrencyCode(row.original_currency);

    if (
      !currency ||
      normalizeCurrencyCode(row.target_currency) !== "CNY" ||
      rateByCurrency.has(currency) ||
      !formatEditableNumericValue(row.daily_exchange_rate)
    ) {
      continue;
    }

    rateByCurrency.set(currency, row);
  }

  const orderedCurrencies = getOrderedCurrencyCodes(rateByCurrency, syncPairs);

  return orderedCurrencies.map((currency) => {
    const dailyExchangeRate = formatEditableNumericValue(
      rateByCurrency.get(currency)?.daily_exchange_rate,
    );

    return {
      currency,
      dailyExchangeRate,
      transactionRate: deriveTransactionRateValue(dailyExchangeRate),
    };
  });
}

export function getDefaultOrderCurrency(orderCurrencyRates: ExchangeRateRow[]) {
  const options = buildOrderCurrencyOptions(orderCurrencyRates);

  return (
    options.find((option) => option.currency === "USD")?.currency ??
    options[0]?.currency ??
    ""
  );
}

export function applyOrderExchangeRateToOrderForm<
  FormState extends {
    originalCurrency: string;
    amount: string;
    dailyExchangeRate: string;
    transactionRate: string;
    rmbAmount: string;
  },
>(formState: FormState, orderCurrencyRates: ExchangeRateRow[]): FormState {
  const rate = findLatestCnyExchangeRate(
    orderCurrencyRates,
    formState.originalCurrency,
  );
  const dailyExchangeRate = formatEditableNumericValue(rate?.daily_exchange_rate);

  return {
    ...formState,
    dailyExchangeRate,
    transactionRate: deriveTransactionRateValue(dailyExchangeRate),
    rmbAmount: deriveRmbAmountValue(formState.amount, dailyExchangeRate),
  };
}

export function deriveTransactionRateValue(
  value: number | string | null | undefined,
) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "";
  }

  const derived = (parsed * 0.99).toFixed(6);
  return derived.replace(/\.?0+$/, "");
}

export function deriveRmbAmountValue(
  amount: number | string | null | undefined,
  dailyExchangeRate: number | string | null | undefined,
) {
  const parsedAmount = parseNumericValue(amount);
  const parsedRate = parseNumericValue(dailyExchangeRate);

  if (parsedAmount === null || parsedRate === null) {
    return "";
  }

  const derived = Math.round((parsedAmount * parsedRate + Number.EPSILON) * 100) / 100;
  return derived.toFixed(2).replace(/\.?0+$/, "");
}

function getOrderedCurrencyCodes(
  rateByCurrency: Map<string, ExchangeRateRow>,
  syncPairs: ExchangeRateSyncPairRow[],
) {
  const configuredCurrencies = syncPairs
    .map((pair) => normalizeCurrencyCode(pair.base_currency))
    .filter((currency) => currency && rateByCurrency.has(currency));
  const latestRateCurrencies = Array.from(rateByCurrency.keys());

  return Array.from(new Set([...configuredCurrencies, ...latestRateCurrencies]));
}
