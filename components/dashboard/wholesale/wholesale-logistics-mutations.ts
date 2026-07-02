import type { SupabaseClient } from "@supabase/supabase-js";

import {
  optionalString,
  requiredString,
} from "./wholesale-action-utils";

export async function createWholesaleLogisticsStatus(
  supabase: SupabaseClient,
  formData: FormData,
) {
  const trackingNumber = requiredString(formData.get("tracking_number"));
  const customerName = requiredString(formData.get("customer_name"));

  // 新增时只登记核对所需的最小资料；每日同步任务负责补齐后续物流状态。
  // next_check_at 设置为当前时间，表示这条物流号可以在下一次定时任务中立即核对。
  const { error } = await supabase.from("wholesale_logistics_statuses").insert({
    customer_id: optionalString(formData.get("customer_id")),
    customer_name: customerName,
    next_check_at: new Date().toISOString(),
    status_kind: "checking",
    status_text: "等待查询",
    tracking_number: trackingNumber,
    wholesale_order_id: optionalString(formData.get("wholesale_order_id")),
  });

  if (error) {
    throw error;
  }
}
