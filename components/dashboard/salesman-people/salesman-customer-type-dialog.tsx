"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { Button } from "@/components/ui/button";
import type {
  SalesmanCustomerRow,
  SalesmanCustomerType,
} from "@/lib/salesman-people";

import {
  getSalesmanCustomerContact,
  getSalesmanCustomerName,
  getSalesmanCustomerTypeLabel,
} from "./salesman-people-display";
import type { useSalesmanPeopleViewModel } from "./use-salesman-people-view-model";

type SalesmanPeopleViewModel = ReturnType<typeof useSalesmanPeopleViewModel>;

export function SalesmanCustomerTypeDialog({
  canSave,
  customer,
  customerTypeLabels,
  customerTypeOptions,
  draftType,
  onClose,
  onDraftTypeChange,
  onSave,
  open,
  saving,
}: {
  canSave: boolean;
  customer: SalesmanCustomerRow | null;
  customerTypeLabels: SalesmanPeopleViewModel["customerTypeLabels"];
  customerTypeOptions: SalesmanPeopleViewModel["customerTypeOptions"];
  draftType: SalesmanCustomerType | "";
  onClose: () => void;
  onDraftTypeChange: (value: string) => void;
  onSave: () => void;
  open: boolean;
  saving: boolean;
}) {
  const t = useTranslations("SalesmanPeople");
  const fallback = t("fallback.notProvided");

  return (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-10 rounded-full border border-[#d9e0e5] bg-white px-5 text-[#486782] hover:bg-[#f3f6f8]"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            {t("actions.cancel")}
          </Button>
          <Button
            className="h-10 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={!canSave}
            onClick={onSave}
            type="button"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? t("actions.saving") : t("actions.save")}
          </Button>
        </>
      }
      description={t("dialog.description")}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title={t("dialog.title", {
        name: customer
          ? getSalesmanCustomerName(customer, t("fallback.unnamedCustomer"))
          : t("fallback.unnamedCustomer"),
      })}
    >
      {customer ? (
        <div className="space-y-5">
          <div className="rounded-[22px] border border-[#e4e9ed] bg-white p-5">
            <p className="text-lg font-semibold text-[#23313a]">
              {getSalesmanCustomerName(customer, t("fallback.unnamedCustomer"))}
            </p>
            <p className="mt-1 break-all text-sm text-[#6a7680]">
              {getSalesmanCustomerContact(customer, fallback)}
            </p>
            <div className="mt-4 rounded-[18px] bg-[#f6f4f0] px-4 py-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#88939b] uppercase">
                {t("dialog.currentType")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#23313a]">
                {getSalesmanCustomerTypeLabel(
                  customer.customer_type,
                  customerTypeLabels,
                  t("fallback.unmarked"),
                )}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
              {t("dialog.nextType")}
            </span>
            <select
              className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
              disabled={saving}
              onChange={(event) => onDraftTypeChange(event.target.value)}
              value={draftType}
            >
              <option value="">{t("dialog.typePlaceholder")}</option>
              {customerTypeOptions.map((customerType) => (
                <option key={customerType} value={customerType}>
                  {customerTypeLabels[customerType]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </DashboardDialog>
  );
}
