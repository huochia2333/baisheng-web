"use client";

import { useMemo, useState } from "react";

import { Percent } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  updateServiceFeeType,
  type ServiceFeeTypeOption,
} from "@/lib/service-fee-types";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useLocale } from "@/components/i18n/locale-provider";

import { DashboardSectionHeader } from "../dashboard-section-header";
import { PageBanner, type NoticeTone } from "../dashboard-shared-ui";
import {
  getServiceFeeRowsByScope,
  sortServiceFeeRows,
} from "./admin-orders-service-fee-display";
import {
  formatRatioForInput,
  parseServiceFeeInput,
  toServiceFeeErrorMessage,
} from "./admin-orders-service-fee-settings-utils";
import { AdminOrdersServiceFeeTierSection } from "./admin-orders-service-fee-tier-section";
import { formatDiscountRatioValue } from "./admin-orders-utils";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function AdminOrdersServiceFeeSettings({
  initialRows,
  onRowsChange,
}: {
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
  const wholesaleRows = useMemo(
    () => getServiceFeeRowsByScope(rows, "wholesale"),
    [rows],
  );
  const serviceFeeSummary = useMemo(
    () => ({
      retail: summarizeRateRange(retailRows, locale),
      wholesale: summarizeRateRange(wholesaleRows, locale),
    }),
    [locale, retailRows, wholesaleRows],
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
    <section className="flex flex-col gap-5">
      <DashboardSectionHeader
        badge={t("settings.serviceFees.badge")}
        badgeIcon={<Percent className="size-3.5" />}
        contentClassName="max-w-3xl"
        description={t("settings.serviceFees.description")}
        metrics={[
          {
            accent: "green",
            icon: <Percent className="size-5" />,
            key: "retail",
            label: t("settings.serviceFees.retail.summaryLabel"),
            value: serviceFeeSummary.retail,
          },
          {
            accent: "blue",
            icon: <Percent className="size-5" />,
            key: "wholesale",
            label: t("settings.serviceFees.wholesale.summaryLabel"),
            value: serviceFeeSummary.wholesale,
          },
        ]}
        metricsClassName="md:grid-cols-2"
        title={t("settings.serviceFees.title")}
      />

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
        onCancelEditing={cancelEditing}
        onEditValueChange={setEditValue}
        onSave={(row) => void handleSave(row)}
        onStartEditing={startEditing}
      />

      <AdminOrdersServiceFeeTierSection
        copy={tierCopy}
        description={t("settings.serviceFees.wholesale.description")}
        editValue={editValue}
        editingId={editingId}
        locale={locale}
        pendingAction={pendingAction}
        rows={wholesaleRows}
        title={t("settings.serviceFees.wholesale.title")}
        onCancelEditing={cancelEditing}
        onEditValueChange={setEditValue}
        onSave={(row) => void handleSave(row)}
        onStartEditing={startEditing}
      />

    </section>
  );
}

function summarizeRateRange(
  rows: ServiceFeeTypeOption[],
  locale: Parameters<typeof formatDiscountRatioValue>[1],
) {
  const uniqueRates = Array.from(
    new Set(rows.map((row) => formatDiscountRatioValue(row.fee_ratio, locale))),
  );

  return uniqueRates.length > 0 ? uniqueRates.join(" / ") : "-";
}
