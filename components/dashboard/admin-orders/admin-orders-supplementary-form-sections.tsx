"use client";

import { useMemo } from "react";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type OrderDiscountTypeOption,
  type PurchaseOrderTypeOption,
  type ServiceFeeTypeOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import { useLocale } from "@/components/i18n/locale-provider";

import {
  fieldInputClassName,
  OrderField,
  OrderSupplementaryFormSection,
} from "./admin-orders-dialog-ui";
import { OrderDetailPairsInput } from "./admin-orders-detail-pairs-input";
import { isPurchaseDetailsCategory } from "./admin-orders-form";
import {
  createOrdersUiCopy,
  formatDiscountRatioValue,
  formatPurchaseOrderSubtype,
  formatServiceOrderSubtype,
  type OrderFormState,
} from "./admin-orders-utils";

type OrderSupplementaryFormSectionsProps = {
  canManageServiceFee: boolean;
  formState: OrderFormState;
  isFormBusy: boolean;
  mode: "create" | "edit";
  orderDiscountOptions: OrderDiscountTypeOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  selectedOrderCategory: string | null;
  serviceFeeTypeOptions: ServiceFeeTypeOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  supplementaryLoading: boolean;
  onFieldChange: <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => void;
};

export function OrderSupplementaryFormSections({
  canManageServiceFee,
  formState,
  isFormBusy,
  mode,
  orderDiscountOptions,
  purchaseOrderTypeOptions,
  selectedOrderCategory,
  serviceFeeTypeOptions,
  serviceOrderTypeOptions,
  supplementaryLoading,
  onFieldChange,
}: OrderSupplementaryFormSectionsProps) {
  if (isPurchaseDetailsCategory(selectedOrderCategory)) {
    return (
      <div className="md:col-span-2">
        <PurchaseSupplementaryFormSection
          formState={formState}
          isFormBusy={isFormBusy}
          mode={mode}
          purchaseOrderTypeOptions={purchaseOrderTypeOptions}
          supplementaryLoading={supplementaryLoading}
          onFieldChange={onFieldChange}
        />
      </div>
    );
  }

  if (selectedOrderCategory === "service") {
    return (
      <div className="md:col-span-2">
        <ServiceSupplementaryFormSection
          canManageServiceFee={canManageServiceFee}
          formState={formState}
          isFormBusy={isFormBusy}
          mode={mode}
          orderDiscountOptions={orderDiscountOptions}
          serviceFeeTypeOptions={serviceFeeTypeOptions}
          serviceOrderTypeOptions={serviceOrderTypeOptions}
          supplementaryLoading={supplementaryLoading}
          onFieldChange={onFieldChange}
        />
      </div>
    );
  }

  return null;
}

function PurchaseSupplementaryFormSection({
  formState,
  isFormBusy,
  mode,
  purchaseOrderTypeOptions,
  supplementaryLoading,
  onFieldChange,
}: Pick<
  OrderSupplementaryFormSectionsProps,
  | "formState"
  | "isFormBusy"
  | "mode"
  | "purchaseOrderTypeOptions"
  | "supplementaryLoading"
  | "onFieldChange"
>) {
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);

  return (
    <OrderSupplementaryFormSection
      description={
        mode === "create"
          ? t("purchaseSection.createDescription")
          : t("purchaseSection.editDescription")
      }
      title={t("purchaseSection.title")}
    >
      {supplementaryLoading ? <SupplementaryLoading message={t("purchaseSection.loading")} /> : null}

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
        <OrderDetailPairsInput
          copy={{
            addLabel: t("detailPairs.add"),
            namePlaceholder: t("detailPairs.namePlaceholder"),
            removeLabel: t("detailPairs.remove"),
            valuePlaceholder: t("detailPairs.valuePlaceholder"),
          }}
          disabled={isFormBusy}
          onChange={(nextValue) => onFieldChange("purchaseDetails", nextValue)}
          value={formState.purchaseDetails}
        />
      </OrderField>
    </OrderSupplementaryFormSection>
  );
}

function ServiceSupplementaryFormSection({
  canManageServiceFee,
  formState,
  isFormBusy,
  mode,
  orderDiscountOptions,
  serviceFeeTypeOptions,
  serviceOrderTypeOptions,
  supplementaryLoading,
  onFieldChange,
}: Pick<
  OrderSupplementaryFormSectionsProps,
  | "canManageServiceFee"
  | "formState"
  | "isFormBusy"
  | "mode"
  | "orderDiscountOptions"
  | "serviceFeeTypeOptions"
  | "serviceOrderTypeOptions"
  | "supplementaryLoading"
  | "onFieldChange"
>) {
  const { locale } = useLocale();
  const t = useTranslations("OrdersUI");
  const orderUiCopy = useMemo(() => createOrdersUiCopy(t), [t]);

  return (
    <OrderSupplementaryFormSection
      description={
        mode === "create"
          ? t("serviceSection.createDescription")
          : t("serviceSection.editDescription")
      }
      title={t("serviceSection.title")}
    >
      {supplementaryLoading ? <SupplementaryLoading message={t("serviceSection.loading")} /> : null}

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

        <OrderField label={t("fields.serviceFeeType")} required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy || !canManageServiceFee}
            onChange={(event) => onFieldChange("serviceFeeType", event.target.value)}
            value={formState.serviceFeeType}
          >
            <option value="">{t("select.serviceFeeType")}</option>
            {serviceFeeTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {formatDiscountRatioValue(option.fee_ratio, locale, orderUiCopy)}
              </option>
            ))}
          </select>
          {!canManageServiceFee ? (
            <p className="mt-2 text-xs text-[#7b8790]">
              {t("hints.serviceFeeLocked")}
            </p>
          ) : null}
        </OrderField>
      </div>

      <OrderField label={t("fields.serviceDetails")}>
        <OrderDetailPairsInput
          copy={{
            addLabel: t("detailPairs.add"),
            namePlaceholder: t("detailPairs.namePlaceholder"),
            removeLabel: t("detailPairs.remove"),
            valuePlaceholder: t("detailPairs.valuePlaceholder"),
          }}
          disabled={isFormBusy}
          onChange={(nextValue) => onFieldChange("serviceDetails", nextValue)}
          value={formState.serviceDetails}
        />
      </OrderField>
    </OrderSupplementaryFormSection>
  );
}

function SupplementaryLoading({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
      <LoaderCircle className="size-4 animate-spin" />
      {message}
    </div>
  );
}
