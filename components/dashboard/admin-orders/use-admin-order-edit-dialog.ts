"use client";

import { useCallback, useEffect, useState, useRef } from "react";

import {
  getAdminOrderSupplementaryDetail,
  updateAdminOrder,
  type AdminOrderRow,
} from "@/lib/admin-orders";
import { previewOrderServiceFeeType } from "@/lib/service-fee-types";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  createOrderFormState,
  createOrderFormStateFromOrder,
  parseCreateOrderForm,
  type OrderFormState,
  type OrdersUiCopy,
} from "./admin-orders-utils";
import { getNextOrderFormState } from "./admin-orders-client-config";
import { parseNumericValue } from "./admin-orders-display";
import {
  type OrdersTranslator,
  type PageFeedback,
  type PageFeedbackSetter,
} from "./admin-orders-view-model-shared";
import { type OrderServiceFeePreviewState } from "./admin-orders-service-fee-preview";
import { toOrderErrorMessage } from "./admin-orders-errors";
import { type DashboardSharedCopy } from "../dashboard-shared-ui";

export function useAdminOrderEditDialog({
  canEditOrders,
  clearSelectedOrder,
  orderCategoryByTypeId,
  ordersUiCopy,
  refreshOrdersRoute,
  setPageFeedback,
  sharedCopy,
  supabase,
  t,
}: {
  canEditOrders: boolean;
  clearSelectedOrder: () => void;
  orderCategoryByTypeId: Map<string, string | null>;
  ordersUiCopy: OrdersUiCopy;
  refreshOrdersRoute: () => void;
  setPageFeedback: PageFeedbackSetter;
  sharedCopy: DashboardSharedCopy;
  supabase: ReturnType<typeof getBrowserSupabaseClient>;
  t: OrdersTranslator;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogFeedback, setEditDialogFeedback] =
    useState<PageFeedback>(null);
  const [editSupplementaryLoading, setEditSupplementaryLoading] =
    useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editOriginalOrderNumber, setEditOriginalOrderNumber] = useState<
    string | null
  >(null);
  const [editFormState, setEditFormState] = useState<OrderFormState>(() =>
    createOrderFormState(),
  );
  const [editServiceFeePreview, setEditServiceFeePreview] =
    useState<OrderServiceFeePreviewState>({ feeType: null, status: "idle" });
  const editSupplementaryLoadTokenRef = useRef(0);
  const editServiceFeePreviewTokenRef = useRef(0);

  const openEditDialog = useCallback(
    (order: AdminOrderRow) => {
      setPageFeedback(null);
      clearSelectedOrder();
      setEditDialogFeedback(null);
      setEditOriginalOrderNumber(order.order_number);
      setEditFormState(createOrderFormStateFromOrder(order));
      setEditDialogOpen(true);

      if (!supabase) {
        return;
      }

      const loadToken = editSupplementaryLoadTokenRef.current + 1;
      editSupplementaryLoadTokenRef.current = loadToken;
      setEditSupplementaryLoading(true);

      void getAdminOrderSupplementaryDetail(supabase, order.order_number)
        .then((detail) => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditFormState(createOrderFormStateFromOrder(order, detail));
        })
        .catch((error) => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditDialogFeedback({
            tone: "error",
            message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
          });
        })
        .finally(() => {
          if (editSupplementaryLoadTokenRef.current !== loadToken) {
            return;
          }

          setEditSupplementaryLoading(false);
        });
    },
    [clearSelectedOrder, ordersUiCopy, setPageFeedback, sharedCopy, supabase],
  );

  const handleEditDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && editPending) {
        return;
      }

      if (!open) {
        setEditOriginalOrderNumber(null);
        setEditDialogFeedback(null);
        setEditSupplementaryLoading(false);
        editSupplementaryLoadTokenRef.current += 1;
      }

      setEditDialogOpen(open);
    },
    [editPending],
  );

  const updateEditFormField = useCallback(
    <Key extends keyof OrderFormState>(key: Key, value: OrderFormState[Key]) => {
      setEditDialogFeedback(null);
      setEditFormState((current) => getNextOrderFormState(current, key, value));
    },
    [],
  );

  useEffect(() => {
    if (
      !editDialogOpen ||
      !supabase ||
      !editFormState.orderType ||
      !editFormState.orderingUser
    ) {
      editServiceFeePreviewTokenRef.current += 1;
      setEditServiceFeePreview({ feeType: null, status: "idle" });
      return;
    }

    const previewToken = editServiceFeePreviewTokenRef.current + 1;
    editServiceFeePreviewTokenRef.current = previewToken;
    const rmbAmount = parseNumericValue(editFormState.rmbAmount) ?? 0;

    setEditServiceFeePreview({ feeType: null, status: "loading" });

    void previewOrderServiceFeeType(supabase, {
      existingOrderNumber: editOriginalOrderNumber,
      orderType: editFormState.orderType,
      orderingUser: editFormState.orderingUser,
      rmbAmount,
    })
      .then((feeType) => {
        if (editServiceFeePreviewTokenRef.current !== previewToken) {
          return;
        }

        setEditServiceFeePreview({ feeType, status: "ready" });
      })
      .catch(() => {
        if (editServiceFeePreviewTokenRef.current !== previewToken) {
          return;
        }

        setEditServiceFeePreview({ feeType: null, status: "error" });
      });
  }, [
    editDialogOpen,
    editFormState.orderType,
    editFormState.orderingUser,
    editFormState.rmbAmount,
    editOriginalOrderNumber,
    supabase,
  ]);

  const handleEditOrder = useCallback(async () => {
    if (!supabase || editPending || !editOriginalOrderNumber || !canEditOrders) {
      return;
    }

    const parsed = parseCreateOrderForm(
      editFormState,
      orderCategoryByTypeId,
      ordersUiCopy,
    );

    if (!parsed.ok) {
      setEditDialogFeedback({ tone: "error", message: parsed.message });
      return;
    }

    setEditPending(true);
    setEditDialogFeedback(null);
    setPageFeedback(null);

    try {
      const updatedOrder = await updateAdminOrder(supabase, {
        originalOrderNumber: editOriginalOrderNumber,
        ...parsed.payload,
      });

      setEditDialogOpen(false);
      setEditDialogFeedback(null);
      setEditOriginalOrderNumber(null);
      clearSelectedOrder();
      setPageFeedback({
        tone: "success",
        message: t("feedback.updateSuccess", {
          orderNumber: updatedOrder.order_number,
        }),
      });
      refreshOrdersRoute();
    } catch (error) {
      setEditDialogFeedback({
        tone: "error",
        message: toOrderErrorMessage(error, ordersUiCopy, sharedCopy),
      });
    } finally {
      setEditPending(false);
    }
  }, [
    canEditOrders,
    clearSelectedOrder,
    editFormState,
    editOriginalOrderNumber,
    editPending,
    orderCategoryByTypeId,
    ordersUiCopy,
    refreshOrdersRoute,
    setPageFeedback,
    sharedCopy,
    supabase,
    t,
  ]);

  return {
    editDialogFeedback,
    editDialogOpen,
    editFormState,
    editPending,
    editServiceFeePreview,
    editSupplementaryLoading,
    handleEditDialogOpenChange,
    handleEditOrder,
    openEditDialog,
    updateEditFormField,
  };
}
