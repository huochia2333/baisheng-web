import type { AppRole } from "./auth-routing";
import type {
  Wholesale1688Order,
  WholesaleCommission,
  WholesaleCustomer,
  WholesaleLogisticsOrder,
  WholesaleOrderChangeLog,
  WholesaleOrderEditRequest,
  WholesaleOrder,
  WholesaleProfile,
  WholesaleReferral,
} from "./wholesale";
import type { WholesaleLogisticsStatus } from "./wholesale-logistics-statuses";

type ScopeWholesaleRowsInput = {
  commissions: WholesaleCommission[];
  currentRole: AppRole | null;
  currentUserId: string | null;
  customers: WholesaleCustomer[];
  logisticsOrders: WholesaleLogisticsOrder[];
  logisticsStatuses: WholesaleLogisticsStatus[];
  orderChangeLogs: WholesaleOrderChangeLog[];
  orderEditRequests: WholesaleOrderEditRequest[];
  orders: WholesaleOrder[];
  profiles: WholesaleProfile[];
  purchaseOrders: Wholesale1688Order[];
  referrals: WholesaleReferral[];
  registeredCandidates: WholesaleProfile[];
};

export function scopeWholesaleRows({
  commissions,
  currentRole,
  currentUserId,
  customers,
  logisticsOrders,
  logisticsStatuses,
  orderChangeLogs,
  orderEditRequests,
  orders,
  profiles,
  purchaseOrders,
  referrals,
  registeredCandidates,
}: ScopeWholesaleRowsInput) {
  const scopedCustomers = scopeWholesaleCustomers({
    currentRole,
    currentUserId,
    customers,
  });
  const customerIds = new Set(scopedCustomers.map((customer) => customer.id));
  const scopedOrders = scopeWholesaleOrders({
    currentRole,
    currentUserId,
    customerIds,
    orders,
  });
  const orderIds = new Set(scopedOrders.map((order) => order.id));
  const scopedPurchaseOrders = scopeWholesalePurchaseOrders({
    currentRole,
    currentUserId,
    customerIds,
    orderIds,
    purchaseOrders,
  });
  const scopedLogisticsOrders = scopeWholesaleLogisticsOrders({
    currentRole,
    currentUserId,
    customerIds,
    logisticsOrders,
    orderIds,
  });
  const scopedLogisticsStatuses = scopeWholesaleLogisticsStatuses({
    currentRole,
    currentUserId,
    customerIds,
    logisticsStatuses,
    orderIds,
  });
  const scopedCommissions = scopeWholesaleCommissions({
    currentRole,
    currentUserId,
    commissions,
    customerIds,
    orderIds,
  });
  const scopedReferrals = scopeWholesaleReferrals({
    currentRole,
    currentUserId,
    customerIds,
    referrals,
  });
  const scopedOrderEditRequests = scopeWholesaleOrderEditRequests({
    currentRole,
    currentUserId,
    orderEditRequests,
    orderIds,
  });
  const scopedOrderChangeLogs = scopeWholesaleOrderChangeLogs({
    currentRole,
    currentUserId,
    orderChangeLogs,
    orderIds,
  });
  const scopedProfiles = scopeWholesaleProfiles({
    currentRole,
    currentUserId,
    customers: scopedCustomers,
    logisticsOrders: scopedLogisticsOrders,
    logisticsStatuses: scopedLogisticsStatuses,
    orderChangeLogs: scopedOrderChangeLogs,
    orderEditRequests: scopedOrderEditRequests,
    orders: scopedOrders,
    profiles,
    purchaseOrders: scopedPurchaseOrders,
    registeredCandidates,
  });

  return {
    commissions: scopedCommissions,
    customers: scopedCustomers,
    logisticsOrders: scopedLogisticsOrders,
    logisticsStatuses: scopedLogisticsStatuses,
    orderChangeLogs: scopedOrderChangeLogs,
    orderEditRequests: scopedOrderEditRequests,
    orders: scopedOrders,
    profiles: scopedProfiles,
    purchaseOrders: scopedPurchaseOrders,
    referrals: scopedReferrals,
  };
}

function scopeWholesaleLogisticsStatuses({
  currentRole,
  currentUserId,
  customerIds,
  logisticsStatuses,
  orderIds,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customerIds: Set<string>;
  logisticsStatuses: WholesaleLogisticsStatus[];
  orderIds: Set<string>;
}) {
  if (
    currentRole === "administrator" ||
    currentRole === "finance" ||
    currentRole === "salesman"
  ) {
    return logisticsStatuses;
  }

  if (!currentUserId) {
    return [];
  }

  return logisticsStatuses.filter(
    (status) =>
      (status.customer_id ? customerIds.has(status.customer_id) : false) ||
      (status.wholesale_order_id ? orderIds.has(status.wholesale_order_id) : false) ||
      status.created_by_user_id === currentUserId,
  );
}

function scopeWholesaleCustomers({
  currentRole,
  currentUserId,
  customers,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customers: WholesaleCustomer[];
}) {
  if (canReadFullWholesaleDirectory(currentRole)) {
    return customers;
  }

  if (!currentUserId) {
    return [];
  }

  return customers.filter((customer) => {
    if (canUseWholesaleSalesScope(currentRole)) {
      return (
        customer.assigned_sales_user_id === currentUserId ||
        customer.created_by_user_id === currentUserId
      );
    }

    if (currentRole === "client") {
      return customer.registered_user_id === currentUserId;
    }

    return false;
  });
}

function scopeWholesaleOrders({
  currentRole,
  currentUserId,
  customerIds,
  orders,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customerIds: Set<string>;
  orders: WholesaleOrder[];
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return orders;
  }

  if (!currentUserId) {
    return [];
  }

  return orders.filter(
    (order) =>
      customerIds.has(order.customer_id) ||
      order.sales_user_id === currentUserId ||
      order.created_by_user_id === currentUserId,
  );
}

function scopeWholesalePurchaseOrders({
  currentRole,
  currentUserId,
  customerIds,
  orderIds,
  purchaseOrders,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customerIds: Set<string>;
  orderIds: Set<string>;
  purchaseOrders: Wholesale1688Order[];
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return purchaseOrders;
  }

  if (!currentUserId) {
    return [];
  }

  return purchaseOrders.filter((order) => {
    const isUnclaimedHallOrder = !order.customer_id && !order.wholesale_order_id;

    return (
      (order.customer_id ? customerIds.has(order.customer_id) : false) ||
      (order.wholesale_order_id ? orderIds.has(order.wholesale_order_id) : false) ||
      order.claimed_by_user_id === currentUserId ||
      order.imported_by_user_id === currentUserId ||
      (canUseWholesaleSalesScope(currentRole) && isUnclaimedHallOrder)
    );
  });
}

function scopeWholesaleLogisticsOrders({
  currentRole,
  currentUserId,
  customerIds,
  logisticsOrders,
  orderIds,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customerIds: Set<string>;
  logisticsOrders: WholesaleLogisticsOrder[];
  orderIds: Set<string>;
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return logisticsOrders;
  }

  if (!currentUserId) {
    return [];
  }

  return logisticsOrders.filter(
    (order) =>
      (order.customer_id ? customerIds.has(order.customer_id) : false) ||
      (order.wholesale_order_id ? orderIds.has(order.wholesale_order_id) : false) ||
      order.created_by_user_id === currentUserId,
  );
}

function scopeWholesaleCommissions({
  currentRole,
  currentUserId,
  commissions,
  customerIds,
  orderIds,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  commissions: WholesaleCommission[];
  customerIds: Set<string>;
  orderIds: Set<string>;
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return commissions;
  }

  if (!currentUserId) {
    return [];
  }

  return commissions.filter(
    (commission) =>
      (commission.customer_id ? customerIds.has(commission.customer_id) : false) ||
      orderIds.has(commission.order_id) ||
      commission.beneficiary_user_id === currentUserId ||
      commission.settled_by_user_id === currentUserId,
  );
}

function scopeWholesaleReferrals({
  currentRole,
  currentUserId,
  customerIds,
  referrals,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customerIds: Set<string>;
  referrals: WholesaleReferral[];
}) {
  if (canReadFullWholesaleDirectory(currentRole)) {
    return referrals;
  }

  if (!currentUserId) {
    return [];
  }

  return referrals.filter(
    (referral) =>
      referral.created_by_user_id === currentUserId ||
      (customerIds.has(referral.referrer_customer_id) &&
        customerIds.has(referral.referred_customer_id)),
  );
}

function scopeWholesaleOrderEditRequests({
  currentRole,
  currentUserId,
  orderEditRequests,
  orderIds,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  orderEditRequests: WholesaleOrderEditRequest[];
  orderIds: Set<string>;
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return orderEditRequests;
  }

  if (!currentUserId) {
    return [];
  }

  return orderEditRequests.filter(
    (request) =>
      orderIds.has(request.order_id) ||
      request.requested_by_user_id === currentUserId ||
      request.reviewer_user_id === currentUserId,
  );
}

function scopeWholesaleOrderChangeLogs({
  currentRole,
  currentUserId,
  orderChangeLogs,
  orderIds,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  orderChangeLogs: WholesaleOrderChangeLog[];
  orderIds: Set<string>;
}) {
  if (canReadFullWholesaleBackoffice(currentRole)) {
    return orderChangeLogs;
  }

  if (!currentUserId) {
    return [];
  }

  return orderChangeLogs.filter(
    (log) =>
      orderIds.has(log.order_id) ||
      log.actor_user_id === currentUserId,
  );
}

function scopeWholesaleProfiles({
  currentRole,
  currentUserId,
  customers,
  logisticsOrders,
  logisticsStatuses,
  orderChangeLogs,
  orderEditRequests,
  orders,
  profiles,
  purchaseOrders,
  registeredCandidates,
}: {
  currentRole: AppRole | null;
  currentUserId: string | null;
  customers: WholesaleCustomer[];
  logisticsOrders: WholesaleLogisticsOrder[];
  logisticsStatuses: WholesaleLogisticsStatus[];
  orderChangeLogs: WholesaleOrderChangeLog[];
  orderEditRequests: WholesaleOrderEditRequest[];
  orders: WholesaleOrder[];
  profiles: WholesaleProfile[];
  purchaseOrders: Wholesale1688Order[];
  registeredCandidates: WholesaleProfile[];
}) {
  if (canReadFullWholesaleDirectory(currentRole)) {
    return profiles;
  }

  const visibleProfileIds = new Set<string>();

  addOptionalId(visibleProfileIds, currentUserId);

  for (const customer of customers) {
    addOptionalId(visibleProfileIds, customer.assigned_sales_user_id);
    addOptionalId(visibleProfileIds, customer.created_by_user_id);
    addOptionalId(visibleProfileIds, customer.registered_user_id);
  }

  for (const order of orders) {
    addOptionalId(visibleProfileIds, order.sales_user_id);
    addOptionalId(visibleProfileIds, order.created_by_user_id);
  }

  for (const order of purchaseOrders) {
    addOptionalId(visibleProfileIds, order.claimed_by_user_id);
    addOptionalId(visibleProfileIds, order.imported_by_user_id);
  }

  for (const order of logisticsOrders) {
    addOptionalId(visibleProfileIds, order.created_by_user_id);
  }

  for (const status of logisticsStatuses) {
    addOptionalId(visibleProfileIds, status.created_by_user_id);
  }

  for (const request of orderEditRequests) {
    addOptionalId(visibleProfileIds, request.requested_by_user_id);
    addOptionalId(visibleProfileIds, request.reviewer_user_id);
  }

  for (const log of orderChangeLogs) {
    addOptionalId(visibleProfileIds, log.actor_user_id);
  }

  for (const profile of registeredCandidates) {
    addOptionalId(visibleProfileIds, profile.user_id);
  }

  return profiles.filter((profile) => visibleProfileIds.has(profile.user_id));
}

function addOptionalId(ids: Set<string>, value: string | null | undefined) {
  if (value) {
    ids.add(value);
  }
}

function canReadFullWholesaleDirectory(role: AppRole | null) {
  return (
    role === "administrator" ||
    role === "manager" ||
    role === "operator" ||
    role === "recruiter"
  );
}

function canReadFullWholesaleBackoffice(role: AppRole | null) {
  return (
    role === "administrator" ||
    role === "manager" ||
    role === "operator"
  );
}

function canUseWholesaleSalesScope(role: AppRole | null) {
  return role === "salesman" || role === "finance";
}
