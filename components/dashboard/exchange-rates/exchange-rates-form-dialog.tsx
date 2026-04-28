"use client";

import type { ReactNode } from "react";

import { LoaderCircle, PencilLine, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  PageBanner,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";

import type { ExchangeRateFormState } from "./exchange-rates-utils";

type ExchangeRateFormDialogProps = {
  feedback?: { tone: NoticeTone; message: string } | null;
  formState: ExchangeRateFormState;
  mode: "create" | "edit";
  open: boolean;
  pending: boolean;
  onFieldChange: <Key extends keyof ExchangeRateFormState>(
    key: Key,
    value: ExchangeRateFormState[Key],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function ExchangeRateFormDialog({
  feedback,
  formState,
  mode,
  open,
  pending,
  onFieldChange,
  onOpenChange,
  onSubmit,
}: ExchangeRateFormDialogProps) {
  const t = useTranslations("ExchangeRates");

  return (
    <DashboardDialog
      actions={
        <>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("dialogs.cancel")}
          </Button>
          <Button
            className="bg-[#486782] text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <Plus className="size-4" />
            ) : (
              <PencilLine className="size-4" />
            )}
            {mode === "create"
              ? t("dialogs.create.submit")
              : t("dialogs.edit.submit")}
          </Button>
        </>
      }
      description={
        mode === "create"
          ? t("dialogs.create.description")
          : t("dialogs.edit.description")
      }
      onOpenChange={onOpenChange}
      open={open}
      title={mode === "create" ? t("dialogs.create.title") : t("dialogs.edit.title")}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 md:grid-cols-2">
          <ExchangeRateField label={t("dialogs.fields.originalCurrency")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("originalCurrency", event.target.value)}
              placeholder={t("dialogs.placeholders.originalCurrency")}
              type="text"
              value={formState.originalCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label={t("dialogs.fields.targetCurrency")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              onChange={(event) => onFieldChange("targetCurrency", event.target.value)}
              placeholder={t("dialogs.placeholders.targetCurrency")}
              type="text"
              value={formState.targetCurrency}
            />
          </ExchangeRateField>

          <ExchangeRateField label={t("dialogs.fields.dailyExchangeRate")} required>
            <input
              className={fieldInputClassName}
              disabled={pending}
              min="0"
              onChange={(event) =>
                onFieldChange("dailyExchangeRate", event.target.value)
              }
              placeholder={t("dialogs.placeholders.dailyExchangeRate")}
              step="0.000001"
              type="number"
              value={formState.dailyExchangeRate}
            />
          </ExchangeRateField>

          <div className="rounded-[22px] border border-[#ebe7e1] bg-[#f8f6f3] px-4 py-4 text-sm leading-7 text-[#65717b]">
            {t("dialogs.currencyHint")}
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
}

function ExchangeRateField({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#52616d]">
        {label}
        {required ? <span className="ml-1 text-[#c94d4d]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const fieldInputClassName =
  "h-12 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30 disabled:cursor-not-allowed disabled:opacity-70";
