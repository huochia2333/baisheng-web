import type { Metadata } from "next";

import { AdminOrdersClient } from "@/components/dashboard/admin-orders-client";

export const metadata: Metadata = {
  title: "我的订单",
};

export default function ClientOrdersPage() {
  return <AdminOrdersClient mode="client" />;
}
