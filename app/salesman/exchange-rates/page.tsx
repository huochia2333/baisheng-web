import type { Metadata } from "next";

import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates-client";

export const metadata: Metadata = {
  title: "汇率管理",
};

export default function SalesmanExchangeRatesPage() {
  return <ExchangeRatesClient homeHref="/salesman/my" mode="readonly" />;
}
