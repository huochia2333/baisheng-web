"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { PERSON_PRIVATE_NOTE_MAX_LENGTH } from "@/lib/person-private-note-constants";

export type PersonPrivateNoteFeedback = {
  tone: "error" | "success" | "info";
  message: string;
};

type PersonPrivateNoteTarget = {
  user_id: string;
  private_note: string | null;
};

type UsePersonPrivateNoteEditorOptions<TTarget extends PersonPrivateNoteTarget> = {
  getTargetName: (target: TTarget) => string;
  onSaved: (targetUserId: string, note: string | null) => void;
  setFeedback: (feedback: PersonPrivateNoteFeedback | null) => void;
};

type SaveResponse = {
  targetUserId?: string;
  note?: string | null;
  error?: string;
};

export function usePersonPrivateNoteEditor<
  TTarget extends PersonPrivateNoteTarget,
>({
  getTargetName,
  onSaved,
  setFeedback,
}: UsePersonPrivateNoteEditorOptions<TTarget>) {
  const t = useTranslations("PersonPrivateNotes");
  const [selectedTarget, setSelectedTarget] = useState<TTarget | null>(null);
  const [selectedTargetName, setSelectedTargetName] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  const originalNote = selectedTarget?.private_note ?? "";
  const hasDraftChange =
    selectedTarget !== null &&
    normalizeNote(draftNote) !== normalizeNote(originalNote);
  const canSave = selectedTarget !== null && hasDraftChange && !saving;

  const openNoteDialog = (target: TTarget) => {
    setFeedback(null);
    setSelectedTarget(target);
    setSelectedTargetName(getTargetName(target));
    setDraftNote(target.private_note ?? "");
  };

  const closeNoteDialog = () => {
    if (saving) {
      return;
    }

    setSelectedTarget(null);
  };

  const handleDraftNoteChange = (value: string) => {
    setDraftNote(value.slice(0, PERSON_PRIVATE_NOTE_MAX_LENGTH));
  };

  const handleSaveNote = async () => {
    if (!selectedTarget || !canSave) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/people/note", {
        body: JSON.stringify({
          note: draftNote,
          targetUserId: selectedTarget.user_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await readSaveResponse(response);

      if (!response.ok || !result.targetUserId) {
        setFeedback({
          tone: "error",
          message: t(`errors.${normalizeErrorCode(result.error)}`),
        });
        return;
      }

      const savedNote = result.note ?? null;

      onSaved(result.targetUserId, savedNote);
      setSelectedTarget(null);
      setDraftNote(savedNote ?? "");
      setFeedback({
        tone: "success",
        message: savedNote ? t("feedback.saved") : t("feedback.cleared"),
      });
    } catch {
      setFeedback({
        tone: "error",
        message: t("errors.serviceUnavailable"),
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    canSave,
    draftNote,
    noteDialogOpen: selectedTarget !== null,
    saving,
    selectedTargetName,
    closeNoteDialog,
    handleDraftNoteChange,
    handleSaveNote,
    openNoteDialog,
  };
}

async function readSaveResponse(response: Response): Promise<SaveResponse> {
  try {
    const value: unknown = await response.json();

    if (!isRecord(value)) {
      return {};
    }

    return {
      error: typeof value.error === "string" ? value.error : undefined,
      note:
        typeof value.note === "string" || value.note === null
          ? value.note
          : undefined,
      targetUserId:
        typeof value.targetUserId === "string" ? value.targetUserId : undefined,
    };
  } catch {
    return {};
  }
}

function normalizeErrorCode(value: string | undefined) {
  switch (value) {
    case "forbidden":
    case "invalidInput":
    case "notFound":
    case "serviceUnavailable":
      return value;
    default:
      return "unknown";
  }
}

function normalizeNote(value: string) {
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
