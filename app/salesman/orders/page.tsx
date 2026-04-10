import type { Metadata } from "next";

import { AdminOrdersClient } from "@/components/dashboard/admin-orders-client";

export const metadata: Metadata = {
  title: "客户订单",
};

export default function SalesmanOrdersPage() {
  return <AdminOrdersClient mode="salesman" />;
}
