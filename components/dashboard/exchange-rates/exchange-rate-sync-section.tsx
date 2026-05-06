"use client";

import { memo } from "react";

import { useTranslations } from "next-intl";
import {
  Clock3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  normalizeCurrencyCode,
  type ExchangeRateSyncState,
  type ManualExchangeRateFetchItem,
} from "@/lib/exchange-rates";
import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";
import {
  DashboardFilterField,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { PageBanner, type NoticeTone } from "../dashboard-shared-ui";

type SyncFeedback = {
  message: string;
  tone: NoticeTone;
} | null;

type ExchangeRateSyncSectionProps = {
  addPairPending: boolean;
  feedback: SyncFeedback;
  manualCurrencies: string[];
  manualFetchPending: boolean;
  manualResults: ManualExchangeRateFetchItem[];
  onAddManualCurrency: () => void;
  onAddPair: () => void;
  onAutoSyncChange: (enabled: boolean) => void;
  onManualCurrencyChange: (index: number, value: string) => void;
  onManualFetch: () => void;
  onPairInputChange: (value: string) => void;
  onRemoveManualCurrency: (index: number) => void;
  onRemovePair: (pairId: string, currency: string) => void;
  pairInput: string;
  removePairPendingId: string | null;
  settingsPending: boolean;
  syncState: ExchangeRateSyncState | null;
};

export const ExchangeRateSyncSection = memo(function ExchangeRateSyncSection({
  addPairPending,
  feedback,
  manualCurrencies,
  manualFetchPending,
  manualResults,
  onAddManualCurrency,
  onAddPair,
  onAutoSyncChange,
  onManualCurrencyChange,
  onManualFetch,
  onPairInputChange,
  onRemoveManualCurrency,
  onRemovePair,
  pairInput,
  removePairPendingId,
  settingsPending,
  syncState,
}: ExchangeRateSyncSectionProps) {
  const t = useTranslations("ExchangeRates");
  const isEnabled = syncState?.settings.is_enabled ?? false;
  const pairs = syncState?.pairs ?? [];

  return (
    <DashboardListSection
      actions={
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f7f8] px-4 py-2 text-sm text-[#52616d]">
          <Clock3 className="size-4" />
          {t("sync.schedule")}
        </div>
      }
      description={t("sync.description")}
      eyebrow={t("sync.eyebrow")}
      title={t("sync.title")}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="flex flex-col gap-4 border-b border-[#edf0ed] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#23313a]">
              {t("sync.autoFetchTitle")}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6f7b85]">
              {isEnabled
                ? t("sync.autoFetchEnabled")
                : t("sync.autoFetchDisabled")}
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <input
              checked={isEnabled}
              className="peer sr-only"
              disabled={settingsPending}
              onChange={(event) => onAutoSyncChange(event.target.checked)}
              type="checkbox"
            />
            <span
              className={cn(
                "relative h-7 w-12 rounded-full border transition-colors",
                isEnabled
                  ? "border-[#5d7f69] bg-[#5d7f69]"
                  : "border-[#d8e0d8] bg-[#edf1ee]",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                  isEnabled ? "translate-x-5" : "translate-x-1",
                )}
              />
            </span>
            <span className="text-sm font-medium text-[#31404b]">
              {settingsPending
                ? t("sync.switchPending")
                : isEnabled
                  ? t("sync.switchOn")
                  : t("sync.switchOff")}
            </span>
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#23313a]">
                {t("sync.pairsTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6f7b85]">
                {t("sync.pairsDescription")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {pairs.length === 0 ? (
                <span className="rounded-full bg-[#f6f8f6] px-3 py-2 text-sm text-[#6f7b85]">
                  {t("sync.noPairs")}
                </span>
              ) : (
                pairs.map((pair) => {
                  const currency = normalizeCurrencyCode(pair.base_currency);
                  const removing = removePairPendingId === pair.id;

                  return (
                    <span
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#dfe7df] bg-white px-3 text-sm font-medium text-[#31404b]"
                      key={pair.id}
                    >
                      {currency} {" -> "} CNY
                      <button
                        aria-label={t("sync.removePair", { currency })}
                        className="inline-flex size-7 items-center justify-center rounded-full text-[#9b4a4a] transition-colors hover:bg-[#fff1f1]"
                        disabled={removing}
                        onClick={() => onRemovePair(pair.id, currency)}
                        type="button"
                      >
                        {removing ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <DashboardFilterField label={t("sync.addPairLabel")}>
                <input
                  className={dashboardFilterInputClassName}
                  onChange={(event) => onPairInputChange(event.target.value)}
                  placeholder={t("sync.currencyPlaceholder")}
                  type="text"
                  value={pairInput}
                />
              </DashboardFilterField>
              <div className="flex items-end">
                <Button
                  className="h-12 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={addPairPending}
                  onClick={onAddPair}
                  type="button"
                >
                  {addPairPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {t("sync.addPair")}
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#23313a]">
                {t("sync.manualTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6f7b85]">
                {t("sync.manualDescription")}
              </p>
            </div>

            <div className="space-y-3">
              {manualCurrencies.map((currency, index) => (
                <div
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={`${index}-${manualCurrencies.length}`}
                >
                  <input
                    className={dashboardFilterInputClassName}
                    onChange={(event) =>
                      onManualCurrencyChange(index, event.target.value)
                    }
                    placeholder={t("sync.currencyPlaceholder")}
                    type="text"
                    value={currency}
                  />
                  <Button
                    aria-label={t("sync.removeManualCurrency")}
                    className="h-11 rounded-full text-[#9b4a4a] hover:text-[#9b4a4a] sm:h-12"
                    disabled={manualFetchPending || manualCurrencies.length === 1}
                    onClick={() => onRemoveManualCurrency(index)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                disabled={manualFetchPending}
                onClick={onAddManualCurrency}
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                {t("sync.addManualCurrency")}
              </Button>
              <Button
                className="rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                disabled={manualFetchPending}
                onClick={onManualFetch}
                type="button"
              >
                {manualFetchPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t("sync.fetchNow")}
              </Button>
            </div>

            {manualResults.length > 0 ? (
              <div className="space-y-2">
                {manualResults.map((result) => (
                  <p
                    className={cn(
                      "text-sm",
                      result.ok ? "text-[#4f6757]" : "text-[#9b4a4a]",
                    )}
                    key={`${result.baseCurrency}-${result.targetCurrency}`}
                  >
                    {result.ok
                      ? t("sync.resultSuccess", {
                          currency: result.baseCurrency,
                          rate: result.rate ?? "",
                        })
                      : t("sync.resultFailed", {
                          currency: result.baseCurrency,
                        })}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </DashboardListSection>
  );
});
