"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import type {
  CommissionRuleSetting,
} from "@/lib/commission-settings";
import {
  updateServiceFeeType,
  type ServiceFeeTypeOption,
} from "@/lib/service-fee-types";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useLocale } from "@/components/i18n/locale-provider";

import { DashboardListSection } from "../dashboard-section-panel";
import { PageBanner, type NoticeTone } from "../dashboard-shared-ui";
import {
  formatCommissionSettingValue,
  getRuleConfigValue,
} from "../commission/commission-settings-display";
import {
  getServiceFeeRowsByScope,
  sortServiceFeeRows,
} from "./admin-orders-service-fee-display";
import { formatDiscountRatioValue } from "./admin-orders-utils";
import {
  formatRatioForInput,
  parseServiceFeeInput,
  toServiceFeeErrorMessage,
} from "./admin-orders-service-fee-settings-utils";
import {
  AdminOrdersServiceFeeTierSection,
  type ServiceFeeRuleLine,
} from "./admin-orders-service-fee-tier-section";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type DiscountLocale = Parameters<typeof formatDiscountRatioValue>[1];

export function AdminOrdersServiceFeeSettings({
  commissionRuleSettings,
  initialRows,
  onRowsChange,
}: {
  commissionRuleSettings: CommissionRuleSetting[];
  initialRows: ServiceFeeTypeOption[];
  onRowsChange?: (rows: ServiceFeeTypeOption[]) => void;
}) {
  const supabase = getBrowserSupabaseClient();
  const { locale } = useLocale();
  const t = useTranslations("Orders");
  const [rows, setRows] = useState<ServiceFeeTypeOption[]>(() =>
    sortServiceFeeRows(initialRows),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PageFeedback>(null);

  const retailRows = useMemo(
    () => getServiceFeeRowsByScope(rows, "retail"),
    [rows],
  );
  const commissionRowsByCode = useMemo(
    () => new Map(commissionRuleSettings.map((row) => [row.ruleCode, row])),
    [commissionRuleSettings],
  );
  const retailCommissionSummary = useMemo(
    () =>
      getRetailCommissionSummary(
        commissionRowsByCode,
        locale,
        t,
      ),
    [commissionRowsByCode, locale, t],
  );

  async function handleSave(row: ServiceFeeTypeOption) {
    if (!supabase || pendingAction !== null) {
      return;
    }

    const parsed = parseServiceFeeInput(editValue);

    if (!parsed.ok) {
      setFeedback({ tone: "error", message: t(parsed.messageKey) });
      return;
    }

    setPendingAction(`edit:${row.id}`);
    setFeedback(null);

    try {
      const updated = await updateServiceFeeType(supabase, row.id, parsed.value);
      const nextRows = sortServiceFeeRows(
        rows.map((item) => (item.id === updated.id ? updated : item)),
      );
      setRows(nextRows);
      onRowsChange?.(nextRows);
      setEditingId(null);
      setEditValue("");
      setFeedback({ tone: "success", message: t("settings.serviceFees.updateSuccess") });
    } catch (error) {
      setFeedback({ tone: "error", message: toServiceFeeErrorMessage(error, t) });
    } finally {
      setPendingAction(null);
    }
  }

  function startEditing(row: ServiceFeeTypeOption) {
    setEditingId(row.id);
    setEditValue(formatRatioForInput(row.fee_ratio));
    setFeedback(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue("");
  }

  const tierCopy = {
    actions: t("settings.serviceFees.table.actions"),
    cancel: t("settings.serviceFees.cancel"),
    edit: t("settings.serviceFees.edit"),
    empty: t("settings.serviceFees.emptyDescription"),
    rate: t("settings.serviceFees.table.rate"),
    rule: t("settings.serviceFees.table.rule"),
    save: t("settings.serviceFees.save"),
    tier: t("settings.serviceFees.table.tier"),
  };

  return (
    <DashboardListSection
      bodyClassName="flex flex-col gap-5"
    >
      {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

      <AdminOrdersServiceFeeTierSection
        copy={tierCopy}
        description={t("settings.serviceFees.retail.description")}
        editValue={editValue}
        editingId={editingId}
        locale={locale}
        pendingAction={pendingAction}
        rows={retailRows}
        title={t("settings.serviceFees.retail.title")}
        getRuleLines={(row) =>
          getServiceFeeRuleLines({
            commissionLine: retailCommissionSummary,
            locale,
            row,
            t,
          })
        }
        onCancelEditing={cancelEditing}
        onEditValueChange={setEditValue}
        onSave={(row) => void handleSave(row)}
        onStartEditing={startEditing}
      />

    </DashboardListSection>
  );
}

function getServiceFeeRuleLines({
  commissionLine,
  locale,
  row,
  t,
}: {
  commissionLine: string;
  locale: DiscountLocale;
  row: ServiceFeeTypeOption;
  t: ReturnType<typeof useTranslations<"Orders">>;
}): ServiceFeeRuleLine[] {
  return [
    {
      text: t("settings.serviceFees.calculations.serviceFeeShort", {
        rate: formatDiscountRatioValue(row.fee_ratio, locale),
      }),
      tone: "primary",
    },
    {
      text: commissionLine,
      tone: "muted",
    },
  ];
}

function getRetailCommissionSummary(
  rowsByCode: Map<CommissionRuleSetting["ruleCode"], CommissionRuleSetting>,
  locale: string,
  t: ReturnType<typeof useTranslations<"Orders">>,
) {
  const salesmanRule = rowsByCode.get("purchase_salesman_tier");
  const referralRule = rowsByCode.get("purchase_referral_rate");
  const tier1Limit = salesmanRule
    ? getRuleConfigValue(salesmanRule.config, "tier_1_limit_rmb")
    : null;
  const tier1Rate = salesmanRule
    ? getRuleConfigValue(salesmanRule.config, "tier_1_rate")
    : null;
  const tier2Rate = salesmanRule
    ? getRuleConfigValue(salesmanRule.config, "tier_2_rate")
    : null;
  const referralRate = referralRule
    ? getRuleConfigValue(referralRule.config, "rate")
    : null;

  if (
    tier1Limit === null ||
    tier1Rate === null ||
    tier2Rate === null ||
    referralRate === null
  ) {
    return t("settings.serviceFees.calculations.commissionFallback");
  }

  return t("settings.serviceFees.calculations.retailCommissionShort", {
    referralRate: formatCommissionSettingValue("rate", referralRate, locale),
    tier1Limit: formatCompactRmbValue(tier1Limit, locale),
    tier1Rate: formatCommissionSettingValue("rate", tier1Rate, locale),
    tier2Rate: formatCommissionSettingValue("rate", tier2Rate, locale),
  });
}

function formatCompactRmbValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: "CNY",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
