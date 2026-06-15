"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PEOPLE_CITY_MAX_LENGTH,
  type AdminPersonRow,
} from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";

import { AdminPeopleAccountDetails } from "./admin-people-account-details";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function AdminPeopleAccountDialog({
  canSaveDraft,
  draftCity,
  draftNote,
  draftRole,
  draftStatus,
  locale,
  onClose,
  onDraftCityChange,
  onDraftNoteChange,
  onDraftRoleChange,
  onDraftStatusChange,
  onSave,
  open,
  person,
  roleLabels,
  roleOptions,
  saving,
  selectedPersonIsCurrentViewer,
  selectedPersonName,
  statusLabels,
  statusOptions,
}: {
  canSaveDraft: boolean;
  draftCity: string;
  draftNote: string;
  draftRole: string;
  draftStatus: string;
  locale: Locale;
  onClose: () => void;
  onDraftCityChange: (value: string) => void;
  onDraftNoteChange: (value: string) => void;
  onDraftRoleChange: (value: string) => void;
  onDraftStatusChange: (value: string) => void;
  onSave: () => void;
  open: boolean;
  person: AdminPersonRow | null;
  roleLabels: AdminPeopleViewModel["roleLabels"];
  roleOptions: AdminPeopleViewModel["roleOptions"];
  saving: boolean;
  selectedPersonIsCurrentViewer: boolean;
  selectedPersonName: string;
  statusLabels: AdminPeopleViewModel["statusLabels"];
  statusOptions: AdminPeopleViewModel["statusOptions"];
}) {
  const t = useTranslations("AdminPeople");

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
            disabled={!canSaveDraft}
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
        name: selectedPersonName || t("fallback.unnamedUser"),
      })}
    >
      {person ? (
        <div className="min-w-0 space-y-6">
          <AdminPeopleAccountDetails
            locale={locale}
            person={person}
            roleLabels={roleLabels}
            statusLabels={statusLabels}
          />

          <section className="min-w-0 border-t border-[#ebe7e1] pt-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#23313a]">
                {t("dialog.adjustTitle")}
              </p>
              <p className="mt-1 text-xs leading-6 text-[#6a7680]">
                {t("dialog.adjustDescription")}
              </p>
            </div>

            <div className="min-w-0 space-y-5">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                    {t("dialog.nextRole")}
                  </span>
                  <select
                    className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                    disabled={selectedPersonIsCurrentViewer || saving}
                    onChange={(event) => onDraftRoleChange(event.target.value)}
                    value={draftRole}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                    {t("dialog.nextStatus")}
                  </span>
                  <select
                    className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                    disabled={selectedPersonIsCurrentViewer || saving}
                    onChange={(event) =>
                      onDraftStatusChange(event.target.value)
                    }
                    value={draftStatus}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0 sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                    {t("dialog.nextCity")}
                  </span>
                  <input
                    className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition placeholder:text-[#8a949c] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                    disabled={selectedPersonIsCurrentViewer || saving}
                    maxLength={ADMIN_PEOPLE_CITY_MAX_LENGTH}
                    onChange={(event) => onDraftCityChange(event.target.value)}
                    placeholder={t("dialog.cityPlaceholder")}
                    value={draftCity}
                  />
                </label>
              </div>

              <label className="block min-w-0">
                <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                  {t("dialog.note")}
                </span>
                <textarea
                  className="min-h-28 w-full resize-y rounded-[18px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-6 text-[#23313a] outline-none transition placeholder:text-[#8a949c] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                  disabled={selectedPersonIsCurrentViewer || saving}
                  maxLength={500}
                  onChange={(event) => onDraftNoteChange(event.target.value)}
                  placeholder={t("dialog.notePlaceholder")}
                  value={draftNote}
                />
              </label>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardDialog>
  );
}
