"use client";

import { LoaderCircle, PencilLine, Save, X } from "lucide-react";

import type { ServiceFeeTypeOption } from "@/lib/service-fee-types";

import { Button } from "../../ui/button";
import {
  DashboardTableFrame,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { formatDiscountRatioValue } from "./admin-orders-utils";

type ServiceFeeTierSectionCopy = {
  actions: string;
  cancel: string;
  edit: string;
  empty: string;
  rate: string;
  rule: string;
  save: string;
  tier: string;
};

type ServiceFeeTierSectionProps = {
  copy: ServiceFeeTierSectionCopy;
  description: string;
  editValue: string;
  editingId: string | null;
  locale: Parameters<typeof formatDiscountRatioValue>[1];
  pendingAction: string | null;
  rows: ServiceFeeTypeOption[];
  title: string;
  onCancelEditing: () => void;
  onEditValueChange: (value: string) => void;
  onSave: (row: ServiceFeeTypeOption) => void;
  onStartEditing: (row: ServiceFeeTypeOption) => void;
};

export function AdminOrdersServiceFeeTierSection({
  copy,
  description,
  editValue,
  editingId,
  locale,
  pendingAction,
  rows,
  title,
  onCancelEditing,
  onEditValueChange,
  onSave,
  onStartEditing,
}: ServiceFeeTierSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="min-w-0">
        <h3 className="text-xl font-bold tracking-tight text-[#23313a] sm:text-2xl">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-[#6f7b85] sm:leading-7">
          {description}
        </p>
      </div>

      <DashboardTableFrame>
        {rows.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#65717b]">{copy.empty}</div>
        ) : (
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead className="bg-[#f7f5f2]">
              <tr className="border-b border-[#efebe5]">
                <ServiceFeeHeaderCell className="w-[24%]">
                  {copy.tier}
                </ServiceFeeHeaderCell>
                <ServiceFeeHeaderCell className="w-[38%]">
                  {copy.rule}
                </ServiceFeeHeaderCell>
                <ServiceFeeHeaderCell className="w-[18%]">
                  {copy.rate}
                </ServiceFeeHeaderCell>
                <ServiceFeeHeaderCell className="w-[20%] text-right">
                  {copy.actions}
                </ServiceFeeHeaderCell>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                const isSaving = pendingAction === `edit:${row.id}`;

                return (
                  <tr
                    className="border-b border-[#efebe5] last:border-b-0"
                    key={row.id}
                  >
                    <td className="px-5 py-4 align-top text-sm font-semibold leading-6 text-[#23313a]">
                      {row.display_name}
                    </td>
                    <td className="px-5 py-4 align-top text-sm leading-6 text-[#60707d]">
                      {row.rule_description}
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-[#23313a]">
                      {isEditing ? (
                        <input
                          className={dashboardFilterInputClassName}
                          inputMode="decimal"
                          onChange={(event) => onEditValueChange(event.target.value)}
                          value={editValue}
                        />
                      ) : (
                        formatDiscountRatioValue(row.fee_ratio, locale)
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={() => onSave(row)}
                              type="button"
                              variant="outline"
                            >
                              {isSaving ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              {copy.save}
                            </Button>
                            <Button
                              disabled={pendingAction !== null}
                              onClick={onCancelEditing}
                              type="button"
                              variant="outline"
                            >
                              <X className="size-4" />
                              {copy.cancel}
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled={pendingAction !== null}
                            onClick={() => onStartEditing(row)}
                            type="button"
                            variant="outline"
                          >
                            <PencilLine className="size-4" />
                            {copy.edit}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DashboardTableFrame>
    </section>
  );
}

function ServiceFeeHeaderCell({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase ${className}`}
    >
      {children}
    </th>
  );
}
