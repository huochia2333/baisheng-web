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
    <div className="mt-4 flex flex-col gap-3 border-t border-[#e7e3dc] pt-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
      <p className="text-xs text-[#6d7780] sm:text-sm">
        {t("range", {
          end: endIndex,
          start: startIndex,
          total: totalItems,
        })}
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <Button
          className="h-9 rounded-full border-[#d4d8dc] bg-white px-3 text-xs text-[#486782] hover:bg-[#f2f4f6] sm:h-10 sm:px-4 sm:text-sm"
          disabled={!hasPreviousPage}
          onClick={onPreviousPage}
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          {t("previous")}
        </Button>

        <p className="min-w-[84px] text-center text-xs font-medium text-[#486782] sm:min-w-[120px] sm:text-sm">
          {t("page", { page, pageCount })}
        </p>

        <Button
          className="h-9 rounded-full border-[#d4d8dc] bg-white px-3 text-xs text-[#486782] hover:bg-[#f2f4f6] sm:h-10 sm:px-4 sm:text-sm"
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
