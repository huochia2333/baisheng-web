"use client";

import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import { formatDateTime } from "@/components/dashboard/dashboard-shared-ui";
import type { ExchangeRateLatestRow } from "@/lib/exchange-rates";

import { formatExchangeRateValue } from "./exchange-rates-utils";

export function LatestRateCard({
  historyCountLabel,
  latestBadge,
  row,
}: {
  historyCountLabel: string;
  latestBadge: string;
  row: ExchangeRateLatestRow;
}) {
  const t = useTranslations("ExchangeRates");
  const { locale } = useLocale();

  return (
    <article className="rounded-[24px] border border-[#e7e3dc] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] tracking-[0.18em] text-[#7d8890] uppercase">
            {t("latest.card.eyebrow")}
          </p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-[#23313a]">
            {row.pairLabel}
          </h4>
        </div>
        <span className="rounded-full bg-[#edf2f5] px-3 py-1 text-xs font-semibold text-[#486782]">
          {latestBadge}
        </span>
      </div>

      <div className="mt-6 rounded-[20px] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(231,227,220,0.9)]">
        <p className="text-sm text-[#6b7680]">{t("latest.card.currentRate")}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a32]">
          {formatExchangeRateValue(
            row.daily_exchange_rate,
            locale,
            t("summary.noRecord"),
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#6a757e]">
        <span>{historyCountLabel}</span>
        <span>{formatDateTime(row.created_at, locale)}</span>
      </div>
    </article>
  );
}
