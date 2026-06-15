"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  type CommissionRuleCode,
  type CommissionRuleConfig,
  type CommissionRuleSetting,
  updateCommissionRuleSetting,
} from "@/lib/commission-settings";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  PageBanner,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";

import {
  COMMISSION_RULE_DEFINITIONS,
  type CommissionRuleDefinition,
  type CommissionRuleField,
  formatCommissionSettingInput,
  getRuleConfigValue,
} from "./commission-settings-display";
import {
  CommissionSettingsRulesTable,
  type RuleDraft,
} from "./admin-commission-settings-ui";

type PageFeedback = { message: string; tone: NoticeTone } | null;
type SettingsErrorKey =
  | "settings.errors.permission"
  | "settings.errors.unknown"
  | "settings.validation.amount";
type SettingsErrorTranslator = (key: SettingsErrorKey) => string;

export function AdminCommissionSettingsSection({
  canManageSettings,
  onRowsChange,
  ruleCodes,
  rows,
}: {
  canManageSettings: boolean;
  onRowsChange?: (rows: CommissionRuleSetting[]) => void;
  ruleCodes?: readonly CommissionRuleCode[];
  rows: CommissionRuleSetting[];
}) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Commission");
  const { locale } = useLocale();
  const [settingsRows, setSettingsRows] = useState(() => sortRows(rows));
  const [editingRule, setEditingRule] = useState<CommissionRuleCode | null>(null);
  const [draft, setDraft] = useState<RuleDraft>({});
  const [pendingRule, setPendingRule] = useState<CommissionRuleCode | null>(null);
  const [feedback, setFeedback] = useState<PageFeedback>(null);

  useEffect(() => {
    if (editingRule === null && pendingRule === null) {
      setSettingsRows(sortRows(rows));
    }
  }, [editingRule, pendingRule, rows]);

  const rowsByCode = useMemo(
    () => new Map(settingsRows.map((row) => [row.ruleCode, row])),
    [settingsRows],
  );
  const ruleCodeSet = useMemo(
    () => (ruleCodes ? new Set<CommissionRuleCode>(ruleCodes) : null),
    [ruleCodes],
  );
  const visibleRules = useMemo(
    () =>
      COMMISSION_RULE_DEFINITIONS.filter(
        (definition) => !ruleCodeSet || ruleCodeSet.has(definition.code),
      ).map((definition) => ({
        definition,
        row: rowsByCode.get(definition.code) ?? null,
      })),
    [rowsByCode, ruleCodeSet],
  );
  function startEditing(definition: CommissionRuleDefinition) {
    const row = rowsByCode.get(definition.code);

    if (!row) {
      return;
    }

    setEditingRule(definition.code);
    setDraft(createDraft(definition, row.config));
    setFeedback(null);
  }

  function clearEditing() {
    setEditingRule(null);
    setDraft({});
  }

  async function saveRule(definition: CommissionRuleDefinition) {
    if (!supabase || pendingRule !== null) {
      return;
    }

    const row = rowsByCode.get(definition.code);

    if (!row) {
      return;
    }

    const parsed = parseDraft(definition, row.config, draft);

    if (!parsed.ok) {
      setFeedback({ tone: "error", message: t(parsed.messageKey) });
      return;
    }

    setPendingRule(definition.code);
    setFeedback(null);

    try {
      const updated = await updateCommissionRuleSetting(
        supabase,
        definition.code,
        parsed.config,
      );
      const nextRows = sortRows(
        settingsRows.map((item) =>
          item.ruleCode === updated.ruleCode ? updated : item,
        ),
      );
      setSettingsRows(nextRows);
      onRowsChange?.(nextRows);
      clearEditing();
      setFeedback({ tone: "success", message: t("settings.feedback.updateSuccess") });
    } catch (error) {
      setFeedback({ tone: "error", message: toSettingsErrorMessage(error, t) });
    } finally {
      setPendingRule(null);
    }
  }

  return (
    <DashboardListSection
      bodyClassName="flex flex-col gap-5"
    >
      {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

      <CommissionSettingsRulesTable
        canManageSettings={canManageSettings}
        draft={draft}
        editingRule={editingRule}
        locale={locale}
        pendingRule={pendingRule}
        visibleRules={visibleRules}
        onCancel={clearEditing}
        onDraftChange={setDraft}
        onEdit={startEditing}
        onSave={(definition) => void saveRule(definition)}
      />
    </DashboardListSection>
  );
}

function createDraft(
  definition: CommissionRuleDefinition,
  config: CommissionRuleConfig,
) {
  return definition.fields.reduce<RuleDraft>((result, field) => {
    result[field.configKey] = formatCommissionSettingInput(
      field.kind,
      getRuleConfigValue(config, field.configKey),
    );
    return result;
  }, {});
}

function parseDraft(
  definition: CommissionRuleDefinition,
  currentConfig: CommissionRuleConfig,
  draft: RuleDraft,
):
  | { config: CommissionRuleConfig; ok: true }
  | { messageKey: "settings.validation.amount" | "settings.validation.rate"; ok: false } {
  const nextConfig = { ...currentConfig };

  for (const field of definition.fields) {
    const parsed = parseFieldValue(field, draft[field.configKey] ?? "");

    if (parsed === null) {
      return {
        ok: false,
        messageKey:
          field.kind === "rate"
            ? "settings.validation.rate"
            : "settings.validation.amount",
      };
    }

    nextConfig[field.configKey] = parsed;
  }

  return { ok: true, config: nextConfig };
}

function parseFieldValue(field: CommissionRuleField, rawValue: string) {
  const parsed = Number(rawValue.trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (field.kind === "rate") {
    const ratio = parsed > 1 ? parsed / 100 : parsed;

    if (ratio <= 0 || ratio > 1) {
      return null;
    }

    return Math.round(ratio * 10000) / 10000;
  }

  if (parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function sortRows(rows: CommissionRuleSetting[]) {
  return [...rows].sort((left, right) => left.sortOrder - right.sortOrder);
}

function toSettingsErrorMessage(
  error: unknown,
  t: SettingsErrorTranslator,
) {
  const message = String((error as { message?: string })?.message ?? "").toLowerCase();

  if (message.includes("permission")) {
    return t("settings.errors.permission");
  }

  if (message.includes("invalid")) {
    return t("settings.validation.amount");
  }

  return t("settings.errors.unknown");
}
