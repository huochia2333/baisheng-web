"use client";

import { useMemo } from "react";

import { LoaderCircle, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceFeeTypeOption,
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
import { OrderCurrencyRateFields } from "./admin-orders-currency-fields";
import { getOrderStatusOptions } from "./admin-orders-status-options";
import {
  fieldInputClassName,
  OrderField,
} from "./admin-orders-dialog-ui";
import { OrderSupplementaryFormSections } from "./admin-orders-supplementary-form-sections";
import { type PageFeedback } from "./admin-orders-view-model-shared";

export function OrderFormDialog({
  mode,
  title,
  description,
  submitLabel,
  canManageServiceFee,
  showCostField,
  feedback,
  currencyOptions,
  open,
  pending,
  formState,
  orderDiscountOptions,
  orderTypeOptions,
  orderEntryUserOptions,
  orderingUserOptions,
  orderUserOptions,
  purchaseOrderTypeOptions,
  serviceFeeTypeOptions,
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
  canManageServiceFee: boolean;
  showCostField: boolean;
  feedback?: PageFeedback;
  currencyOptions: OrderCurrencyOption[];
  open: boolean;
  pending: boolean;
  formState: OrderFormState;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderEntryUserOptions?: OrderUserOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orderUserOptions: OrderUserOption[];
  orderingUserOptions?: OrderUserOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceFeeTypeOptions: ServiceFeeTypeOption[];
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
  const visiblePurchaseOrderTypeOptions = useMemo(() => {
    if (selectedOrderCategory === "dropshipping") {
      return purchaseOrderTypeOptions.filter(
        (option) => option.business_subcategory === "dropshipping",
      );
    }

    return purchaseOrderTypeOptions.filter(
      (option) => option.business_subcategory !== "dropshipping",
    );
  }, [purchaseOrderTypeOptions, selectedOrderCategory]);
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
          <OrderCurrencyRateFields
            currencyOptions={currencyOptions}
            formState={formState}
            isFormBusy={isFormBusy}
            lockCurrencyField={lockCurrencyField}
            lockExchangeRateFields={lockExchangeRateFields}
            mode={mode}
            onFieldChange={onFieldChange}
          />

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

          <OrderSupplementaryFormSections
            canManageServiceFee={canManageServiceFee}
            formState={formState}
            isFormBusy={isFormBusy}
            mode={mode}
            orderDiscountOptions={orderDiscountOptions}
            purchaseOrderTypeOptions={visiblePurchaseOrderTypeOptions}
            selectedOrderCategory={selectedOrderCategory}
            serviceFeeTypeOptions={serviceFeeTypeOptions}
            serviceOrderTypeOptions={serviceOrderTypeOptions}
            supplementaryLoading={supplementaryLoading}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
    </DashboardDialog>
  );
}
