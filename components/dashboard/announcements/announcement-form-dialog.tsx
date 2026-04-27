"use client";

import { LoaderCircle } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { Button } from "@/components/ui/button";
import type { AnnouncementAudience, AnnouncementRow } from "@/lib/announcements";

import type { NoticeTone } from "../dashboard-shared-ui";
import {
  announcementAudienceValues,
  type AnnouncementFormState,
} from "./announcements-display";

type AnnouncementFormDialogProps = {
  copy: {
    audienceLabel: string;
    audienceOptions: Record<AnnouncementAudience, string>;
    cancel: string;
    contentLabel: string;
    contentPlaceholder: string;
    createDescription: string;
    createSubmit: string;
    createTitle: string;
    editDescription: string;
    editSubmit: string;
    editTitle: string;
    titleLabel: string;
    titlePlaceholder: string;
  };
  editingAnnouncement: AnnouncementRow | null;
  feedback: { tone: NoticeTone; message: string } | null;
  formState: AnnouncementFormState;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onUpdateField: <Key extends keyof AnnouncementFormState>(
    field: Key,
    value: AnnouncementFormState[Key],
  ) => void;
  open: boolean;
  pending: boolean;
};

const inputClassName =
  "min-h-11 rounded-2xl border border-[#d8dee3] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#86a5ba] focus:ring-4 focus:ring-[#dbe8f0]";
const textareaClassName = `${inputClassName} min-h-[180px] resize-y py-3 leading-7`;

export function AnnouncementFormDialog({
  copy,
  editingAnnouncement,
  feedback,
  formState,
  onOpenChange,
  onSubmit,
  onUpdateField,
  open,
  pending,
}: AnnouncementFormDialogProps) {
  const createMode = !editingAnnouncement;

  return open ? (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            {copy.cancel}
          </Button>
          <Button
            className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
            disabled={pending}
            onClick={onSubmit}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {createMode ? copy.createSubmit : copy.editSubmit}
          </Button>
        </>
      }
      description={createMode ? copy.createDescription : copy.editDescription}
      onOpenChange={onOpenChange}
      open={open}
      title={createMode ? copy.createTitle : copy.editTitle}
    >
      <div className="space-y-5">
        {feedback ? (
          <p className="rounded-[20px] border border-[#f1d1d1] bg-[#fff2f2] px-4 py-3 text-sm leading-7 text-[#9f3535]">
            {feedback.message}
          </p>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-[#31424e]">
          {copy.titleLabel}
          <input
            className={inputClassName}
            onChange={(event) => onUpdateField("title", event.target.value)}
            placeholder={copy.titlePlaceholder}
            type="text"
            value={formState.title}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#31424e]">
          {copy.audienceLabel}
          <select
            className={inputClassName}
            onChange={(event) =>
              onUpdateField(
                "audience",
                event.target.value as AnnouncementAudience,
              )
            }
            value={formState.audience}
          >
            {announcementAudienceValues.map((audience) => (
              <option key={audience} value={audience}>
                {copy.audienceOptions[audience]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#31424e]">
          {copy.contentLabel}
          <textarea
            className={textareaClassName}
            onChange={(event) => onUpdateField("content", event.target.value)}
            placeholder={copy.contentPlaceholder}
            value={formState.content}
          />
        </label>
      </div>
    </DashboardDialog>
  ) : null;
}
