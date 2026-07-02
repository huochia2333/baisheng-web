"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  getWholesaleOrderIds,
  getWholesaleOrderRpcPayload,
  optionalPositiveNumber,
  optionalString,
  positiveNumber,
  requiredString,
  splitList,
  toWholesaleActionErrorMessage,
} from "./wholesale-action-utils";
import { createWholesaleLogisticsStatus } from "./wholesale-logistics-mutations";

type ActionFeedback = {
  tone: "error" | "success";
  message: string;
} | null;

type Imported1688Row = {
  external_order_number: string;
  seller_name?: string | null;
  item_summary?: string | null;
  quantity?: number | null;
  purchase_amount?: number | null;
  order_status?: string | null;
  purchased_at?: string | null;
  recipient_name?: string | null;
  customer_id?: string | null;
  wholesale_order_id?: string | null;
  raw_payload: Record<string, unknown>;
};

export function useWholesaleActions() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<ActionFeedback>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const runAction = useCallback(
    async (key: string, successMessage: string, action: () => Promise<void>) => {
      const supabase = getBrowserSupabaseClient();

      if (!supabase) {
        setFeedback({
          tone: "error",
          message: "当前无法连接系统，请刷新页面后再试。",
        });
        return;
      }

      setPendingKey(key);
      setFeedback(null);

      try {
        await action();
        setFeedback({ tone: "success", message: successMessage });
        router.refresh();
      } catch (error) {
        setFeedback({
          tone: "error",
          message: toWholesaleActionErrorMessage(error),
        });
      } finally {
        setPendingKey(null);
      }
    },
    [router],
  );

  const createCustomer = useCallback(
    (formData: FormData) =>
      runAction("customer:create", "批发客户已保存。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const payload = {
          assigned_sales_user_id: optionalString(formData.get("assigned_sales_user_id")),
          contact_details: optionalString(formData.get("contact_details")),
          customer_kind: "sales_created",
          notes: optionalString(formData.get("notes")),
          other_names: splitList(formData.get("other_names")),
          source: optionalString(formData.get("source")),
          unique_name: requiredString(formData.get("unique_name")),
        };

        const { error } = await supabase.from("wholesale_customers").insert(payload);
        if (error) throw error;
      }),
    [runAction],
  );

  const linkCustomerAccount = useCallback(
    (formData: FormData) => {
      const customerId = requiredString(formData.get("customer_id"));

      return runAction(
        `customer:link-account:${customerId}`,
        "批发客户和注册账号已合并。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } = await supabase.rpc(
            "link_wholesale_customer_registered_user",
            {
              p_customer_id: customerId,
              p_registered_user_id: requiredString(
                formData.get("registered_user_id"),
              ),
            },
          );

          if (error) throw error;
        },
      );
    },
    [runAction],
  );

  const createOrder = useCallback(
    (formData: FormData) =>
      runAction("order:create", "批发订单已保存。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.rpc(
          "create_wholesale_order",
          getWholesaleOrderRpcPayload(formData),
        );
        if (error) throw error;
      }),
    [runAction],
  );

  const updateOrder = useCallback(
    (formData: FormData) => {
      const orderId = requiredString(formData.get("order_id"));

      return runAction(
        `order:update:${orderId}`,
        "批发订单已更新。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } = await supabase.rpc("update_wholesale_order", {
            p_order_id: orderId,
            ...getWholesaleOrderRpcPayload(formData),
          });

          if (error) throw error;

          if (formData.get("settlement_exchange_rate_changed") === "true") {
            const { error: rateError } = await supabase.rpc(
              "update_wholesale_order_settlement_exchange_rate",
              {
                p_order_id: orderId,
                p_settlement_exchange_rate: positiveNumber(
                  formData.get("settlement_exchange_rate"),
                ),
              },
            );

            if (rateError) throw rateError;
          }
        },
      );
    },
    [runAction],
  );

  const requestOrderEdit = useCallback(
    (formData: FormData) => {
      const orderId = requiredString(formData.get("order_id"));

      return runAction(
        `order:edit-request:${orderId}`,
        "修改申请已提交，等待管理员处理。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } = await supabase.rpc("request_wholesale_order_edit", {
            p_order_id: orderId,
            p_request_note: optionalString(formData.get("request_note")),
            ...getWholesaleOrderRpcPayload(formData),
          });

          if (error) throw error;
        },
      );
    },
    [runAction],
  );

  const markOrderSettled = useCallback(
    (formData: FormData) => {
      const orderId = requiredString(formData.get("order_id"));

      return runAction(`order:settle:${orderId}`, "订单已标记为已结汇。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.rpc("mark_wholesale_order_settled", {
          p_manual_exchange_rate: optionalPositiveNumber(
            formData.get("manual_exchange_rate"),
          ),
          p_order_id: orderId,
        });

        if (error) throw error;
      });
    },
    [runAction],
  );

  const updateOrderSettlementRate = useCallback(
    (formData: FormData) => {
      const orderIds = getWholesaleOrderIds(formData);
      const exchangeRate = positiveNumber(formData.get("settlement_exchange_rate"));

      return runAction(
        orderIds.length > 1
          ? "order:rate:bulk"
          : `order:rate:${orderIds[0] ?? "missing"}`,
        orderIds.length > 1 ? "已批量修改结汇汇率。" : "结汇汇率已修改。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } =
            orderIds.length > 1
              ? await supabase.rpc(
                  "bulk_update_wholesale_order_settlement_exchange_rate",
                  {
                    p_order_ids: orderIds,
                    p_settlement_exchange_rate: exchangeRate,
                  },
                )
              : await supabase.rpc(
                  "update_wholesale_order_settlement_exchange_rate",
                  {
                    p_order_id: requiredString(formData.get("order_id")),
                    p_settlement_exchange_rate: exchangeRate,
                  },
                );

          if (error) throw error;
        },
      );
    },
    [runAction],
  );

  const approveOrderEditRequest = useCallback(
    (requestId: string) =>
      runAction(
        `order-edit:approve:${requestId}`,
        "修改申请已通过，订单已更新。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } = await supabase.rpc(
            "approve_wholesale_order_edit_request",
            {
              p_request_id: requestId,
              p_review_note: null,
            },
          );

          if (error) throw error;
        },
      ),
    [runAction],
  );

  const rejectOrderEditRequest = useCallback(
    (requestId: string) =>
      runAction(
        `order-edit:reject:${requestId}`,
        "修改申请已退回。",
        async () => {
          const supabase = getBrowserSupabaseClient();
          if (!supabase) throw new Error("client unavailable");

          const { error } = await supabase.rpc(
            "reject_wholesale_order_edit_request",
            {
              p_request_id: requestId,
              p_review_note: null,
            },
          );

          if (error) throw error;
        },
      ),
    [runAction],
  );

  const import1688Rows = useCallback(
    (fileName: string, rows: Imported1688Row[]) =>
      runAction("1688:import", "1688 采购订单已接收。", async () => {
        if (rows.length === 0) {
          throw new Error("empty import");
        }

        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { data: batch, error: batchError } = await supabase
          .from("wholesale_1688_import_batches")
          .insert({
            file_name: fileName,
            row_count: rows.length,
            source: "csv",
          })
          .select("id")
          .single();

        if (batchError || !batch) throw batchError ?? new Error("batch failed");

        const { error } = await supabase
          .from("wholesale_1688_orders")
          .upsert(
            rows.map((row) => ({
              ...row,
              batch_id: batch.id,
              customer_id: null,
              wholesale_order_id: null,
            })),
            { ignoreDuplicates: true, onConflict: "external_order_number" },
          );

        if (error) throw error;
      }),
    [runAction],
  );

  const claim1688Order = useCallback(
    (formData: FormData) =>
      runAction("1688:claim", "采购订单已归属客户。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.rpc("claim_wholesale_1688_order", {
          p_1688_order_id: requiredString(formData.get("purchase_order_id")),
          p_customer_id: requiredString(formData.get("customer_id")),
          p_wholesale_order_id: optionalString(formData.get("wholesale_order_id")),
        });

        if (error) throw error;
      }),
    [runAction],
  );

  const delete1688Order = useCallback(
    (purchaseOrderId: string) =>
      runAction("1688:delete", "采购订单已移出当前认领列表。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.rpc("delete_wholesale_1688_order", {
          p_1688_order_id: purchaseOrderId,
        });

        if (error) throw error;
      }),
    [runAction],
  );

  const createLogisticsStatus = useCallback(
    (formData: FormData) =>
      runAction("logistics-status:create", "物流号已加入每日核对。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        await createWholesaleLogisticsStatus(supabase, formData);
      }),
    [runAction],
  );

  const createReferral = useCallback(
    (formData: FormData) =>
      runAction("referral:create", "批发推荐关系已保存。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.from("wholesale_referrals").insert({
          referred_customer_id: requiredString(formData.get("referred_customer_id")),
          referrer_customer_id: requiredString(formData.get("referrer_customer_id")),
        });

        if (error) throw error;
      }),
    [runAction],
  );

  const settleCommission = useCallback(
    (commissionId: string) =>
      runAction("commission:settle", "提成已标记为已结算。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase
          .from("wholesale_commissions")
          .update({
            settled_at: new Date().toISOString(),
            status: "settled",
          })
          .eq("id", commissionId);

        if (error) throw error;
      }),
    [runAction],
  );

  return {
    approveOrderEditRequest,
    claim1688Order,
    createCustomer,
    createLogisticsStatus,
    createOrder,
    createReferral,
    delete1688Order,
    feedback,
    import1688Rows,
    linkCustomerAccount,
    markOrderSettled,
    pendingKey,
    rejectOrderEditRequest,
    requestOrderEdit,
    settleCommission,
    updateOrder,
    updateOrderSettlementRate,
  };
}
