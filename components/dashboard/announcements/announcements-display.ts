import type {
  AnnouncementAudience,
  AnnouncementRow,
  AnnouncementStatus,
} from "@/lib/announcements";

export type AnnouncementFormState = {
  audience: AnnouncementAudience;
  content: string;
  title: string;
};

type AnnouncementErrorCopy = {
  notFoundError: string;
  permissionError: string;
  unknownError: string;
};

export const announcementAudienceValues: readonly AnnouncementAudience[] = [
  "client",
  "internal",
  "all",
];

export const announcementStatusValues: readonly AnnouncementStatus[] = [
  "draft",
  "published",
  "offline",
];

export function createEmptyAnnouncementForm(): AnnouncementFormState {
  return {
    audience: "all",
    content: "",
    title: "",
  };
}

export function createAnnouncementFormFromRow(
  row: AnnouncementRow,
): AnnouncementFormState {
  return {
    audience: row.audience,
    content: row.content,
    title: row.title,
  };
}

export function formatAnnouncementDate(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function toAnnouncementErrorMessage(
  error: unknown,
  copy: AnnouncementErrorCopy,
) {
  const message = error instanceof Error ? error.message.trim() : "";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("announcement was not found")) {
    return copy.notFoundError;
  }

  if (
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("row-level security")
  ) {
    return copy.permissionError;
  }

  if (message.length > 0 && !looksLikeTechnicalAnnouncementError(normalizedMessage)) {
    return message;
  }

  return copy.unknownError;
}

function looksLikeTechnicalAnnouncementError(message: string) {
  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("jwt") ||
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("violates") ||
    message.includes("supabase") ||
    /\bhttp\s+\d{3}\b/.test(message) ||
    /\bstatus code\b/.test(message)
  );
}
