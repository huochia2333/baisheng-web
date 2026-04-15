"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { LoaderCircle, PencilLine, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  getAdminOrderSupplementaryDetail,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import { useLocale } from "@/components/i18n/locale-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import {
  createDashboardSharedCopy,
  PageBanner,
  formatDateTime,
  normalizeOptionalString,
  type NoticeTone,
} from "../dashboard-shared-ui";
import { DashboardCenteredLoadingState } from "../dashboard-centered-loading-state";
import { DashboardDialog } from "../dashboard-dialog";
import { DashboardMetricCard } from "../dashboard-metric-card";
import { Button } from "../../ui/button";
import {
  createOrdersUiCopy,
  flattenOrderDetailItems,
  formatCurrencyCode,
  formatDiscountRatioValue,
  formatMoneyValue,
  formatPurchaseOrderSubtype,
  formatRateValue,
  formatServiceOrderSubtype,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getStatusLabel,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
  type OrdersUiCopy,
  type OrderFormState,
} from "./admin-orders-utils";

type PageFeedback = { tone: NoticeTone; message: string } | null;

function getOrderStatusOptions(t: ReturnType<typeof useTranslations>) {
  return [
    { value: "pending", label: t("status.pending") },
    { value: "in_progress", label: t("status.inProgress") },
    { value: "settled", label: t("status.settled") },
    { value: "completed", label: t("status.completed") },
    { value: "cancelled", label: t("status.cancelled") },
    { value: "refunding", label: t("status.refunding") },
  ] as const;
}

function OrdersLoadingState() {
  const t = useTranslations("OrdersUI");

  return <DashboardCenteredLoadingState message={t("loading")} />;
}

function OrderSummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <DashboardMetricCard
      accent={accent}
      icon={icon}
      label={label}
      value={String(count)}
    />
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">{label}</span>
      {children}
    </label>
  );
}

function OrderFormDialog({
  mode,
  title,
  description,
  submitLabel,
  showCostField,
  feedback,
  open,
  pending,
  formState,
  orderDiscountOptions,
  orderTypeOptions,
  orderEntryUserOptions,
  orderingUserOptions,
  orderUserOptions,
  purchaseOrderTypeOptions,
  serviceOrderTypeOptions,
  supplementaryLoading = false,
  lockOrderEntryUser = false,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  showCostField: boolean;
  feedback?: PageFeedback;
  open: boolean;
  pending: boolean;
  formState: OrderFormState;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderEntryUserOptions?: OrderUserOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orderUserOptions: OrderUserOption[];
  orderingUserOptions?: OrderUserOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  supplementaryLoading?: boolean;
  lockOrderEntryUser?: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldChange: <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => void;
  onSubmit: () => void;
}) {
  const effectiveOrderEntryUserOptions = orderEntryUserOptions ?? orderUserOptions;
  const effectiveOrderingUserOptions = orderingUserOptions ?? orderUserOptions;
  const { locale } = useLocale();
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);
  const orderStatusOptions = getOrderStatusOptions(t);
  const selectedOrderCategory = useMemo(() => {
    return (
      orderTypeOptions.find((option) => option.id === formState.orderType)?.category ?? null
    );
  }, [formState.orderType, orderTypeOptions]);
  const isFormBusy = pending || supplementaryLoading;

  return (
    <DashboardDialog
      actions={
        <>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("cancel")}
          </Button>
          <Button
            className="bg-[#486782] text-white hover:bg-[#3e5f79]"
            disabled={isFormBusy}
            onClick={onSubmit}
            type="button"
          >
            {isFormBusy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <PencilLine className="size-4" />
            )}
            {submitLabel}
          </Button>
        </>
      }
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
        <OrderField label={t("fields.originalCurrency")} required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
            placeholder={t("placeholders.originalCurrency")}
            type="text"
            value={formState.originalCurrency}
          />
        </OrderField>

        <OrderField label={t("fields.amount")} required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("amount", event.target.value)}
            placeholder={t("placeholders.amount")}
            step="0.01"
            type="number"
            value={formState.amount}
          />
        </OrderField>

        <OrderField label={t("fields.dailyExchangeRate")} required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
            placeholder={t("placeholders.dailyExchangeRate")}
            step="0.0001"
            type="number"
            value={formState.dailyExchangeRate}
          />
        </OrderField>

        <OrderField label={t("fields.transactionRate")} required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            placeholder={t("placeholders.transactionRate")}
            readOnly
            step="0.000001"
            type="number"
            value={formState.transactionRate}
          />
          <p className="mt-2 text-xs text-[#7b8790]">{t("hints.transactionRate")}</p>
        </OrderField>

        <OrderField label={t("fields.rmbAmount")} required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("rmbAmount", event.target.value)}
            placeholder={t("placeholders.rmbAmount")}
            step="0.01"
            type="number"
            value={formState.rmbAmount}
          />
        </OrderField>

        {showCostField ? (
          <OrderField label={t("fields.costAmount")}>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
              min="0"
              onChange={(event) => onFieldChange("costAmount", event.target.value)}
              placeholder={t("placeholders.costAmount")}
              step="0.01"
              type="number"
              value={formState.costAmount}
            />
          </OrderField>
        ) : null}

        <OrderField label={t("fields.orderEntryUser")} required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy || mode === "edit" || lockOrderEntryUser}
            onChange={(event) => onFieldChange("orderEntryUser", event.target.value)}
            value={formState.orderEntryUser}
          >
            <option value="">{t("select.orderEntryUser")}</option>
            {effectiveOrderEntryUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
          {lockOrderEntryUser ? (
            <p className="mt-2 text-xs text-[#7b8790]">
              {t("hints.lockedOrderEntryUser")}
            </p>
          ) : null}
        </OrderField>

        <OrderField label={t("fields.orderingUser")} required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderingUser", event.target.value)}
            value={formState.orderingUser}
          >
            <option value="">{t("select.orderingUser")}</option>
            {effectiveOrderingUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label={t("fields.orderStatus")} required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderStatus", event.target.value)}
            value={formState.orderStatus}
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label={t("fields.orderType")} required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderType", event.target.value)}
            value={formState.orderType}
          >
            <option value="">{t("select.orderType")}</option>
            {orderTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {getOrderTypeMetaFromCategory(option.category, orderUiCopy).label}
              </option>
            ))}
          </select>
        </OrderField>

        <div className="rounded-[20px] border border-[#e6ebe6] bg-[#f6faf7] px-4 py-3 text-sm leading-7 text-[#4f6757] md:col-span-2">
          {t("hints.autoTimestamps")}
        </div>

        {selectedOrderCategory === "purchase" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? t("purchaseSection.createDescription")
                  : t("purchaseSection.editDescription")
              }
              title={t("purchaseSection.title")}
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t("purchaseSection.loading")}
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label={t("fields.purchaseSubtype")} required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("purchaseSubtype", event.target.value)}
                    value={formState.purchaseSubtype}
                  >
                    <option value="">{t("select.purchaseSubtype")}</option>
                    {purchaseOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatPurchaseOrderSubtype(option.business_subcategory, orderUiCopy)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label={t("fields.purchaseDetails")}>
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("purchaseDetails", event.target.value)}
                  placeholder={t("placeholders.purchaseDetails")}
                  rows={6}
                  value={formState.purchaseDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}

        {selectedOrderCategory === "service" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? t("serviceSection.createDescription")
                  : t("serviceSection.editDescription")
              }
              title={t("serviceSection.title")}
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t("serviceSection.loading")}
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label={t("fields.serviceSubtype")} required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceSubtype", event.target.value)}
                    value={formState.serviceSubtype}
                  >
                    <option value="">{t("select.serviceSubtype")}</option>
                    {serviceOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatServiceOrderSubtype(option.business_subcategory, orderUiCopy)}
                      </option>
                    ))}
                  </select>
                </OrderField>

                <OrderField label={t("fields.serviceDiscount")} required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceDiscount", event.target.value)}
                    value={formState.serviceDiscount}
                  >
                    <option value="">{t("select.serviceDiscount")}</option>
                    {orderDiscountOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatDiscountRatioValue(option.discount_ratio, locale, orderUiCopy)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label={t("fields.serviceDetails")}>
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("serviceDetails", event.target.value)}
                  placeholder={t("placeholders.serviceDetails")}
                  rows={6}
                  value={formState.serviceDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}
        </div>
      </div>
    </DashboardDialog>
  );
}

function OrderDetailsDialog({
  canDelete,
  canEdit,
  canViewCost,
  showOrderEntryUser = true,
  showOrderingUser = true,
  order,
  userLabelById,
  orderTypeMetaById,
  supabase,
  onEdit,
  onDelete,
  deletePending,
  onOpenChange,
}: {
  canDelete: boolean;
  canEdit: boolean;
  canViewCost: boolean;
  showOrderEntryUser?: boolean;
  showOrderingUser?: boolean;
  order: AdminOrderRow | null;
  userLabelById: Map<string, string>;
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>;
  supabase: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>;
  onEdit: (order: AdminOrderRow) => void;
  onDelete: () => void;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale } = useLocale();
  const t = useTranslations("OrdersUI");
  const sharedT = useTranslations("DashboardShared");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);
  const sharedCopy = useMemo(() => createDashboardSharedCopy(sharedT), [sharedT]);
  const typeMeta = resolveOrderTypeMeta(order?.order_type ?? null, orderTypeMetaById, orderUiCopy);
  const orderNumber = order?.order_number ?? null;
  const [supplementaryState, setSupplementaryState] = useState<{
    orderNumber: string | null;
    detail: AdminOrderSupplementaryDetail | null;
    error: string | null;
  }>({
    orderNumber: null,
    detail: null,
    error: null,
  });

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let isActive = true;

    void getAdminOrderSupplementaryDetail(supabase, orderNumber)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail,
          error: null,
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail: null,
          error: toOrderErrorMessage(error, orderUiCopy, sharedCopy),
        });
      });

    return () => {
      isActive = false;
    };
  }, [orderNumber, orderUiCopy, sharedCopy, supabase]);

  const supplementaryLoading =
    orderNumber !== null && supplementaryState.orderNumber !== orderNumber;
  const supplementaryDetail =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.detail : null;
  const supplementaryError =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.error : null;

  return (
    <DashboardDialog
      actions={
        order ? (
          <>
            {canEdit ? (
              <Button onClick={() => onEdit(order)} type="button" variant="outline">
                <PencilLine className="size-4" />
                {t("details.editOrder")}
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                className="border-[#efd6d6] bg-white text-[#b13d3d] hover:bg-[#fff4f4]"
                disabled={deletePending}
                onClick={onDelete}
                type="button"
                variant="outline"
              >
                {deletePending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {t("details.deleteOrder")}
              </Button>
            ) : null}
          </>
        ) : null
      }
      description={order ? t("details.description") : undefined}
      onOpenChange={onOpenChange}
      open={order !== null}
      title={
        order ? t("details.titleWithOrderNumber", { orderNumber: order.order_number }) : t("details.title")
      }
    >
      {order ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <OrderDetailCard label={t("details.fields.orderNumber")} value={order.order_number} />
            <OrderDetailCard
              label={t("details.fields.orderStatus")}
              value={getStatusLabel(order.order_status, orderUiCopy)}
            />
            <OrderDetailCard label={t("details.fields.orderType")} value={typeMeta.label} />
            <OrderDetailCard label={t("details.fields.originalCurrency")} value={formatCurrencyCode(order.original_currency)} />
            <OrderDetailCard label={t("details.fields.amount")} value={formatMoneyValue(order.amount, locale)} />
            <OrderDetailCard label={t("details.fields.rmbAmount")} value={formatMoneyValue(order.rmb_amount, locale)} />
            {canViewCost ? (
              <OrderDetailCard label={t("details.fields.costAmount")} value={formatMoneyValue(order.cost_amount, locale)} />
            ) : null}
            <OrderDetailCard label={t("details.fields.dailyExchangeRate")} value={formatRateValue(order.daily_exchange_rate, locale)} />
            <OrderDetailCard
              label={t("details.fields.transactionRate")}
              value={formatRateValue(order.transaction_rate, locale)}
            />
            {showOrderEntryUser ? (
              <OrderDetailCard
                label={t("details.fields.orderEntryUser")}
                value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
              />
            ) : null}
            {showOrderingUser ? (
              <OrderDetailCard
                label={t("details.fields.orderingUser")}
                value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
              />
            ) : null}
            <OrderDetailCard label={t("details.fields.createdAt")} value={formatDateTime(order.created_at, locale)} />
            <OrderDetailCard
              label={t("details.fields.updatedAt")}
              value={formatDateTime(order.reviewed_at, locale)}
            />
          </div>

          <OrderSupplementaryDetailsSection
            detail={supplementaryDetail}
            error={supplementaryError}
            loading={supplementaryLoading}
            orderUiCopy={orderUiCopy}
          />
        </div>
      ) : null}
    </DashboardDialog>
  );
}

function OrderSupplementaryDetailsSection({
  detail,
  loading,
  error,
  orderUiCopy,
}: {
  detail: AdminOrderSupplementaryDetail | null;
  loading: boolean;
  error: string | null;
  orderUiCopy: OrdersUiCopy;
}) {
  const { locale } = useLocale();
  const t = useTranslations("OrdersUI");
  const detailItems = useMemo(
    () => (detail ? flattenOrderDetailItems(detail.details, locale, orderUiCopy) : []),
    [detail, locale, orderUiCopy],
  );

  if (loading) {
    return (
      <div className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
        <div className="flex items-center gap-3 text-sm text-[#60707d]">
          <LoaderCircle className="size-4 animate-spin" />
          {t("details.supplementary.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return <PageBanner tone="error">{error}</PageBanner>;
  }

  if (!detail) {
    return <PageBanner tone="info">{t("details.supplementary.empty")}</PageBanner>;
  }

  const formTitle =
    detail.kind === "purchase"
      ? t("details.supplementary.purchaseForm")
      : t("details.supplementary.serviceForm");
  const subtypeLabel =
    detail.kind === "purchase"
      ? t("details.supplementary.purchaseSubtype")
      : t("details.supplementary.serviceSubtype");
  const subtypeValue =
    detail.kind === "purchase"
      ? formatPurchaseOrderSubtype(detail.subtype, orderUiCopy)
      : formatServiceOrderSubtype(detail.subtype, orderUiCopy);

  return (
    <section className="rounded-[28px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)] sm:p-6">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-[#23313a]">{formTitle}</h3>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <OrderDetailCard label={t("details.supplementary.sourceForm")} value={formTitle} />
        <OrderDetailCard label={subtypeLabel} value={subtypeValue} />
        {detail.kind === "service" ? (
          <OrderDetailCard
            label={t("details.supplementary.discount")}
            value={formatDiscountRatioValue(detail.discountRatio, locale, orderUiCopy)}
          />
        ) : null}

        {detailItems.length > 0 ? (
          detailItems.map((item, index) => (
            <OrderDetailCard
              key={`${item.label}-${index}`}
              label={item.label}
              multiline
              value={item.value}
            />
          ))
        ) : (
          <div className="md:col-span-2">
            <PageBanner tone="info">{t("details.supplementary.noMoreDetails")}</PageBanner>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#31424d]">
        <span>{label}</span>
        {required ? <span className="text-[#b13d3d]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function OrderSupplementaryFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#23313a]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#66717a]">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function OrderDetailCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#ebe7e1] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm leading-7 text-[#2b3942]",
          multiline ? "whitespace-pre-wrap break-words" : "truncate",
        )}
        title={multiline ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function OrderHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
      {children}
    </th>
  );
}

function OrderValueCell({
  value,
  strong,
}: {
  value: ReactNode;
  strong?: boolean;
}) {
  const title = typeof value === "string" ? value : undefined;

  return (
    <td
      className={cn(
        "max-w-[220px] px-5 py-4 text-sm text-[#2b3942]",
        strong ? "font-semibold text-[#223038]" : "font-medium",
      )}
      title={title}
    >
      <div className="truncate">{value}</div>
    </td>
  );
}

function OrderStatusChip({ status }: { status: string | null }) {
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);
  const normalizedStatus = normalizeOptionalString(status);
  const orderStatusOptions = getOrderStatusOptions(t);

  if (!normalizedStatus) {
    return <StatusTag tone="default">{t("status.notProvided")}</StatusTag>;
  }

  const matchedStatus = orderStatusOptions.find((option) => option.value === normalizedStatus);

  if (!matchedStatus) {
    return <StatusTag tone="default">{normalizedStatus}</StatusTag>;
  }

  return (
    <StatusTag
      tone={
        normalizedStatus === "pending"
          ? "gold"
          : normalizedStatus === "completed"
            ? "green"
            : normalizedStatus === "cancelled" || normalizedStatus === "refunding"
              ? "red"
              : "blue"
      }
    >
      {matchedStatus?.label ?? getStatusLabel(normalizedStatus, orderUiCopy)}
    </StatusTag>
  );
}

function OrderTypeChip({
  meta,
}: {
  meta: ReturnType<typeof getOrderTypeMetaFromCategory>;
}) {
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
}

function StatusTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "default" | "gold" | "green" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "blue" && "bg-[#eef3f7] text-[#486782]",
        tone === "default" && "bg-[#f0efec] text-[#6d787f]",
        tone === "gold" && "bg-[#fff5db] text-[#9a6a07]",
        tone === "green" && "bg-[#e8f4ec] text-[#4c7259]",
        tone === "red" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {children}
    </span>
  );
}

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const fieldTextareaClassName =
  "w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 py-3 text-[15px] leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition placeholder:text-[#98a2aa] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export {
  FilterField,
  OrderDetailsDialog,
  OrderFormDialog,
  OrderHeaderCell,
  OrdersLoadingState,
  OrderStatusChip,
  OrderSummaryCard,
  OrderTypeChip,
  OrderValueCell,
  filterInputClassName,
};
