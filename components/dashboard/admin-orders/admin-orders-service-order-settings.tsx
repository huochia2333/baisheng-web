"use client";

import { useMemo, useState } from "react";

import { DollarSign, LoaderCircle, PencilLine, Percent, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  OrderDiscountTypeOption,
  ServiceOrderPriceOption,
  ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import {
  updateOrderDiscountType,
  updateServiceOrderPriceOption,
} from "@/lib/service-order-settings";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useLocale } from "@/components/i18n/locale-provider";

import { Button } from "../../ui/button";
import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { PageBanner, type NoticeTone } from "../dashboard-shared-ui";
import {
  createOrdersUiCopy,
  formatDiscountRatioValue,
  formatMoneyValue,
  formatServiceOrderSubtype,
} from "./admin-orders-utils";
import {
  formatRatioForInput,
  parseServiceFeeInput,
} from "./admin-orders-service-fee-settings-utils";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type EditingTarget =
  | { kind: "discount"; id: string }
  | { kind: "price"; id: string }
  | null;

export function AdminOrdersServiceOrderSettings({
  initialDiscounts,
  initialPrices,
  serviceOrderTypes,
  onDiscountsChange,
  onPricesChange,
}: {
  initialDiscounts: OrderDiscountTypeOption[];
  initialPrices: ServiceOrderPriceOption[];
  serviceOrderTypes: ServiceOrderTypeOption[];
  onDiscountsChange?: (rows: OrderDiscountTypeOption[]) => void;
  onPricesChange?: (rows: ServiceOrderPriceOption[]) => void;
}) {
  const supabase = getBrowserSupabaseClient();
  const { locale } = useLocale();
  const t = useTranslations("Orders");
  const ordersUiT = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(ordersUiT), [ordersUiT]);
  const serviceTypeById = useMemo(
    () => new Map(serviceOrderTypes.map((item) => [item.id, item.business_subcategory])),
    [serviceOrderTypes],
  );
  const [prices, setPrices] = useState<ServiceOrderPriceOption[]>(() =>
    sortServicePrices(initialPrices),
  );
  const [discounts, setDiscounts] = useState<OrderDiscountTypeOption[]>(() =>
    sortOrderDiscounts(initialDiscounts),
  );
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PageFeedback>(null);

  async function handleSavePrice(row: ServiceOrderPriceOption) {
    if (!supabase || pendingAction !== null) {
      return;
    }

    const parsed = parsePositiveAmount(editValue);

    if (parsed === null) {
      setFeedback({ tone: "error", message: t("settings.serviceOrders.validation.price") });
      return;
    }

    setPendingAction(`price:${row.id}`);
    setFeedback(null);

    try {
      const updated = await updateServiceOrderPriceOption(supabase, row.id, parsed);
      const nextRows = sortServicePrices(
        prices.map((item) => (item.id === updated.id ? updated : item)),
      );
      setPrices(nextRows);
      onPricesChange?.(nextRows);
      clearEditing();
      setFeedback({ tone: "success", message: t("settings.serviceOrders.updateSuccess") });
    } catch {
      setFeedback({ tone: "error", message: t("settings.serviceOrders.errors.unknown") });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveDiscount(row: OrderDiscountTypeOption) {
    if (!supabase || pendingAction !== null) {
      return;
    }

    const parsed = parseServiceFeeInput(editValue);

    if (!parsed.ok) {
      setFeedback({ tone: "error", message: t("settings.serviceOrders.validation.discount") });
      return;
    }

    setPendingAction(`discount:${row.id}`);
    setFeedback(null);

    try {
      const updated = await updateOrderDiscountType(supabase, row.id, parsed.value);
      const nextRows = sortOrderDiscounts(
        discounts.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDiscounts(nextRows);
      onDiscountsChange?.(nextRows);
      clearEditing();
      setFeedback({ tone: "success", message: t("settings.serviceOrders.updateSuccess") });
    } catch {
      setFeedback({ tone: "error", message: t("settings.serviceOrders.errors.unknown") });
    } finally {
      setPendingAction(null);
    }
  }

  function startPriceEditing(row: ServiceOrderPriceOption) {
    setEditingTarget({ kind: "price", id: row.id });
    setEditValue(formatAmountForInput(row.amount_usd));
    setFeedback(null);
  }

  function startDiscountEditing(row: OrderDiscountTypeOption) {
    setEditingTarget({ kind: "discount", id: row.id });
    setEditValue(formatRatioForInput(row.discount_ratio));
    setFeedback(null);
  }

  function clearEditing() {
    setEditingTarget(null);
    setEditValue("");
  }

  return (
    <section className="flex flex-col gap-5">
      <DashboardSectionHeader
        badge={t("settings.serviceOrders.badge")}
        badgeIcon={<DollarSign className="size-3.5" />}
        contentClassName="max-w-3xl"
        description={t("settings.serviceOrders.description")}
        metrics={[
          {
            accent: "green",
            icon: <DollarSign className="size-5" />,
            key: "prices",
            label: t("settings.serviceOrders.priceSummaryLabel"),
            value: String(prices.length),
          },
          {
            accent: "gold",
            icon: <Percent className="size-5" />,
            key: "discounts",
            label: t("settings.serviceOrders.discountSummaryLabel"),
            value: discounts
              .map((row) => formatDiscountRatioValue(row.discount_ratio, locale))
              .join(" / "),
          },
        ]}
        metricsClassName="md:grid-cols-2"
        title={t("settings.serviceOrders.title")}
      />

      {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

      <section className="flex flex-col gap-3">
        <SectionTitle
          description={t("settings.serviceOrders.prices.description")}
          title={t("settings.serviceOrders.prices.title")}
        />
        <DashboardTableFrame>
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead className="bg-[#f7f5f2]">
              <tr className="border-b border-[#efebe5]">
                <HeaderCell className="w-[28%]">{t("settings.serviceOrders.table.service")}</HeaderCell>
                <HeaderCell className="w-[24%]">{t("settings.serviceOrders.table.option")}</HeaderCell>
                <HeaderCell className="w-[20%]">{t("settings.serviceOrders.table.price")}</HeaderCell>
                <HeaderCell className="w-[28%] text-right">{t("settings.serviceOrders.table.actions")}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {prices.map((row) => {
                const isEditing =
                  editingTarget?.kind === "price" && editingTarget.id === row.id;
                const isSaving = pendingAction === `price:${row.id}`;

                return (
                  <tr className="border-b border-[#efebe5] last:border-b-0" key={row.id}>
                    <td className="px-5 py-4 text-sm font-semibold leading-6 text-[#23313a]">
                      {formatServiceOrderSubtype(
                        serviceTypeById.get(row.service_order_type_id) ?? null,
                        orderUiCopy,
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm leading-6 text-[#60707d]">
                      {row.display_name}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#23313a]">
                      {isEditing ? (
                        <input
                          className={dashboardFilterInputClassName}
                          inputMode="decimal"
                          onChange={(event) => setEditValue(event.target.value)}
                          value={editValue}
                        />
                      ) : (
                        `$${formatMoneyValue(row.amount_usd, locale)}`
                      )}
                    </td>
                    <ActionsCell
                      isEditing={isEditing}
                      isSaving={isSaving}
                      pendingAction={pendingAction}
                      onCancel={clearEditing}
                      onEdit={() => startPriceEditing(row)}
                      onSave={() => void handleSavePrice(row)}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DashboardTableFrame>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle
          description={t("settings.serviceOrders.discounts.description")}
          title={t("settings.serviceOrders.discounts.title")}
        />
        <DashboardTableFrame>
          <table className="w-full min-w-[560px] table-fixed border-collapse">
            <thead className="bg-[#f7f5f2]">
              <tr className="border-b border-[#efebe5]">
                <HeaderCell>{t("settings.serviceOrders.table.discount")}</HeaderCell>
                <HeaderCell className="text-right">{t("settings.serviceOrders.table.actions")}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {discounts.map((row) => {
                const isEditing =
                  editingTarget?.kind === "discount" && editingTarget.id === row.id;
                const isSaving = pendingAction === `discount:${row.id}`;

                return (
                  <tr className="border-b border-[#efebe5] last:border-b-0" key={row.id}>
                    <td className="px-5 py-4 text-sm font-semibold text-[#23313a]">
                      {isEditing ? (
                        <input
                          className={dashboardFilterInputClassName}
                          inputMode="decimal"
                          onChange={(event) => setEditValue(event.target.value)}
                          value={editValue}
                        />
                      ) : (
                        formatDiscountRatioValue(row.discount_ratio, locale)
                      )}
                    </td>
                    <ActionsCell
                      isEditing={isEditing}
                      isSaving={isSaving}
                      pendingAction={pendingAction}
                      onCancel={clearEditing}
                      onEdit={() => startDiscountEditing(row)}
                      onSave={() => void handleSaveDiscount(row)}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DashboardTableFrame>
      </section>
    </section>
  );
}

function ActionsCell({
  isEditing,
  isSaving,
  pendingAction,
  onCancel,
  onEdit,
  onSave,
}: {
  isEditing: boolean;
  isSaving: boolean;
  pendingAction: string | null;
  onCancel: () => void;
  onEdit: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("Orders");

  return (
    <td className="px-5 py-4 align-top">
      <div className="flex flex-wrap justify-end gap-2">
        {isEditing ? (
          <>
            <Button disabled={pendingAction !== null} onClick={onSave} type="button" variant="outline">
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("settings.serviceOrders.save")}
            </Button>
            <Button disabled={pendingAction !== null} onClick={onCancel} type="button" variant="outline">
              <X className="size-4" />
              {t("settings.serviceOrders.cancel")}
            </Button>
          </>
        ) : (
          <Button disabled={pendingAction !== null} onClick={onEdit} type="button" variant="outline">
            <PencilLine className="size-4" />
            {t("settings.serviceOrders.edit")}
          </Button>
        )}
      </div>
    </td>
  );
}

function HeaderCell({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function SectionTitle({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-xl font-bold tracking-tight text-[#23313a] sm:text-2xl">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-[#6f7b85] sm:leading-7">
        {description}
      </p>
    </div>
  );
}

function sortServicePrices(rows: ServiceOrderPriceOption[]) {
  return [...rows].sort((left, right) => left.sort_order - right.sort_order);
}

function sortOrderDiscounts(rows: OrderDiscountTypeOption[]) {
  return [...rows].sort((left, right) => {
    const leftRatio = Number(left.discount_ratio);
    const rightRatio = Number(right.discount_ratio);
    return rightRatio - leftRatio;
  });
}

function parsePositiveAmount(value: string) {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function formatAmountForInput(value: number | string) {
  const parsed = Number(String(value).trim());

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(parsed);
}
