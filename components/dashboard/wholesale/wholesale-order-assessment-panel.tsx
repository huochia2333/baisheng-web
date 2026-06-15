"use client";

import { LoaderCircle, Sparkles } from "lucide-react";

import { DashboardSectionPanel } from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";

import {
  useWholesaleOrderAssessment,
  type WholesaleOrderAssessmentFilters,
} from "./use-wholesale-order-assessment";

type WholesaleOrderAssessmentPanelProps = {
  filters: WholesaleOrderAssessmentFilters;
  matchedOrderCount: number;
};

export function WholesaleOrderAssessmentPanel({
  filters,
  matchedOrderCount,
}: WholesaleOrderAssessmentPanelProps) {
  const {
    assessment,
    errorMessage,
    generateAssessment,
    hasStaleAssessment,
    pending,
  } = useWholesaleOrderAssessment(filters);

  return (
    <DashboardSectionPanel className="border-[#dfe8ee] bg-[#f8fbfd]/86 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#486782]">
            <Sparkles className="size-4" />
            AI订单评估
          </div>
          <p className="mt-2 break-words text-sm leading-6 text-[#6f7b85]">
            根据当前筛选出的 {matchedOrderCount} 笔订单，生成金额、状态、毛利和风险点概览。
          </p>
        </div>
        <Button
          className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79] disabled:opacity-60"
          disabled={pending || matchedOrderCount === 0}
          onClick={() => void generateAssessment()}
          type="button"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {pending ? "正在评估" : "生成当前范围评估"}
        </Button>
      </div>

      {matchedOrderCount === 0 ? (
        <p className="mt-4 rounded-[16px] bg-white/72 px-4 py-3 text-sm leading-6 text-[#7a8791]">
          当前筛选条件下没有订单，调整日期或筛选条件后再生成评估。
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-[16px] border border-[#f3d2d2] bg-[#fff6f6] px-4 py-3 text-sm leading-6 text-[#a64b4b]">
          {errorMessage}
        </p>
      ) : null}

      {assessment ? (
        <div
          className="mt-4 rounded-[18px] border border-white/80 bg-white px-4 py-4 text-sm leading-7 text-[#2b3942] shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
          data-testid="wholesale-order-assessment-output"
        >
          {hasStaleAssessment ? (
            <p className="mb-3 rounded-[14px] bg-[#fff8e6] px-3 py-2 text-xs leading-5 text-[#8a650d]">
              筛选条件已变化，建议重新生成评估。
            </p>
          ) : null}
          <p className="whitespace-pre-wrap break-words">{assessment.trim()}</p>
        </div>
      ) : null}
    </DashboardSectionPanel>
  );
}
