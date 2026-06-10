"use client";

import { LoaderCircle, Save, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { Button } from "@/components/ui/button";
import { PERSON_PRIVATE_NOTE_MAX_LENGTH } from "@/lib/person-private-note-constants";

export function PersonPrivateNoteDialog({
  canSave,
  draftNote,
  onClose,
  onDraftNoteChange,
  onSave,
  open,
  saving,
  targetName,
}: {
  canSave: boolean;
  draftNote: string;
  onClose: () => void;
  onDraftNoteChange: (value: string) => void;
  onSave: () => void;
  open: boolean;
  saving: boolean;
  targetName: string;
}) {
  const t = useTranslations("PersonPrivateNotes");

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
        name: targetName || t("fallback.unnamed"),
      })}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-[#e4e9ed] bg-white p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef3f6] text-[#486782]">
            <StickyNote className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-[#23313a] [overflow-wrap:anywhere]">
              {targetName || t("fallback.unnamed")}
            </p>
            <p className="mt-1 break-words text-xs leading-6 text-[#6a7680] [overflow-wrap:anywhere]">
              {t("dialog.visibility")}
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
            {t("dialog.note")}
          </span>
          <textarea
            className="min-h-40 w-full resize-y rounded-[18px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-6 text-[#23313a] outline-none transition placeholder:text-[#8a949c] focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
            disabled={saving}
            maxLength={PERSON_PRIVATE_NOTE_MAX_LENGTH}
            onChange={(event) => onDraftNoteChange(event.target.value)}
            placeholder={t("dialog.placeholder")}
            value={draftNote}
          />
        </label>

        <p className="text-right text-xs text-[#7b858d]">
          {t("dialog.counter", {
            count: draftNote.length,
            max: PERSON_PRIVATE_NOTE_MAX_LENGTH,
          })}
        </p>
      </div>
    </DashboardDialog>
  );
}
