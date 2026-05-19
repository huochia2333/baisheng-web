"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type BusinessCategoryOption,
  createAdminOrder,
  type ServiceFeeTypeOption,
} from "@/lib/admin-orders";
import {
  findLatestCnyExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createOrderFormState,
  applyOrderExchangeRateToOrderForm,
  parseCreateOrderForm,
  getDefaultOrderCurrency,
  getDefaultServiceFeeTypeId,
  type OrderFormState,
  type OrdersUiCopy,
} from "./admin-orders-utils";
import {
  getNextOrderFormState,
} from "./admin-orders-client-config";
import {
  type OrdersTranslator,
  type PageFeedback,
  type PageFeedbackSetter,
} from "./admin-orders-view-model-shared";
import { toOrderErrorMessage } from "./admin-orders-errors";
import { type DashboardSharedCopy } from "../dashboard-shared-ui";

export function useAdminOrderCreateDialog({
  canCreateOrders,
  canOpenCreateDialog,
  currentViewerId,
  orderCategoryByTypeId,
  orderTypeOptions,
  serviceFeeTypeOptions,
  ordersUiCopy,
  refreshOrdersRoute,
  setPageFeedback,
  sharedCopy,
  supabase,
  t,
  orderCurrencyRates,
}: {
  canCreateOrders: boolean;
  canOpenCreateDialog: boolean;
  currentViewerId: string | null;
  orderCategoryByTypeId: Map<string, string | null>;
  orderTypeOptions: BusinessCategoryOption[];
  serviceFeeTypeOptions: ServiceFeeTypeOption[];
  ordersUiCopy: OrdersUiCopy;
  refreshOrdersRoute: () => void;
  setPageFeedback: PageFeedbackSetter;
  sharedCopy: DashboardSharedCopy;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  t: OrdersTranslator;
  orderCurrencyRates: ExchangeRateRow[];
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] =
    useState<PageFeedback>(null);
  const [createFormState, setCreateFormState] = useState<OrderFormState>(() =>
    createOrderFormState(),
  );
  const defaultOriginalCurrency = useMemo(
    () => getDefaultOrderCurrency(orderCurrencyRates),
    [orderCurrencyRates],
  );
  const defaultServiceFeeType = useMemo(
    () => getDefaultServiceFeeTypeId(serviceFeeTypeOptions),
    [serviceFeeTypeOptions],
  );

  useEffect(() => {
    if (createDialogOpen) {
      return;
    }

    setCreateFormState((current) =>
      applyOrderExchangeRateToOrderForm(
        {
          ...current,
          originalCurrency: current.originalCurrency || defaultOriginalCurrency,
          orderEntryUser: current.orderEntryUser || (currentViewerId ?? ""),
          orderType: current.orderType || (orderTypeOptions[0]?.id ?? ""),
          serviceFeeType: current.serviceFeeType || defaultServiceFeeType,
        },
        orderCurrencyRates,
      ),
    );
  }, [
    createDialogOpen,
    currentViewerId,
    defaultOriginalCurrency,
    defaultServiceFeeType,
    orderTypeOptions,
    orderCurrencyRates,
  ]);

  const openCreateDialog = useCallback(() => {
    if (!canOpenCreateDialog) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(
      applyOrderExchangeRateToOrderForm(
        createOrderFormState({
          originalCurrency: defaultOriginalCurrency,
          orderEntryUser: currentViewerId ?? "",
          orderType: orderTypeOptions[0]?.id ?? "",
          serviceFeeType: defaultServiceFeeType,
        }),
        orderCurrencyRates,
      ),
    );
    setCreateDialogOpen(true);
  }, [
    canOpenCreateDialog,
    currentViewerId,
    defaultOriginalCurrency,
    defaultServiceFeeType,
    orderTypeOptions,
    setPageFeedback,
    orderCurrencyRates,
  ]);

  const handleCreateDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && createPending) {
        return;
      }

      if (!open) {
        setCreateDialogFeedback(null);
      }

      setCreateDialogOpen(open);
    },
    [createPending],
  );

  const updateCreateFormField = useCallback(
    <Key extends keyof OrderFormState>(key: Key, value: OrderFormState[Key]) => {
      setCreateDialogFeedback(null);
      setCreateFormState((current) => {
        const nextState = getNextOrderFormState(current, key, value, {
          defaultServiceFeeType,
        });

        if (key !== "originalCurrency") {
          return nextState;
        }

        return applyOrderExchangeRateToOrderForm(nextState, orderCurrencyRates);
      });
    },
    [defaultServiceFeeType, orderCurrencyRates],
  );

  const handleCreateOrder = useCallback(async () => {
    if (!supabase || createPending || !canCreateOrders) {
      return;
    }

    const currentRate = findLatestCnyExchangeRate(
      orderCurrencyRates,
      createFormState.originalCurrency,
    );

    if (!currentRate) {
      setCreateDialogFeedback({
        tone: "error",
        message: ordersUiCopy.errors.exchangeRateMissing,
      });
      return;
    }

    const parsed = parseCreateOrderForm(
      createFormState,
      orderCategoryByTypeId,
      ordersUiCopy,
    );

    if (!parsed.ok) {
      setCreateDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setCreatePending(true);
    setCreateDialogFeedback(null);
    setPageFeedback(null);

    try {
      const createdOrder = await createAdminOrder(supabase, parsed.payload);
      setCreateDialogOpen(false);
      setCreateDialogFeedback(null);
      setCreateFormState(
        applyOrderExchangeRateToOrderForm(
          createOrderFormState({
            originalCurrency: defaultOriginalCurrency,
            orderEntryUser: currentViewerId ?? "",
            orderType: orderTypeOptions[0]?.id ?? "",
            serviceFeeType: defaultServiceFeeType,
          }),
          orderCurrencyRates,
        ),
      );
      setPageFeedback({
        tone: "success",
        message: t("feedback.createSuccess", {
          orderNumber: createdOrder.order_number,
        }),
      });
      refreshOrdersRoute();
    } catch (error) {
      setCreateDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setCreatePending(false);
    }
  }, [
    canCreateOrders,
    createFormState,
    createPending,
    currentViewerId,
    defaultOriginalCurrency,
    defaultServiceFeeType,
    orderCategoryByTypeId,
    orderTypeOptions,
    ordersUiCopy,
    refreshOrdersRoute,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
    orderCurrencyRates,
  ]);

  return {
    createDialogFeedback,
    createDialogOpen,
    createFormState,
    createPending,
    handleCreateDialogOpenChange,
    handleCreateOrder,
    openCreateDialog,
    updateCreateFormField,
  };
}
