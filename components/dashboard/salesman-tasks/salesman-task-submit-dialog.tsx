"use client";

import { useRef } from "react";

import { useTranslations } from "next-intl";
import { LoaderCircle, Paperclip, Trash2, Upload } from "lucide-react";

import {
  TASK_REVIEW_SUBMISSION_MAX_FILES,
  TASK_REVIEW_SUBMISSION_MAX_TOTAL_SIZE_BYTES,
} from "@/lib/task-reviews";
import {
  IMAGE_UPLOAD_MAX_SIZE_BYTES,
  OTHER_UPLOAD_MAX_SIZE_BYTES,
  VIDEO_UPLOAD_MAX_SIZE_BYTES,
} from "@/lib/upload-file-size-limits";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  PageBanner,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import type { SalesmanTaskRow } from "@/lib/salesman-tasks";

type DialogFeedback = { tone: NoticeTone; message: string } | null;

export function SalesmanTaskSubmitDialog({
  feedback,
  files,
  note,
  onFilesChange,
  onNoteChange,
  onOpenChange,
  onRemoveFile,
  onSubmit,
  open,
  pending,
  task,
}: {
  feedback: DialogFeedback;
  files: File[];
  note: string;
  onFilesChange: (files: File[]) => void;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
  open: boolean;
  pending: boolean;
  task: SalesmanTaskRow | null;
}) {
  const t = useTranslations("Tasks.salesman.submitDialog");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <DashboardDialog
      actions={
        <>
          <Button
            className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6]"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("cancel")}
          </Button>
          <Button
            className="h-10 rounded-full bg-[#4c7259] px-4 text-white hover:bg-[#43664f] disabled:opacity-70"
            disabled={pending}
            onClick={onSubmit}
            type="button"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {task?.status === "rejected" ? t("resubmit") : t("submit")}
          </Button>
        </>
      }
      description={
        task
          ? t("description", {
              taskName: task.task_name,
            })
          : undefined
      }
      onOpenChange={onOpenChange}
      open={open}
      title={t("title")}
    >
      <div className="space-y-5">
        {feedback ? <PageBanner tone={feedback.tone}>{feedback.message}</PageBanner> : null}

        {task?.review_reject_reason ? (
          <div className="rounded-[22px] border border-[#f1d1d1] bg-[#fff6f6] p-4">
            <p className="text-sm font-semibold text-[#b13d3d]">{t("rejectReasonLabel")}</p>
            <p className="mt-2 text-sm leading-7 text-[#7b4f4f]">{task.review_reject_reason}</p>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#23313a]">
            {t("noteLabel")}
          </span>
          <textarea
            className="min-h-[140px] w-full rounded-[22px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={t("notePlaceholder")}
            value={note}
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#23313a]">{t("filesLabel")}</p>
          <input
            className="hidden"
            multiple
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? []);
              event.target.value = "";

              if (selectedFiles.length > 0) {
                onFilesChange(selectedFiles);
              }
            }}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[#c8d4de] bg-[#f8fbfc] px-6 py-8 text-center transition hover:border-[#9cb3c6] hover:bg-[#f1f7fb]"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-6 text-[#486782]" />
            <div>
              <p className="text-sm font-semibold text-[#23313a]">{t("filesCta")}</p>
              <p className="mt-2 text-xs leading-6 text-[#6f7b85]">
                {t("filesHint", {
                  maxFiles: TASK_REVIEW_SUBMISSION_MAX_FILES,
                  imageMaxPerFile: formatFileSize(IMAGE_UPLOAD_MAX_SIZE_BYTES),
                  videoMaxPerFile: formatFileSize(VIDEO_UPLOAD_MAX_SIZE_BYTES),
                  otherMaxPerFile: formatFileSize(OTHER_UPLOAD_MAX_SIZE_BYTES),
                  maxTotal: formatFileSize(TASK_REVIEW_SUBMISSION_MAX_TOTAL_SIZE_BYTES),
                })}
              </p>
            </div>
          </button>

          {files.length > 0 ? (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[#e6ebef] bg-white px-4 py-3"
                  key={`${file.name}-${file.size}-${index}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#23313a]">
                      <Paperclip className="size-4 shrink-0 text-[#486782]" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6f7b85]">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff2f2] text-[#b13d3d] transition hover:bg-[#fce5e5]"
                    onClick={() => onRemoveFile(index)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-[#6f7b85]">{t("filesEmpty")}</p>
          )}
        </div>
      </div>
    </DashboardDialog>
  );
}
