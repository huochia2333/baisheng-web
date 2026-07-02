export function getWholesaleOrderRpcPayload(formData: FormData) {
  // Keep every order-writing RPC on the same parsed shape so calculations and
  // audit logs always describe the fields the user actually edited.
  return {
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
  };
}

export function getWholesaleOrderIds(formData: FormData) {
  return formData
    .getAll("order_id")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function requiredString(value: FormDataEntryValue | null) {
  const normalized = optionalString(value);

  if (!normalized) {
    throw new Error("required");
  }

  return normalized;
}

export function nonnegativeNumber(value: FormDataEntryValue | null) {
  const parsed = Number(optionalString(value) ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function optionalPositiveNumber(value: FormDataEntryValue | null) {
  const raw = optionalString(value);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function positiveNumber(value: FormDataEntryValue | null) {
  const parsed = optionalPositiveNumber(value);

  if (parsed === null) {
    throw new Error("invalid exchange rate");
  }

  return parsed;
}

export function splitList(value: FormDataEntryValue | null) {
  const raw = optionalString(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toWholesaleActionErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("wholesale_order_settlement_rate_required")) {
    return "今天还没有这个币种的每日汇率，请填写这笔订单实际使用的结汇汇率。";
  }

  if (normalized.includes("wholesale_order_exchange_rate_invalid")) {
    return "请填写大于 0 的结汇汇率。";
  }

  if (normalized.includes("wholesale_order_exchange_rate_unsettled")) {
    return "未结汇订单还没有可修改的结汇汇率。";
  }

  if (normalized.includes("wholesale_order_exchange_rate_empty_selection")) {
    return "请先选择需要修改汇率的订单。";
  }

  if (normalized.includes("exchange rate is not ready")) {
    return "这个币种的汇率还没有准备好，请先到汇率设置中补充。";
  }

  if (normalized.includes("wholesale_logistics_statuses_tracking_unique_idx")) {
    return "这个物流号已经在核对列表里。";
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

  if (normalized.includes("wholesale_order_edit_window_expired")) {
    return "这笔订单已超过可直接修改天数，请提交修改申请。";
  }

  if (normalized.includes("wholesale_order_edit_window_available")) {
    return "这笔订单还可以直接修改，不需要提交申请。";
  }

  if (normalized.includes("wholesale_order_edit_request_processed")) {
    return "这条修改申请已经处理过，请刷新后查看最新状态。";
  }

  if (normalized.includes("wholesale_order_edit_request_not_found")) {
    return "没有找到这条修改申请，请刷新后再试。";
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

function nonnegativeInteger(value: FormDataEntryValue | null) {
  return Math.trunc(nonnegativeNumber(value));
}

function normalizeMonth(value: FormDataEntryValue | null) {
  const raw = optionalString(value);

  if (!raw) {
    return new Date().toISOString().slice(0, 7) + "-01";
  }

  return raw.length === 7 ? `${raw}-01` : raw;
}
