"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase";

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

        const { error } = await supabase.rpc("create_wholesale_order", {
          p_courier_company: optionalString(formData.get("courier_company")),
          p_customer_id: requiredString(formData.get("customer_id")),
          p_customer_payment_amount: nonnegativeNumber(
            formData.get("customer_payment_amount"),
          ),
          p_customer_payment_currency:
            optionalString(formData.get("customer_payment_currency")) ?? "CNY",
          p_international_shipping_fee: nonnegativeNumber(
            formData.get("international_shipping_fee"),
          ),
          p_notes: optionalString(formData.get("notes")),
          p_order_month: normalizeMonth(formData.get("order_month")),
          p_other_fee: nonnegativeNumber(formData.get("other_fee")),
          p_payment_platform: optionalString(formData.get("payment_platform")),
          p_product_purchase_amount: nonnegativeNumber(
            formData.get("product_purchase_amount"),
          ),
          p_referral_commission_fee: nonnegativeNumber(
            formData.get("referral_commission_fee"),
          ),
          p_sales_user_id: optionalString(formData.get("sales_user_id")),
          p_small_order_count: nonnegativeInteger(formData.get("small_order_count")),
        });
        if (error) throw error;
      }),
    [runAction],
  );

  const markOrderSettled = useCallback(
    (orderId: string) =>
      runAction(`order:settle:${orderId}`, "订单已标记为已结汇。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const { error } = await supabase.rpc("mark_wholesale_order_settled", {
          p_order_id: orderId,
        });

        if (error) throw error;
      }),
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

  const createLogisticsOrder = useCallback(
    (formData: FormData) =>
      runAction("logistics:create", "物流记录已保存。", async () => {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) throw new Error("client unavailable");

        const customerId = optionalString(formData.get("customer_id"));
        const { data: batch, error: batchError } = await supabase
          .from("wholesale_logistics_batches")
          .insert({
            customer_id: customerId,
            source: optionalString(formData.get("batch_source")),
          })
          .select("id")
          .single();

        if (batchError || !batch) throw batchError ?? new Error("batch failed");

        const { error } = await supabase.from("wholesale_logistics_orders").insert({
          batch_id: batch.id,
          currency: optionalString(formData.get("currency")) ?? "CNY",
          customer_id: customerId,
          destination_tracking_number: optionalString(
            formData.get("destination_tracking_number"),
          ),
          freight_forwarder: optionalString(formData.get("freight_forwarder")),
          international_tracking_number: requiredString(
            formData.get("international_tracking_number"),
          ),
          latest_checkpoint_at: optionalString(formData.get("latest_checkpoint_at")),
          latest_status: optionalString(formData.get("latest_status")),
          logistics_fee: nonnegativeNumber(formData.get("logistics_fee")),
          source_workflow_order_number: optionalString(
            formData.get("source_workflow_order_number"),
          ),
          wholesale_order_id: optionalString(formData.get("wholesale_order_id")),
        });

        if (error) throw error;
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
    claim1688Order,
    createCustomer,
    createLogisticsOrder,
    createOrder,
    createReferral,
    delete1688Order,
    feedback,
    import1688Rows,
    linkCustomerAccount,
    markOrderSettled,
    pendingKey,
    settleCommission,
  };
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function requiredString(value: FormDataEntryValue | null) {
  const normalized = optionalString(value);

  if (!normalized) {
    throw new Error("required");
  }

  return normalized;
}

function nonnegativeNumber(value: FormDataEntryValue | null) {
  const parsed = Number(optionalString(value) ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function nonnegativeInteger(value: FormDataEntryValue | null) {
  return Math.trunc(nonnegativeNumber(value));
}

function splitList(value: FormDataEntryValue | null) {
  const raw = optionalString(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMonth(value: FormDataEntryValue | null) {
  const raw = optionalString(value);

  if (!raw) {
    return new Date().toISOString().slice(0, 7) + "-01";
  }

  return raw.length === 7 ? `${raw}-01` : raw;
}

function toWholesaleActionErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("exchange rate is not ready")) {
    return "这个币种的汇率还没有准备好，请先到系统设置的汇率设置中补充。";
  }

  if (
    normalized.includes("daily order counter exceeded") ||
    normalized.includes("duplicate key")
  ) {
    return "订单编号暂时没有生成成功，请稍后再试。";
  }

  if (
    normalized.includes("wholesale_order_sales_user_forbidden") ||
    normalized.includes("wholesale_customer_assignment_forbidden")
  ) {
    return "请选择可以承接批发业务的业务员。";
  }

  if (
    normalized.includes("wholesale_customer_link_target_not_referred") ||
    normalized.includes("wholesale_customer_link_user_not_available")
  ) {
    return "请选择已通过你的批发注册链接注册的客户账号。";
  }

  if (
    normalized.includes("_forbidden") ||
    normalized.includes("wholesale_customer_link_forbidden") ||
    normalized.includes("wholesale_order_forbidden") ||
    normalized.includes("permission denied")
  ) {
    return "当前账号没有保存这项内容的权限。";
  }

  if (normalized.includes("wholesale_order_not_found")) {
    return "没有找到这笔批发订单，请刷新后再试。";
  }

  if (normalized.includes("wholesale_order_settlement_locked")) {
    return "已结汇的订单不能直接改回未结汇。";
  }

  if (
    normalized.includes("wholesale_customer_link_already_linked") ||
    normalized.includes("wholesale_customer_link_user_already_linked")
  ) {
    return "这个客户或注册账号已经完成合并，不能重复合并。";
  }

  if (
    normalized.includes("wholesale_customer_link_user_not_found") ||
    normalized.includes("wholesale_customer_link_target_must_be_customer")
  ) {
    return "请选择客户本人注册的账号进行合并。";
  }

  if (normalized.includes("wholesale_customer_link_customer_not_found")) {
    return "没有找到这个批发客户，请刷新后再试。";
  }

  return "操作没有成功，请检查内容和权限后再试。";
}
