"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { LoaderCircle, PencilLine, Trash2 } from "lucide-react";

import {
  getAdminOrderSupplementaryDetail,
  type AdminOrderRow,
  type AdminOrderSupplementaryDetail,
  type BusinessCategoryOption,
  type OrderDiscountTypeOption,
  type OrderUserOption,
  type PurchaseOrderTypeOption,
  type ServiceOrderTypeOption,
} from "@/lib/admin-orders";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import {
  PageBanner,
  formatDateTime,
  normalizeOptionalString,
  type NoticeTone,
} from "../dashboard-shared-ui";
import { DashboardDialog } from "../dashboard-dialog";
import { Button } from "../../ui/button";
import {
  flattenOrderDetailItems,
  formatCurrencyCode,
  formatDiscountRatioValue,
  formatMoneyValue,
  formatPurchaseOrderSubtype,
  formatRateValue,
  formatServiceOrderSubtype,
  getOrderTypeMetaFromCategory,
  getOrderUserOptionLabel,
  getStatusLabel,
  resolveOrderTypeMeta,
  resolveOrderUserLabel,
  toOrderErrorMessage,
  type OrderFormState,
} from "./admin-orders-utils";

type PageFeedback = { tone: NoticeTone; message: string } | null;

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "待处理" },
  { value: "in_progress", label: "处理中" },
  { value: "settled", label: "已结算" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
  { value: "refunding", label: "退款中" },
] as const;

function OrdersLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载订单列表...
      </div>
    </div>
  );
}

function OrderSummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" && "border-[#d9e3eb] bg-[#f4f8fb]",
        accent === "green" && "border-[#dce8df] bg-[#f2f7f3]",
        accent === "gold" && "border-[#eadfbf] bg-[#fbf5e8]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" && "bg-[#486782]",
            accent === "green" && "bg-[#4c7259]",
            accent === "gold" && "bg-[#b7892f]",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">{label}</span>
      {children}
    </label>
  );
}

function OrderFormDialog({
  mode,
  title,
  description,
  submitLabel,
  showCostField,
  feedback,
  open,
  pending,
  formState,
  orderDiscountOptions,
  orderTypeOptions,
  orderUserOptions,
  purchaseOrderTypeOptions,
  serviceOrderTypeOptions,
  supplementaryLoading = false,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  showCostField: boolean;
  feedback?: PageFeedback;
  open: boolean;
  pending: boolean;
  formState: OrderFormState;
  orderDiscountOptions: OrderDiscountTypeOption[];
  orderTypeOptions: BusinessCategoryOption[];
  orderUserOptions: OrderUserOption[];
  purchaseOrderTypeOptions: PurchaseOrderTypeOption[];
  serviceOrderTypeOptions: ServiceOrderTypeOption[];
  supplementaryLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldChange: <Key extends keyof OrderFormState>(
    key: Key,
    value: OrderFormState[Key],
  ) => void;
  onSubmit: () => void;
}) {
  const selectedOrderCategory = useMemo(() => {
    return (
      orderTypeOptions.find((option) => option.id === formState.orderType)?.category ?? null
    );
  }, [formState.orderType, orderTypeOptions]);
  const isFormBusy = pending || supplementaryLoading;

  return (
    <DashboardDialog
      actions={
        <>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              取消
            </Button>
            <Button
              className="bg-[#486782] text-white hover:bg-[#3e5f79]"
              disabled={isFormBusy}
              onClick={onSubmit}
              type="button"
            >
              {isFormBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <PencilLine className="size-4" />
            )}
            {submitLabel}
          </Button>
        </>
      }
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
        <OrderField label="原始货币" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
            placeholder="例如 USD、CNY、EUR"
            type="text"
            value={formState.originalCurrency}
          />
        </OrderField>

        <OrderField label="金额总计" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("amount", event.target.value)}
            placeholder="请输入金额总计"
            step="0.01"
            type="number"
            value={formState.amount}
          />
        </OrderField>

        <OrderField label="当日汇率" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("dailyExchangeRate", event.target.value)}
            placeholder="请输入当日汇率"
            step="0.0001"
            type="number"
            value={formState.dailyExchangeRate}
          />
        </OrderField>

        <OrderField label="公司成交汇率" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("transactionRate", event.target.value)}
            placeholder="请输入公司成交汇率"
            step="0.0001"
            type="number"
            value={formState.transactionRate}
          />
        </OrderField>

        <OrderField label="人民币总计" required>
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
            min="0"
            onChange={(event) => onFieldChange("rmbAmount", event.target.value)}
            placeholder="请输入人民币总计"
            step="0.01"
            type="number"
            value={formState.rmbAmount}
          />
        </OrderField>

        {showCostField ? (
          <OrderField label="订单成本">
            <input
              className={fieldInputClassName}
              disabled={isFormBusy}
              min="0"
              onChange={(event) => onFieldChange("costAmount", event.target.value)}
              placeholder="请输入内部成本，留空则不记录"
              step="0.01"
              type="number"
              value={formState.costAmount}
            />
          </OrderField>
        ) : null}

        <OrderField label="订单录入员" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy || mode === "edit"}
            onChange={(event) => onFieldChange("orderEntryUser", event.target.value)}
            value={formState.orderEntryUser}
          >
            <option value="">请选择订单录入员</option>
            {orderUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单客户" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderingUser", event.target.value)}
            value={formState.orderingUser}
          >
            <option value="">请选择订单客户</option>
            {orderUserOptions.map((option) => (
              <option key={option.user_id} value={option.user_id}>
                {getOrderUserOptionLabel(option)}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单状态" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderStatus", event.target.value)}
            value={formState.orderStatus}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </OrderField>

        <OrderField label="订单类型" required>
          <select
            className={fieldInputClassName}
            disabled={isFormBusy}
            onChange={(event) => onFieldChange("orderType", event.target.value)}
            value={formState.orderType}
          >
            <option value="">请选择订单类型</option>
            {orderTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {getOrderTypeMetaFromCategory(option.category).label}
              </option>
            ))}
          </select>
        </OrderField>

        <div className="rounded-[20px] border border-[#e6ebe6] bg-[#f6faf7] px-4 py-3 text-sm leading-7 text-[#4f6757] md:col-span-2">
          创建订单后，系统会自动写入创建时间；编辑订单保存后，系统会自动更新最后一次改动时间。
        </div>

        {selectedOrderCategory === "purchase" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? "当前订单类型为采购订单，请继续填写采购子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
                  : "当前订单类型为采购订单，可直接修改采购子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
              }
              title="采购订单信息"
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  正在加载采购订单信息...
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label="采购小类" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("purchaseSubtype", event.target.value)}
                    value={formState.purchaseSubtype}
                  >
                    <option value="">请选择采购小类</option>
                    {purchaseOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatPurchaseOrderSubtype(option.business_subcategory)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label="采购订单明细">
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("purchaseDetails", event.target.value)}
                  placeholder={'可填写 JSON，或按行输入，例如：\n商品名称: iPhone 16 Pro\n数量: 2\n收货城市: 上海'}
                  rows={6}
                  value={formState.purchaseDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}

        {selectedOrderCategory === "service" ? (
          <div className="md:col-span-2">
            <OrderSupplementaryFormSection
              description={
                mode === "create"
                  ? "当前订单类型为服务订单，请继续填写服务子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
                  : "当前订单类型为服务订单，可直接修改服务子表信息。订单明细支持 JSON，也支持每行一个“字段: 内容”。"
              }
              title="服务订单信息"
            >
              {supplementaryLoading ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#ebe7e1] bg-white px-4 py-3 text-sm text-[#60707d]">
                  <LoaderCircle className="size-4 animate-spin" />
                  正在加载服务订单信息...
                </div>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                <OrderField label="服务小类" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceSubtype", event.target.value)}
                    value={formState.serviceSubtype}
                  >
                    <option value="">请选择服务小类</option>
                    {serviceOrderTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatServiceOrderSubtype(option.business_subcategory)}
                      </option>
                    ))}
                  </select>
                </OrderField>

                <OrderField label="订单折扣" required>
                  <select
                    className={fieldInputClassName}
                    disabled={isFormBusy}
                    onChange={(event) => onFieldChange("serviceDiscount", event.target.value)}
                    value={formState.serviceDiscount}
                  >
                    <option value="">请选择订单折扣</option>
                    {orderDiscountOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {formatDiscountRatioValue(option.discount_ratio)}
                      </option>
                    ))}
                  </select>
                </OrderField>
              </div>

              <OrderField label="服务订单明细">
                <textarea
                  className={fieldTextareaClassName}
                  disabled={isFormBusy}
                  onChange={(event) => onFieldChange("serviceDetails", event.target.value)}
                  placeholder={'可填写 JSON，或按行输入，例如：\n服务日期: 2026-04-02\n服务地点: 上海浦东机场\n接待人数: 3'}
                  rows={6}
                  value={formState.serviceDetails}
                />
              </OrderField>
            </OrderSupplementaryFormSection>
          </div>
        ) : null}
        </div>
      </div>
    </DashboardDialog>
  );
}

function OrderDetailsDialog({
  canDelete,
  canEdit,
  canViewCost,
  order,
  userLabelById,
  orderTypeMetaById,
  supabase,
  onEdit,
  onDelete,
  deletePending,
  onOpenChange,
}: {
  canDelete: boolean;
  canEdit: boolean;
  canViewCost: boolean;
  order: AdminOrderRow | null;
  userLabelById: Map<string, string>;
  orderTypeMetaById: Map<string, ReturnType<typeof getOrderTypeMetaFromCategory>>;
  supabase: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>;
  onEdit: (order: AdminOrderRow) => void;
  onDelete: () => void;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const typeMeta = resolveOrderTypeMeta(order?.order_type ?? null, orderTypeMetaById);
  const orderNumber = order?.order_number ?? null;
  const [supplementaryState, setSupplementaryState] = useState<{
    orderNumber: string | null;
    detail: AdminOrderSupplementaryDetail | null;
    error: string | null;
  }>({
    orderNumber: null,
    detail: null,
    error: null,
  });

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let isActive = true;

    void getAdminOrderSupplementaryDetail(supabase, orderNumber)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail,
          error: null,
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setSupplementaryState({
          orderNumber,
          detail: null,
          error: toOrderErrorMessage(error),
        });
      });

    return () => {
      isActive = false;
    };
  }, [orderNumber, supabase]);

  const supplementaryLoading =
    orderNumber !== null && supplementaryState.orderNumber !== orderNumber;
  const supplementaryDetail =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.detail : null;
  const supplementaryError =
    supplementaryState.orderNumber === orderNumber ? supplementaryState.error : null;

  return (
    <DashboardDialog
      actions={
        order ? (
          <>
            {canEdit ? <Button onClick={() => onEdit(order)} type="button" variant="outline">
              <PencilLine className="size-4" />
              编辑订单
            </Button> : null}
            {canDelete ? (
              <Button
              className="border-[#efd6d6] bg-white text-[#b13d3d] hover:bg-[#fff4f4]"
              disabled={deletePending}
              onClick={onDelete}
              type="button"
              variant="outline"
            >
              {deletePending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              删除订单
              </Button>
            ) : null}
          </>
        ) : null
      }
      description={order ? "查看订单的完整金额、汇率、人员信息以及关联表单内容。" : undefined}
      onOpenChange={onOpenChange}
      open={order !== null}
      title={order ? `订单 ${order.order_number}` : "订单详情"}
    >
      {order ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <OrderDetailCard label="订单编号" value={order.order_number} />
            <OrderDetailCard label="订单状态" value={getStatusLabel(order.order_status)} />
            <OrderDetailCard label="订单类型" value={typeMeta.label} />
            <OrderDetailCard label="原始货币" value={formatCurrencyCode(order.original_currency)} />
            <OrderDetailCard label="金额总计" value={formatMoneyValue(order.amount)} />
            <OrderDetailCard label="人民币总计" value={formatMoneyValue(order.rmb_amount)} />
            {canViewCost ? (
              <OrderDetailCard label="订单成本" value={formatMoneyValue(order.cost_amount)} />
            ) : null}
            <OrderDetailCard label="当日汇率" value={formatRateValue(order.daily_exchange_rate)} />
            <OrderDetailCard
              label="公司成交汇率"
              value={formatRateValue(order.transaction_rate)}
            />
            <OrderDetailCard
              label="订单录入员"
              value={resolveOrderUserLabel(order.order_entry_user, userLabelById)}
            />
            <OrderDetailCard
              label="订单客户"
              value={resolveOrderUserLabel(order.ordering_user, userLabelById)}
            />
            <OrderDetailCard label="创建日期" value={formatDateTime(order.created_at)} />
            <OrderDetailCard
              label="最后一次改动日期"
              value={formatDateTime(order.reviewed_at)}
            />
          </div>

          <OrderSupplementaryDetailsSection
            detail={supplementaryDetail}
            error={supplementaryError}
            loading={supplementaryLoading}
          />
        </div>
      ) : null}
    </DashboardDialog>
  );
}

function OrderSupplementaryDetailsSection({
  detail,
  loading,
  error,
}: {
  detail: AdminOrderSupplementaryDetail | null;
  loading: boolean;
  error: string | null;
}) {
  const detailItems = useMemo(
    () => (detail ? flattenOrderDetailItems(detail.details) : []),
    [detail],
  );

  if (loading) {
    return (
      <div className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
        <div className="flex items-center gap-3 text-sm text-[#60707d]">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载关联表单内容...
        </div>
      </div>
    );
  }

  if (error) {
    return <PageBanner tone="error">{error}</PageBanner>;
  }

  if (!detail) {
    return <PageBanner tone="info">当前订单还没有对应的采购单或服务单表单内容。</PageBanner>;
  }

  const formTitle = detail.kind === "purchase" ? "采购订单表单" : "服务订单表单";
  const subtypeLabel = detail.kind === "purchase" ? "采购小类" : "服务小类";
  const subtypeValue =
    detail.kind === "purchase"
      ? formatPurchaseOrderSubtype(detail.subtype)
      : formatServiceOrderSubtype(detail.subtype);

  return (
    <section className="rounded-[28px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)] sm:p-6">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-[#23313a]">{formTitle}</h3>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <OrderDetailCard label="来源表单" value={formTitle} />
        <OrderDetailCard label={subtypeLabel} value={subtypeValue} />
        {detail.kind === "service" ? (
          <OrderDetailCard
            label="订单折扣"
            value={formatDiscountRatioValue(detail.discountRatio)}
          />
        ) : null}

        {detailItems.length > 0 ? (
          detailItems.map((item, index) => (
            <OrderDetailCard
              key={`${item.label}-${index}`}
              label={item.label}
              multiline
              value={item.value}
            />
          ))
        ) : (
          <div className="md:col-span-2">
            <PageBanner tone="info">当前关联表单还没有填写更多明细内容。</PageBanner>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#31424d]">
        <span>{label}</span>
        {required ? <span className="text-[#b13d3d]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function OrderSupplementaryFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ebe7e1] bg-[#f9f7f4] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#23313a]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#66717a]">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function OrderDetailCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#ebe7e1] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm leading-7 text-[#2b3942]",
          multiline ? "whitespace-pre-wrap break-words" : "truncate",
        )}
        title={multiline ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function OrderHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
      {children}
    </th>
  );
}

function OrderValueCell({
  value,
  strong,
}: {
  value: ReactNode;
  strong?: boolean;
}) {
  const title = typeof value === "string" ? value : undefined;

  return (
    <td
      className={cn(
        "max-w-[220px] px-5 py-4 text-sm text-[#2b3942]",
        strong ? "font-semibold text-[#223038]" : "font-medium",
      )}
      title={title}
    >
      <div className="truncate">{value}</div>
    </td>
  );
}

function OrderStatusChip({ status }: { status: string | null }) {
  const normalizedStatus = normalizeOptionalString(status);

  if (!normalizedStatus) {
    return <StatusTag tone="default">待补充</StatusTag>;
  }

  const matchedStatus = ORDER_STATUS_OPTIONS.find((option) => option.value === normalizedStatus);

  if (!matchedStatus) {
    return <StatusTag tone="default">{normalizedStatus}</StatusTag>;
  }

  return (
    <StatusTag
      tone={
        normalizedStatus === "pending"
          ? "gold"
          : normalizedStatus === "completed"
            ? "green"
            : normalizedStatus === "cancelled" || normalizedStatus === "refunding"
              ? "red"
              : "blue"
      }
    >
      {matchedStatus.label}
    </StatusTag>
  );
}

function OrderTypeChip({
  meta,
}: {
  meta: ReturnType<typeof getOrderTypeMetaFromCategory>;
}) {
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
}

function StatusTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "default" | "gold" | "green" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "blue" && "bg-[#eef3f7] text-[#486782]",
        tone === "default" && "bg-[#f0efec] text-[#6d787f]",
        tone === "gold" && "bg-[#fff5db] text-[#9a6a07]",
        tone === "green" && "bg-[#e8f4ec] text-[#4c7259]",
        tone === "red" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {children}
    </span>
  );
}

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const fieldTextareaClassName =
  "w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 py-3 text-[15px] leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";

const filterInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-white px-4 text-[15px] text-[#23313a] outline-none transition placeholder:text-[#98a2aa] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export {
  FilterField,
  OrderDetailsDialog,
  OrderFormDialog,
  OrderHeaderCell,
  OrdersLoadingState,
  OrderStatusChip,
  OrderSummaryCard,
  OrderTypeChip,
  OrderValueCell,
  filterInputClassName,
};
