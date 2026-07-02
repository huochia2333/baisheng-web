import type { SupabaseClient } from "@supabase/supabase-js";

export type WholesaleLogisticsStatusKind =
  | "checking"
  | "delivered"
  | "exception"
  | "stopped";

export type WholesaleLogisticsStatus = {
  id: string;
  tracking_number: string;
  customer_name: string;
  customer_id: string | null;
  wholesale_order_id: string | null;
  status_text: string;
  status_kind: WholesaleLogisticsStatusKind;
  is_terminal: boolean;
  last_checked_at: string | null;
  next_check_at: string;
  source_updated_at: string | null;
  last_error: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WholesaleLogisticsStatusQueryResult = {
  data: WholesaleLogisticsStatus[] | null;
  error: { message: string } | null;
};

export function getWholesaleLogisticsStatuses(supabase: SupabaseClient) {
  // 物流状态镜像表是物流页、订单搜索和佣金统计共同使用的数据源。
  // 这里统一按待处理优先、更新时间倒序读取，页面不再各自拼查询条件。
  return supabase
    .from("wholesale_logistics_statuses")
    .select("*")
    .order("is_terminal", { ascending: true })
    .order("updated_at", { ascending: false }) as unknown as Promise<
    WholesaleLogisticsStatusQueryResult
  >;
}
