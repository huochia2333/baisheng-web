"use client";

import { useMemo } from "react";

import { LoaderCircle, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import { useLocale } from "@/components/i18n/locale-provider";

import { PageBanner } from "../dashboard-shared-ui";
import { DashboardDialog } from "../dashboard-dialog";
import { Button } from "../../ui/button";
import {
  createOrdersUiCopy,
  formatDiscountRatioValue,
  formatPurchaseOrderSubtype,
  formatServiceOrderSubtype,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  type OrderFormState,
} from "./admin-orders-utils";
import {
  fieldInputClassName,
  fieldTextareaClassName,
  OrderField,
  OrderSupplementaryFormSection,
} from "./admin-orders-dialog-ui";
import { type PageFeedback } from "./admin-orders-view-model-shared";

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

export function OrderFormDialog({
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
