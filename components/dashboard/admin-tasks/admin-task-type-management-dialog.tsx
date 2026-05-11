"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Ban,
  CheckCircle2,
  LoaderCircle,
  PencilLine,
  Plus,
} from "lucide-react";

import { type TaskTypeOption } from "@/lib/admin-tasks";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import { formatTaskCommissionMoney } from "@/components/dashboard/tasks/tasks-display";

import { FormField } from "./admin-tasks-ui";
import {
  type PageFeedback,
  taskInputClassName,
  taskTextareaClassName,
} from "./admin-tasks-view-model-shared";
import { type TaskTypeFormState } from "./use-admin-task-type-management-dialog";

const DashboardDialog = dynamic(
  () => import("@/components/dashboard/dashboard-dialog").then((mod) => mod.DashboardDialog),
  { ssr: false },
);

export function TaskTypeManagementDialog({
  editingTaskType,
  feedback,
  formPending,
  formState,
  onDeactivate,
  onFieldChange,
  onOpenChange,
  onStartCreate,
  onStartEdit,
  onSubmit,
  open,
  pendingCode,
  taskTypeOptions,
}: {
  editingTaskType: TaskTypeOption | null;
  feedback: PageFeedback;
  formPending: boolean;
  formState: TaskTypeFormState;
  onDeactivate: (taskType: TaskTypeOption) => void;
  onFieldChange: <Key extends keyof TaskTypeFormState>(
    key: Key,
    value: TaskTypeFormState[Key],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onStartCreate: () => void;
  onStartEdit: (taskType: TaskTypeOption) => void;
  onSubmit: () => void;
  open: boolean;
  pendingCode: string | null;
  taskTypeOptions: TaskTypeOption[];
}) {
  const t = useTranslations("Tasks.admin");
  const { locale } = useLocale();

  return open ? (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-11 rounded-full border border-[#d8e2e8] bg-white px-5 text-[#486782] hover:bg-[#eef3f6]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {t("taskTypes.dialog.close")}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={formPending || pendingCode !== null}
            onClick={onSubmit}
            type="button"
          >
            {formPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : editingTaskType ? (
              <PencilLine className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingTaskType ? t("taskTypes.form.save") : t("taskTypes.form.create")}
          </Button>
        </>
      }
      description={t("taskTypes.dialog.description")}
      onOpenChange={onOpenChange}
      open
      title={t("taskTypes.dialog.title")}
    >
      <div className="space-y-6">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#23313a]">
                {t("taskTypes.list.title")}
              </h3>
              <Button
                className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-xs text-[#486782] hover:bg-[#eef3f6]"
                onClick={onStartCreate}
                type="button"
              >
                <Plus className="size-3.5" />
                {t("taskTypes.list.new")}
              </Button>
            </div>

            {taskTypeOptions.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#d8e2e8] bg-[#f8fbfc] p-5 text-sm leading-7 text-[#6f7b85]">
                {t("taskTypes.list.empty")}
              </div>
            ) : (
              <div className="space-y-3">
                {taskTypeOptions.map((taskType) => (
                  <div
                    className={[
                      "rounded-[20px] border p-4 transition",
                      editingTaskType?.code === taskType.code
                        ? "border-[#486782] bg-[#f8fbfd]"
                        : "border-[#e6ebef] bg-white",
                    ].join(" ")}
                    key={taskType.code}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#23313a]">
                            {taskType.displayName}
                          </p>
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                              taskType.isActive
                                ? "bg-[#eef8f0] text-[#2f7a45]"
                                : "bg-[#eef1f3] text-[#7b858d]",
                            ].join(" ")}
                          >
                            {taskType.isActive ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : (
                              <Ban className="size-3.5" />
                            )}
                            {taskType.isActive
                              ? t("taskTypes.list.active")
                              : t("taskTypes.list.inactive")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                          {taskType.description?.trim() || t("taskTypes.list.noDescription")}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-[#486782]">
                          {t("taskTypes.list.defaultCommission", {
                            amount: formatTaskCommissionMoney(
                              taskType.defaultCommissionAmountRmb,
                              locale,
                            ),
                          })}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-xs text-[#486782] hover:bg-[#eef3f6]"
                          disabled={formPending || pendingCode !== null}
                          onClick={() => onStartEdit(taskType)}
                          type="button"
                        >
                          <PencilLine className="size-3.5" />
                          {t("taskTypes.list.edit")}
                        </Button>
                        <Button
                          className="h-9 rounded-full border border-[#f1d1d1] bg-[#fff2f2] px-3 text-xs text-[#b13d3d] hover:bg-[#fce5e5] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            formPending || pendingCode !== null || !taskType.isActive
                          }
                          onClick={() => onDeactivate(taskType)}
                          type="button"
                        >
                          {pendingCode === taskType.code ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                          ) : (
                            <Ban className="size-3.5" />
                          )}
                          {t("taskTypes.list.deactivate")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[22px] border border-[#e6ebef] bg-[#f8fbfc] p-5">
            <h3 className="text-sm font-semibold text-[#23313a]">
              {editingTaskType ? t("taskTypes.form.editTitle") : t("taskTypes.form.createTitle")}
            </h3>
            <div className="mt-5 space-y-5">
              <FormField label={t("taskTypes.form.nameLabel")}>
                <input
                  className={taskInputClassName}
                  disabled={formPending}
                  onChange={(event) => onFieldChange("displayName", event.target.value)}
                  placeholder={t("taskTypes.form.namePlaceholder")}
                  type="text"
                  value={formState.displayName}
                />
              </FormField>

              <FormField label={t("taskTypes.form.commissionLabel")}>
                <input
                  className={taskInputClassName}
                  disabled={formPending}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    onFieldChange("defaultCommissionAmount", event.target.value)
                  }
                  placeholder={t("taskTypes.form.commissionPlaceholder")}
                  step="0.01"
                  type="number"
                  value={formState.defaultCommissionAmount}
                />
              </FormField>

              <FormField label={t("taskTypes.form.descriptionLabel")}>
                <textarea
                  className={taskTextareaClassName}
                  disabled={formPending}
                  onChange={(event) => onFieldChange("description", event.target.value)}
                  placeholder={t("taskTypes.form.descriptionPlaceholder")}
                  value={formState.description}
                />
              </FormField>
            </div>
          </section>
        </div>
      </div>
    </DashboardDialog>
  ) : null;
}
