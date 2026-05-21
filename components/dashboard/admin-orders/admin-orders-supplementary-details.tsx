"use client";

import { useMemo } from "react";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  type AdminOrderDetailValue,
  type AdminOrderSupplementaryDetail,
} from "@/lib/admin-orders";

import { PageBanner } from "../dashboard-shared-ui";
import { OrderDetailCard } from "./admin-orders-dialog-ui";
import {
  flattenOrderDetailItems,
  formatDiscountRatioValue,
  formatMoneyValue,
  formatPurchaseOrderSubtype,
  formatServiceOrderSubtype,
  formatVipScope,
  type OrdersUiCopy,
} from "./admin-orders-utils";

type OrdersDetailsTranslator = ReturnType<typeof useTranslations>;

export function OrderSupplementaryDetailsSection({
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
  const visibleDetails = useMemo(
    () => (detail ? getVisibleSupplementaryDetails(detail) : null),
    [detail],
  );
  const detailItems = useMemo(
    () =>
      visibleDetails
        ? flattenOrderDetailItems(visibleDetails, locale, orderUiCopy)
        : [],
    [locale, orderUiCopy, visibleDetails],
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

  const formTitle = getSupplementaryFormTitle(detail, t);
  const subtypeLabel = getSupplementarySubtypeLabel(detail, t);
  const subtypeValue = getSupplementarySubtypeValue(detail, orderUiCopy);

  return (
    <section className="rounded-[28px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)] sm:p-6">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-[#23313a]">{formTitle}</h3>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <OrderDetailCard label={t("details.supplementary.sourceForm")} value={formTitle} />
        <OrderDetailCard label={subtypeLabel} value={subtypeValue} />
        {detail.kind === "service" ? (
          <>
            <OrderDetailCard
              label={t("details.supplementary.servicePrice")}
              value={formatServicePriceValue(detail, locale, orderUiCopy)}
            />
            <OrderDetailCard
              label={t("details.supplementary.discount")}
              value={formatDiscountRatioValue(detail.discountRatio, locale, orderUiCopy)}
            />
          </>
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

function formatServicePriceValue(
  detail: Extract<AdminOrderSupplementaryDetail, { kind: "service" }>,
  locale: Parameters<typeof formatMoneyValue>[1],
  orderUiCopy: OrdersUiCopy,
) {
  const label = detail.priceOptionLabel ?? orderUiCopy.fallback.notProvided;
  const amount = formatMoneyValue(detail.priceAmountUsd, locale);

  return amount === "-" ? label : `${label} / $${amount}`;
}

function getVisibleSupplementaryDetails(
  detail: AdminOrderSupplementaryDetail,
): AdminOrderDetailValue {
  if (detail.kind !== "vip_recharge" || !isPlainOrderDetailObject(detail.details)) {
    return detail.details;
  }

  return Object.fromEntries(
    Object.entries(detail.details).filter(
      ([key]) => !isHiddenVipOrderDetailKey(key),
    ),
  ) as AdminOrderDetailValue;
}

function isPlainOrderDetailObject(
  value: AdminOrderDetailValue,
): value is Record<string, AdminOrderDetailValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isHiddenVipOrderDetailKey(key: string) {
  const normalizedKey = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalizedKey === "source" || normalizedKey === "request_id";
}

function getSupplementaryFormTitle(
  detail: AdminOrderSupplementaryDetail,
  t: OrdersDetailsTranslator,
) {
  if (detail.kind === "purchase") {
    return t("details.supplementary.purchaseForm");
  }

  if (detail.kind === "service") {
    return t("details.supplementary.serviceForm");
  }

  return t("details.supplementary.vipForm");
}

function getSupplementarySubtypeLabel(
  detail: AdminOrderSupplementaryDetail,
  t: OrdersDetailsTranslator,
) {
  if (detail.kind === "purchase") {
    return t("details.supplementary.purchaseSubtype");
  }

  if (detail.kind === "service") {
    return t("details.supplementary.serviceSubtype");
  }

  return t("details.supplementary.vipScope");
}

function getSupplementarySubtypeValue(
  detail: AdminOrderSupplementaryDetail,
  orderUiCopy: OrdersUiCopy,
) {
  if (detail.kind === "purchase") {
    return formatPurchaseOrderSubtype(detail.subtype, orderUiCopy);
  }

  if (detail.kind === "service") {
    return formatServiceOrderSubtype(detail.subtype, orderUiCopy);
  }

  return formatVipScope(detail.vipScope, orderUiCopy);
}
