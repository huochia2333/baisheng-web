"use client";

import { useMemo, useState } from "react";

import {
  LoaderCircle,
  PencilLine,
  Percent,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  createServiceFeeType,
  deleteServiceFeeType,
  updateServiceFeeType,
  type ServiceFeeTypeOption,
} from "@/lib/service-fee-types";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { Button } from "../../ui/button";
import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardSectionPanel,
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { EmptyState, PageBanner, type NoticeTone } from "../dashboard-shared-ui";
import { formatDiscountRatioValue } from "./admin-orders-utils";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  formatRatioForInput,
  parseServiceFeeInput,
  sortServiceFeeRows,
  toServiceFeeErrorMessage,
} from "./admin-orders-service-fee-settings-utils";

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
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PageFeedback>(null);
  const canSubmitNewValue = newValue.trim().length > 0 && pendingAction === null;
  const serviceFeeSummary = useMemo(() => {
    if (rows.length === 0) {
      return "-";
    }

    return rows
      .map((row) => formatDiscountRatioValue(row.fee_ratio, locale))
      .join(" / ");
  }, [locale, rows]);

  async function handleCreate() {
    if (!supabase || pendingAction !== null) {
      return;
    }

    const parsed = parseServiceFeeInput(newValue);

    if (!parsed.ok) {
      setFeedback({ tone: "error", message: t(parsed.messageKey) });
      return;
    }

    setPendingAction("create");
    setFeedback(null);

    try {
      const created = await createServiceFeeType(supabase, parsed.value);
      setRows((current) => applyRowsChange(sortServiceFeeRows([...current, created]), onRowsChange));
      setNewValue("");
      setFeedback({ tone: "success", message: t("settings.serviceFees.createSuccess") });
    } catch (error) {
      setFeedback({ tone: "error", message: toServiceFeeErrorMessage(error, t) });
    } finally {
      setPendingAction(null);
    }
  }

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
      setRows((current) =>
        applyRowsChange(
          sortServiceFeeRows(
            current.map((item) => (item.id === updated.id ? updated : item)),
          ),
          onRowsChange,
        ),
      );
      setEditingId(null);
      setEditValue("");
      setFeedback({ tone: "success", message: t("settings.serviceFees.updateSuccess") });
    } catch (error) {
      setFeedback({ tone: "error", message: toServiceFeeErrorMessage(error, t) });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(row: ServiceFeeTypeOption) {
    if (!supabase || pendingAction !== null) {
      return;
    }

    if (!window.confirm(t("settings.serviceFees.deleteConfirm"))) {
      return;
    }

    setPendingAction(`delete:${row.id}`);
    setFeedback(null);

    try {
      await deleteServiceFeeType(supabase, row.id);
      setRows((current) =>
        applyRowsChange(
          current.filter((item) => item.id !== row.id),
          onRowsChange,
        ),
      );
      setFeedback({ tone: "success", message: t("settings.serviceFees.deleteSuccess") });
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

  return (
    <section className="flex flex-col gap-5">
      <DashboardSectionHeader
        badge={t("settings.serviceFees.badge")}
        badgeIcon={<Percent className="size-3.5" />}
        contentClassName="max-w-2xl"
        description={t("settings.serviceFees.description")}
        metrics={[
          {
            accent: "green",
            icon: <Percent className="size-5" />,
            key: "fees",
            label: t("settings.serviceFees.summaryLabel"),
            value: serviceFeeSummary,
          },
        ]}
        title={t("settings.serviceFees.title")}
      />

      {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

      <DashboardSectionPanel className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 text-sm font-semibold text-[#33424c]">
            {t("settings.serviceFees.createLabel")}
            <input
              className={`${dashboardFilterInputClassName} mt-2`}
              inputMode="decimal"
              onChange={(event) => setNewValue(event.target.value)}
              placeholder={t("settings.serviceFees.inputPlaceholder")}
              value={newValue}
            />
          </label>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!canSubmitNewValue}
            onClick={handleCreate}
            type="button"
          >
            {pendingAction === "create" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t("settings.serviceFees.add")}
          </Button>
        </div>
      </DashboardSectionPanel>

      <DashboardTableFrame>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              description={t("settings.serviceFees.emptyDescription")}
              icon={<Percent className="size-6" />}
              title={t("settings.serviceFees.emptyTitle")}
            />
          </div>
        ) : (
          <table className="min-w-[640px] w-full table-fixed border-collapse">
            <thead className="bg-[#f7f5f2]">
              <tr className="border-b border-[#efebe5]">
                <th className="px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                  {t("settings.serviceFees.table.rate")}
                </th>
                <th className="px-5 py-4 text-right font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                  {t("settings.serviceFees.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                const isSaving = pendingAction === `edit:${row.id}`;
                const isDeleting = pendingAction === `delete:${row.id}`;

                return (
                  <tr
                    className="border-b border-[#efebe5] last:border-b-0"
                    key={row.id}
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-[#23313a]">
                      {isEditing ? (
                        <input
                          className={dashboardFilterInputClassName}
                          inputMode="decimal"
                          onChange={(event) => setEditValue(event.target.value)}
                          value={editValue}
                        />
                      ) : (
                        formatDiscountRatioValue(row.fee_ratio, locale)
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={() => void handleSave(row)}
                              type="button"
                              variant="outline"
                            >
                              {isSaving ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              {t("settings.serviceFees.save")}
                            </Button>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={cancelEditing}
                              type="button"
                              variant="outline"
                            >
                              <X className="size-4" />
                              {t("settings.serviceFees.cancel")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={() => startEditing(row)}
                              type="button"
                              variant="outline"
                            >
                              <PencilLine className="size-4" />
                              {t("settings.serviceFees.edit")}
                            </Button>
                            <Button
                              className="border-[#efd6d6] bg-white text-[#b13d3d] hover:bg-[#fff4f4]"
                              disabled={pendingAction !== null}
                              onClick={() => void handleDelete(row)}
                              type="button"
                              variant="outline"
                            >
                              {isDeleting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                              {t("settings.serviceFees.delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DashboardTableFrame>
    </section>
  );
}

function applyRowsChange(
  rows: ServiceFeeTypeOption[],
  onRowsChange?: (rows: ServiceFeeTypeOption[]) => void,
) {
  onRowsChange?.(rows);
  return rows;
}
