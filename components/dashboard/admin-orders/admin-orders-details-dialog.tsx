"use client";

import { useEffect, useMemo, useState } from "react";

import { LoaderCircle, PencilLine, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  getAdminOrderSupplementaryDetail,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
} from "@/lib/admin-orders";
import { useLocale } from "@/components/i18n/locale-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createDashboardSharedCopy,
  formatDateTime,
  PageBanner,
} from "../dashboard-shared-ui";
import { DashboardDialog } from "../dashboard-dialog";
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
  getStatusLabel,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
  type OrdersUiCopy,
} from "./admin-orders-utils";
import { OrderDetailCard } from "./admin-orders-dialog-ui";

export function OrderDetailsDialog({
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
  onForceDelete,
  forceDeletePending,
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
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  onEdit: (order: AdminOrderRow) => void;
  onDelete: () => void;
  deletePending: boolean;
  onForceDelete: () => void;
  forceDeletePending: boolean;
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
    if (!orderNumber || !supabase) {
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
  const deleteActionPending = deletePending || forceDeletePending;

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
              <>
                <Button
                  className="border-[#efd6d6] bg-white text-[#b13d3d] hover:bg-[#fff4f4]"
                  disabled={deleteActionPending}
                  onClick={onDelete}
                  type="button"
                  variant="outline"
                >
                  {deletePending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {t("details.softDeleteOrder")}
                </Button>
                <Button
                  className="bg-[#b13d3d] text-white hover:bg-[#972f2f]"
                  disabled={deleteActionPending}
                  onClick={onForceDelete}
                  type="button"
                >
                  {forceDeletePending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {t("details.forceDeleteOrder")}
                </Button>
              </>
            ) : null}
          </>
        ) : null
      }
      description={order ? t("details.description") : undefined}
      onOpenChange={onOpenChange}
      open={order !== null}
      title={
        order
          ? t("details.titleWithOrderNumber", { orderNumber: order.order_number })
          : t("details.title")
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
