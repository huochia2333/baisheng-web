"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import { type AdminPersonRow } from "@/lib/admin-people";

import {
  getPersonContact,
  getPersonDisplayName,
  getRoleLabel,
  getStatusLabel,
} from "./admin-people-display";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function AdminPeopleAccountDialog({
  canSaveDraft,
  draftNote,
  draftRole,
  draftStatus,
  onClose,
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
  draftNote: string;
  draftRole: string;
  draftStatus: string;
  onClose: () => void;
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
        <div className="space-y-5">
          <div className="rounded-[22px] border border-[#e4e9ed] bg-white p-5">
            <p className="text-lg font-semibold text-[#23313a]">
              {getPersonDisplayName(person, t("fallback.unnamedUser"))}
            </p>
            <p className="mt-1 text-sm text-[#6a7680]">
              {getPersonContact(person, t("fallback.notProvided"))}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReadonlyValue
                label={t("dialog.currentRole")}
                value={getRoleLabel(
                  person.role,
                  roleLabels,
                  t("fallback.notProvided"),
                )}
              />
              <ReadonlyValue
                label={t("dialog.currentStatus")}
                value={getStatusLabel(
                  person.status,
                  statusLabels,
                  t("fallback.notProvided"),
                )}
              />
            </div>
          </div>

          {selectedPersonIsCurrentViewer ? (
            <PageBanner tone="info">{t("dialog.selfHint")}</PageBanner>
          ) : (
            <PageBanner tone="info">{t("dialog.effectHint")}</PageBanner>
          )}

          <PageBanner tone="info">{t("dialog.relationHint")}</PageBanner>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
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

            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                {t("dialog.nextStatus")}
              </span>
              <select
                className="h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
                disabled={selectedPersonIsCurrentViewer || saving}
                onChange={(event) => onDraftStatusChange(event.target.value)}
                value={draftStatus}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
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
      ) : null}
    </DashboardDialog>
  );
}

function ReadonlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#f6f4f0] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#23313a]">{value}</p>
    </div>
  );
}
