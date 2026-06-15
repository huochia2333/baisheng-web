"use client";

import { useMemo } from "react";

import { LoaderCircle, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceOrderPriceOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";

import { PageBanner } from "../dashboard-shared-ui";
import { DashboardDialog } from "../dashboard-dialog";
import { Button } from "../../ui/button";
import {
  createOrdersUiCopy,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  type OrderCurrencyOption,
  type OrderFormState,
} from "./admin-orders-utils";
import { getOrderStatusOptions } from "./admin-orders-status-options";
import {
  fieldInputClassName,
  OrderFormSection,
  OrderField,
} from "./admin-orders-dialog-ui";
import {
  OrderServiceFeePreview,
  type OrderServiceFeePreviewState,
} from "./admin-orders-service-fee-preview";
import { OrderSupplementaryFormSections } from "./admin-orders-supplementary-form-sections";
import { type PageFeedback } from "./admin-orders-view-model-shared";

export function OrderFormDialog({
  mode,
  title,
  description,
  submitLabel,
  showCostField,
  feedback,
  currencyOptions,
  open,
  pending,
  formState,
  serviceFeePreview,
  orderDiscountOptions,
  orderTypeOptions,
  orderEntryUserOptions,
  orderingUserOptions,
  orderUserOptions,
  purchaseOrderTypeOptions,
  serviceOrderPriceOptions,
  serviceOrderTypeOptions,
  supplementaryLoading = false,
  lockCurrencyField = false,
  lockExchangeRateFields = false,
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
  currencyOptions: OrderCurrencyOption[];
  open: boolean;
  pending: boolean;
  formState: OrderFormState;
  serviceFeePreview?: OrderServiceFeePreviewState;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderEntryUserOptions?: OrderUserOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orderUserOptions: OrderUserOption[];
  orderingUserOptions?: OrderUserOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceOrderPriceOptions: ServiceOrderPriceOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  supplementaryLoading?: boolean;
  lockCurrencyField?: boolean;
  lockExchangeRateFields?: boolean;
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
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);
  const orderStatusOptions = getOrderStatusOptions(t);
  const selectedOrderCategory = useMemo(() => {
    return (
      orderTypeOptions.find((option) => option.id === formState.orderType)?.category ?? null
    );
  }, [formState.orderType, orderTypeOptions]);
  const isFormBusy = pending || supplementaryLoading;
  const showCostInput = showCostField && selectedOrderCategory !== "vip_recharge";
  const isAmountLocked =
    selectedOrderCategory === "service" || selectedOrderCategory === "vip_recharge";
  const showServiceFeePreview = Boolean(
    serviceFeePreview &&
      selectedOrderCategory !== "vip_recharge" &&
      selectedOrderCategory !== "service",
  );

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

        <OrderFormSection
          description={t("formSections.basic.description")}
          title={t("formSections.basic.title")}
        >
          <div className="grid gap-5 md:grid-cols-2">
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

            <OrderField label={t("fields.originalCurrency")} required>
              {lockCurrencyField ? (
                <input
                  className={fieldInputClassName}
                  disabled
                  readOnly
                  type="text"
                  value={formState.originalCurrency}
                />
              ) : (
                <select
                  className={fieldInputClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
                  value={formState.originalCurrency}
                >
                  <option value="">{t("select.originalCurrency")}</option>
                  {currencyOptions.map((option) => (
                    <option key={option.currency} value={option.currency}>
                      {option.currency}
                    </option>
                  ))}
                </select>
              )}
              {lockCurrencyField ? (
                <p className="mt-2 text-xs text-[#7b8790]">
                  {t("hints.lockedCurrencyAndRates")}
                </p>
              ) : null}
            </OrderField>

            <OrderField label={t("fields.amount")} required>
              <input
                className={fieldInputClassName}
                disabled={isFormBusy || isAmountLocked}
                min="0"
                onChange={(event) => onFieldChange("amount", event.target.value)}
                placeholder={t("placeholders.amount")}
                readOnly={isAmountLocked}
                step="0.01"
                type="number"
                value={formState.amount}
              />
              {selectedOrderCategory === "service" ? (
                <p className="mt-2 text-xs text-[#7b8790]">
                  {t("hints.serviceAmountLocked")}
                </p>
              ) : null}
            </OrderField>

            <OrderField label={t("fields.rmbAmount")} required>
              <input
                className={fieldInputClassName}
                disabled
                min="0"
                placeholder={t("placeholders.rmbAmount")}
                readOnly
                step="0.01"
                type="number"
                value={formState.rmbAmount}
              />
              <p className="mt-2 text-xs text-[#7b8790]">{t("hints.autoRmbAmount")}</p>
            </OrderField>

            {showCostInput ? (
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

            <OrderField label={t("fields.dailyExchangeRate")} required>
              <input
                className={fieldInputClassName}
                disabled={isFormBusy || lockExchangeRateFields}
                min="0"
                onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
                placeholder={t("placeholders.dailyExchangeRate")}
                readOnly={lockExchangeRateFields}
                step="0.0001"
                type="number"
                value={formState.dailyExchangeRate}
              />
              {lockExchangeRateFields ? (
                <p className="mt-2 text-xs text-[#7b8790]">
                  {t(
                    mode === "create"
                      ? "hints.autoDailyExchangeRate"
                      : "hints.lockedCurrencyAndRates",
                  )}
                </p>
              ) : null}
            </OrderField>

            <OrderField label={t("fields.transactionRate")} required>
              <input
                className={fieldInputClassName}
                disabled={isFormBusy || lockExchangeRateFields}
                min="0"
                placeholder={t("placeholders.transactionRate")}
                readOnly
                step="0.000001"
                type="number"
                value={formState.transactionRate}
              />
              <p className="mt-2 text-xs text-[#7b8790]">{t("hints.transactionRate")}</p>
            </OrderField>

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
          </div>
        </OrderFormSection>

          {showServiceFeePreview && serviceFeePreview ? (
            <OrderServiceFeePreview
              preview={serviceFeePreview}
              rmbAmount={formState.rmbAmount}
            />
          ) : null}

          <div className="rounded-[22px] border border-[#ebe7e1] bg-white px-5 py-4 text-sm leading-7 text-[#66717a] shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
            {t("hints.autoTimestamps")}
          </div>

          <OrderSupplementaryFormSections
            formState={formState}
            isFormBusy={isFormBusy}
            mode={mode}
            orderDiscountOptions={orderDiscountOptions}
            purchaseOrderTypeOptions={purchaseOrderTypeOptions}
            selectedOrderCategory={selectedOrderCategory}
            serviceOrderPriceOptions={serviceOrderPriceOptions}
            serviceOrderTypeOptions={serviceOrderTypeOptions}
            supplementaryLoading={supplementaryLoading}
            onFieldChange={onFieldChange}
          />
      </div>
    </DashboardDialog>
  );
}
