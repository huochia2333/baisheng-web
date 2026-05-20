import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { type ServiceFeeTypeOption } from "@/lib/service-fee-types";

import {
  formatDiscountRatioValue,
  formatMoneyValue,
  parseNumericValue,
} from "./admin-orders-display";

export type OrderServiceFeePreviewState = {
  feeType: ServiceFeeTypeOption | null;
  status: "idle" | "loading" | "ready" | "error";
};

export function OrderServiceFeePreview({
  preview,
  rmbAmount,
}: {
  preview: OrderServiceFeePreviewState;
  rmbAmount: string;
}) {
  const t = useTranslations("OrdersUI.serviceFeePreview");
  const feeRatio = parseNumericValue(preview.feeType?.fee_ratio);
  const parsedRmbAmount = parseNumericValue(rmbAmount);
  const serviceFeeAmount =
    feeRatio === null || parsedRmbAmount === null
      ? null
      : Math.round((parsedRmbAmount * feeRatio + Number.EPSILON) * 100) / 100;
  const feeType = preview.status === "ready" ? preview.feeType : null;
  const isReady = feeType !== null;
  const helperText =
    preview.status === "error"
      ? t("unavailable")
      : preview.status === "idle"
        ? t("waiting")
        : t("finalHint");

  return (
    <OrderServiceFeeSummaryCard
      amount={isReady ? serviceFeeAmount : null}
      description={helperText}
      loading={preview.status === "loading"}
      rate={isReady ? feeType.fee_ratio : null}
      tier={isReady ? feeType.display_name : null}
      title={t("title")}
    />
  );
}

export function OrderServiceFeeSummaryCard({
  amount,
  className = "",
  description,
  loading = false,
  rate,
  tier,
  title,
}: {
  amount: number | string | null | undefined;
  className?: string;
  description: string;
  loading?: boolean;
  rate: number | string | null | undefined;
  tier: string | null | undefined;
  title: string;
}) {
  const t = useTranslations("OrdersUI.serviceFeePreview");
  const classNames = [
    "rounded-[22px] border border-[#ebe7e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#26343d]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#6f7d75]">{description}</p>
        </div>
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e2db] bg-white px-3 py-1 text-xs text-[#5f6f66]">
            <LoaderCircle className="size-3.5 animate-spin" />
            {t("loading")}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PreviewMetric
          label={t("tier")}
          value={tier || "-"}
        />
        <PreviewMetric
          label={t("rate")}
          value={rate !== null && rate !== undefined ? formatDiscountRatioValue(rate) : "-"}
        />
        <PreviewMetric
          label={t("amount")}
          value={amount !== null && amount !== undefined ? formatMoneyValue(amount) : "-"}
        />
      </div>
    </section>
  );
}

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#ebe7e1] bg-[#fbfaf8] px-4 py-3">
      <p className="text-xs text-[#7b8790]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#26343d]">{value}</p>
    </div>
  );
}
