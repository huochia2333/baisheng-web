"use client";

import { LoaderCircle } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { PageBanner, type NoticeTone } from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import type { WorkspaceFeedbackType } from "@/lib/workspace-feedback";

import {
  workspaceFeedbackTypeValues,
  type WorkspaceFeedbackFormState,
} from "./workspace-feedback-display";

type WorkspaceFeedbackDialogProps = {
  copy: {
    cancel: string;
    contentLabel: string;
    contentPlaceholder: string;
    description: string;
    submit: string;
    title: string;
    titleLabel: string;
    titlePlaceholder: string;
    typeLabel: string;
    typeOptions: Record<WorkspaceFeedbackType, string>;
  };
  feedback: { tone: NoticeTone; message: string } | null;
  formState: WorkspaceFeedbackFormState;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onUpdateField: <Key extends keyof WorkspaceFeedbackFormState>(
    field: Key,
    value: WorkspaceFeedbackFormState[Key],
  ) => void;
  open: boolean;
  pending: boolean;
};

const inputClassName =
  "min-h-11 rounded-2xl border border-[#d8dee3] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#86a5ba] focus:ring-4 focus:ring-[#dbe8f0]";
const textareaClassName = `${inputClassName} min-h-[180px] resize-y py-3 leading-7`;

export function WorkspaceFeedbackDialog({
  copy,
  feedback,
  formState,
  onOpenChange,
  onSubmit,
  onUpdateField,
  open,
  pending,
}: WorkspaceFeedbackDialogProps) {
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
            {copy.submit}
          </Button>
        </>
      }
      description={copy.description}
      onOpenChange={onOpenChange}
      open={open}
      title={copy.title}
    >
      <div className="space-y-5">
        {feedback ? (
          <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-[#31424e]">
          {copy.typeLabel}
          <select
            className={inputClassName}
            onChange={(event) =>
              onUpdateField(
                "feedbackType",
                event.target.value as WorkspaceFeedbackType,
              )
            }
            value={formState.feedbackType}
          >
            {workspaceFeedbackTypeValues.map((feedbackType) => (
              <option key={feedbackType} value={feedbackType}>
                {copy.typeOptions[feedbackType]}
              </option>
            ))}
          </select>
        </label>

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
