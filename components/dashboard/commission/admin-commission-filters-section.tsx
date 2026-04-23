"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  BeneficiarySummaryRow,
  CategoryFilter,
  CommissionFilterOption,
  CommissionFilters,
  SettlementFilter,
} from "./admin-commission-view-model";

export function CommissionFiltersSection({
  beneficiaryCount,
  beneficiaryOptions,
  categoryOptions,
  filters,
  hasActiveFilters,
  onFilterChange,
  onResetFilters,
  recordCount,
  settlementOptions,
}: {
  beneficiaryCount: number;
  beneficiaryOptions: BeneficiarySummaryRow[];
  categoryOptions: readonly CommissionFilterOption<CategoryFilter>[];
  filters: CommissionFilters;
  hasActiveFilters: boolean;
  onFilterChange: <Key extends keyof CommissionFilters>(
    key: Key,
    value: CommissionFilters[Key],
  ) => void;
  onResetFilters: () => void;
  recordCount: number;
  settlementOptions: readonly CommissionFilterOption<SettlementFilter>[];
}) {
  const t = useTranslations("Commission");

  return (
    <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#22313a]">
              {t("filters.title")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#67727b]">
              {t("filters.description", {
                beneficiaries: beneficiaryCount,
                records: recordCount,
              })}
            </p>
          </div>
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            onClick={onResetFilters}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            {t("filters.reset")}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchField
            label={t("filters.keywordLabel")}
            onChange={(value) => onFilterChange("searchText", value)}
            placeholder={t("filters.keywordPlaceholder")}
            value={filters.searchText}
          />
          <SelectField
            label={t("filters.beneficiaryLabel")}
            onChange={(value) => onFilterChange("beneficiaryUserId", value)}
            value={filters.beneficiaryUserId}
          >
            <option value="">{t("filters.allBeneficiaries")}</option>
            {beneficiaryOptions.map((beneficiary) => (
              <option key={beneficiary.userId} value={beneficiary.userId}>
                {beneficiary.label}
              </option>
            ))}
          </SelectField>
          <SearchField
            label={t("filters.orderNumberLabel")}
            onChange={(value) => onFilterChange("orderNumber", value)}
            placeholder={t("filters.orderNumberPlaceholder")}
            value={filters.orderNumber}
          />
          <SelectField
            label={t("filters.settlementStatusLabel")}
            onChange={(value) =>
              onFilterChange("settlementStatus", value as SettlementFilter)
            }
            value={filters.settlementStatus}
          >
            {settlementOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t("filters.categoryLabel")}
            onChange={(value) => onFilterChange("category", value as CategoryFilter)}
            value={filters.category}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
        {hasActiveFilters ? (
          <div className="flex flex-wrap gap-2 text-sm text-[#66717a]">
            <ActiveFilterChip
              active={Boolean(filters.beneficiaryUserId)}
              label={
                filters.beneficiaryUserId
                  ? `${t("chips.beneficiaryPrefix")}${
                      beneficiaryOptions.find(
                        (item) => item.userId === filters.beneficiaryUserId,
                      )?.label ?? t("chips.selected")
                    }`
                  : ""
              }
            />
            <ActiveFilterChip
              active={Boolean(filters.orderNumber)}
              label={
                filters.orderNumber
                  ? `${t("chips.orderNumberPrefix")}${filters.orderNumber}`
                  : ""
              }
            />
            <ActiveFilterChip
              active={filters.settlementStatus !== "all"}
              label={
                filters.settlementStatus !== "all"
                  ? `${t("chips.settlementPrefix")}${
                      settlementOptions.find(
                        (item) => item.value === filters.settlementStatus,
                      )?.label ?? filters.settlementStatus
                    }`
                  : ""
              }
            />
            <ActiveFilterChip
              active={filters.category !== "all"}
              label={
                filters.category !== "all"
                  ? `${t("chips.categoryPrefix")}${
                      categoryOptions.find((item) => item.value === filters.category)
                        ?.label ?? filters.category
                    }`
                  : ""
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SearchField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-[18px] border border-[#dfe5ea] bg-white px-4 shadow-[0_8px_18px_rgba(96,113,128,0.04)]">
        <Search className="size-4 text-[#7a8790]" />
        <input
          className="h-12 w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <select
        className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function ActiveFilterChip({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[#edf2f7] px-3 py-1 text-xs font-medium text-[#486782]">
      {label}
    </span>
  );
}
