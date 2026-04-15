"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "../ui/button";

type DashboardPaginationControlsProps = {
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  page: number;
  pageCount: number;
  startIndex: number;
  totalItems: number;
};

export function DashboardPaginationControls({
  endIndex,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  page,
  pageCount,
  startIndex,
  totalItems,
}: DashboardPaginationControlsProps) {
  const t = useTranslations("DashboardPagination");

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-[#e7e3dc] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#6d7780]">
        {t("range", {
          end: endIndex,
          start: startIndex,
          total: totalItems,
        })}
      </p>

      <div className="flex items-center gap-2">
        <Button
          className="h-10 rounded-full border-[#d4d8dc] bg-white px-4 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={!hasPreviousPage}
          onClick={onPreviousPage}
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          {t("previous")}
        </Button>

        <p className="min-w-[120px] text-center text-sm font-medium text-[#486782]">
          {t("page", { page, pageCount })}
        </p>

        <Button
          className="h-10 rounded-full border-[#d4d8dc] bg-white px-4 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={!hasNextPage}
          onClick={onNextPage}
          type="button"
          variant="outline"
        >
          {t("next")}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
