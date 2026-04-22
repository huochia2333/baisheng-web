"use client";

import { useCallback, useState } from "react";

import {
  deleteAdminOrder,
  forceDeleteAdminOrder,
  type AdminOrderRow,
} from "@/lib/admin-orders";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { toOrderErrorMessage } from "./admin-orders-errors";
import {
  type OrdersTranslator,
  type PageFeedbackSetter,
} from "./admin-orders-view-model-shared";
import { type OrdersUiCopy } from "./admin-orders-utils";
import { type DashboardSharedCopy } from "../dashboard-shared-ui";

export function useAdminOrderDeleteActions({
  canDeleteOrders,
  clearSelectedOrder,
  ordersUiCopy,
  refreshOrdersRoute,
  selectedOrder,
  setPageFeedback,
  sharedCopy,
  supabase,
  t,
}: {
  canDeleteOrders: boolean;
  clearSelectedOrder: () => void;
  ordersUiCopy: OrdersUiCopy;
  refreshOrdersRoute: () => void;
  selectedOrder: AdminOrderRow | null;
  setPageFeedback: PageFeedbackSetter;
  sharedCopy: DashboardSharedCopy;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  t: OrdersTranslator;
}) {
  const [deletePending, setDeletePending] = useState(false);
  const [forceDeletePending, setForceDeletePending] = useState(false);

  const handleDeleteOrder = useCallback(async () => {
    if (
      !supabase ||
      !selectedOrder ||
      deletePending ||
      forceDeletePending ||
      !canDeleteOrders
    ) {
      return;
    }

    const targetOrder = selectedOrder;

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        t("feedback.deleteConfirm", { orderNumber: targetOrder.order_number }),
      )
    ) {
      return;
    }

    setDeletePending(true);
    setPageFeedback(null);

    try {
      await deleteAdminOrder(supabase, targetOrder.order_number);
      clearSelectedOrder();
      setPageFeedback({
        tone: "success",
        message: t("feedback.deleteSuccess", {
          orderNumber: targetOrder.order_number,
        }),
      });
      refreshOrdersRoute();
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setDeletePending(false);
    }
  }, [
    canDeleteOrders,
    clearSelectedOrder,
    deletePending,
    forceDeletePending,
    ordersUiCopy,
    refreshOrdersRoute,
    selectedOrder,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
  ]);

  const handleForceDeleteOrder = useCallback(async () => {
    if (
      !supabase ||
      !selectedOrder ||
      deletePending ||
      forceDeletePending ||
      !canDeleteOrders
    ) {
      return;
    }

    const targetOrder = selectedOrder;

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        t("feedback.forceDeleteConfirm", {
          orderNumber: targetOrder.order_number,
        }),
      )
    ) {
      return;
    }

    setForceDeletePending(true);
    setPageFeedback(null);

    try {
      await forceDeleteAdminOrder(supabase, targetOrder.order_number);
      clearSelectedOrder();
      setPageFeedback({
        tone: "success",
        message: t("feedback.forceDeleteSuccess", {
          orderNumber: targetOrder.order_number,
        }),
      });
      refreshOrdersRoute();
    } catch (error) {
      setPageFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setForceDeletePending(false);
    }
  }, [
    canDeleteOrders,
    clearSelectedOrder,
    deletePending,
    forceDeletePending,
    ordersUiCopy,
    refreshOrdersRoute,
    selectedOrder,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
  ]);

  return {
    deletePending,
    forceDeletePending,
    handleDeleteOrder,
    handleForceDeleteOrder,
  };
}
