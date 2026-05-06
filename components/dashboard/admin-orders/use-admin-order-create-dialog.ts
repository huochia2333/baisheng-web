"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type BusinessCategoryOption,
  createAdminOrder,
} from "@/lib/admin-orders";
import {
  findTodayCnyExchangeRate,
  type ExchangeRateRow,
} from "@/lib/exchange-rates";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createOrderFormState,
  applyTodayExchangeRateToOrderForm,
  parseCreateOrderForm,
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
  ordersUiCopy,
  refreshOrdersRoute,
  setPageFeedback,
  sharedCopy,
  supabase,
  t,
  todayExchangeRates,
}: {
  canCreateOrders: boolean;
  canOpenCreateDialog: boolean;
  currentViewerId: string | null;
  orderCategoryByTypeId: Map<string, string | null>;
  orderTypeOptions: BusinessCategoryOption[];
  ordersUiCopy: OrdersUiCopy;
  refreshOrdersRoute: () => void;
  setPageFeedback: PageFeedbackSetter;
  sharedCopy: DashboardSharedCopy;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  t: OrdersTranslator;
  todayExchangeRates: ExchangeRateRow[];
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createDialogFeedback, setCreateDialogFeedback] =
    useState<PageFeedback>(null);
  const [createFormState, setCreateFormState] = useState<OrderFormState>(() =>
    createOrderFormState(),
  );

  useEffect(() => {
    if (createDialogOpen) {
      return;
    }

    setCreateFormState((current) =>
      applyTodayExchangeRateToOrderForm(
        {
          ...current,
          orderEntryUser: current.orderEntryUser || (currentViewerId ?? ""),
          orderType: current.orderType || (orderTypeOptions[0]?.id ?? ""),
        },
        todayExchangeRates,
      ),
    );
  }, [createDialogOpen, currentViewerId, orderTypeOptions, todayExchangeRates]);

  const openCreateDialog = useCallback(() => {
    if (!canOpenCreateDialog) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(
      applyTodayExchangeRateToOrderForm(
        createOrderFormState({
          orderEntryUser: currentViewerId ?? "",
          orderType: orderTypeOptions[0]?.id ?? "",
        }),
        todayExchangeRates,
      ),
    );
    setCreateDialogOpen(true);
  }, [
    canOpenCreateDialog,
    currentViewerId,
    orderTypeOptions,
    setPageFeedback,
    todayExchangeRates,
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
        const nextState = getNextOrderFormState(current, key, value);

        if (key !== "originalCurrency") {
          return nextState;
        }

        return applyTodayExchangeRateToOrderForm(nextState, todayExchangeRates);
      });
    },
    [todayExchangeRates],
  );

  const handleCreateOrder = useCallback(async () => {
    if (!supabase || createPending || !canCreateOrders) {
      return;
    }

    const currentRate = findTodayCnyExchangeRate(
      todayExchangeRates,
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
        applyTodayExchangeRateToOrderForm(
          createOrderFormState({
            orderEntryUser: currentViewerId ?? "",
            orderType: orderTypeOptions[0]?.id ?? "",
          }),
          todayExchangeRates,
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
    orderCategoryByTypeId,
    orderTypeOptions,
    ordersUiCopy,
    refreshOrdersRoute,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
    todayExchangeRates,
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
