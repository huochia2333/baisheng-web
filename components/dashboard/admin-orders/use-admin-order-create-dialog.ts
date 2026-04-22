"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type BusinessCategoryOption,
  createAdminOrder,
} from "@/lib/admin-orders";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createOrderFormState,
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
      ({
        ...current,
        orderEntryUser: current.orderEntryUser || (currentViewerId ?? ""),
        orderType: current.orderType || (orderTypeOptions[0]?.id ?? ""),
      }),
    );
  }, [createDialogOpen, currentViewerId, orderTypeOptions]);

  const openCreateDialog = useCallback(() => {
    if (!canOpenCreateDialog) {
      return;
    }

    setPageFeedback(null);
    setCreateDialogFeedback(null);
    setCreateFormState(
      createOrderFormState({
        orderEntryUser: currentViewerId ?? "",
        orderType: orderTypeOptions[0]?.id ?? "",
      }),
    );
    setCreateDialogOpen(true);
  }, [canOpenCreateDialog, currentViewerId, orderTypeOptions, setPageFeedback]);

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
      setCreateFormState((current) => getNextOrderFormState(current, key, value));
    },
    [],
  );

  const handleCreateOrder = useCallback(async () => {
    if (!supabase || createPending || !canCreateOrders) {
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
        createOrderFormState({
          orderEntryUser: currentViewerId ?? "",
          orderType: orderTypeOptions[0]?.id ?? "",
        }),
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
