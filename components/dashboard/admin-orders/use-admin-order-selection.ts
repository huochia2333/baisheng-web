"use client";

import { useCallback, useMemo, useState } from "react";

import { type AdminOrderRow } from "@/lib/admin-orders";

export function useAdminOrderSelection(orders: AdminOrderRow[]) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((item) => item.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId],
  );

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  const handleSelectOrder = useCallback((order: AdminOrderRow) => {
    setSelectedOrderId(order.id);
  }, []);

  const handleOrderDetailsOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        clearSelectedOrder();
      }
    },
    [clearSelectedOrder],
  );

  return {
    clearSelectedOrder,
    handleOrderDetailsOpenChange,
    handleSelectOrder,
    selectedOrder,
  };
}
