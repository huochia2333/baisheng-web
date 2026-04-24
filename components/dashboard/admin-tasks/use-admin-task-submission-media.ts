"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  downloadAdminTaskSubmissionMediaBlob,
  getAdminTaskSubmissionMediaSignedUrl,
  getCompletedTaskSubmissionMediaByTaskIds,
  type AdminTaskSubmissionMedia,
} from "@/lib/admin-task-submission-media";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type PreviewMedia = AdminTaskSubmissionMedia & {
  signedUrl: string;
};

export function useAdminTaskSubmissionMedia(taskIds: string[]) {
  const t = useTranslations("Tasks.admin.submissionMedia");
  const supabase = getBrowserSupabaseClient();
  const taskIdsKey = useMemo(() => Array.from(new Set(taskIds)).sort().join("|"), [taskIds]);
  const normalizedTaskIds = useMemo(
    () => (taskIdsKey ? taskIdsKey.split("|").filter(Boolean) : []),
    [taskIdsKey],
  );
  const [mediaByTaskId, setMediaByTaskId] = useState<Map<string, AdminTaskSubmissionMedia[]>>(
    () => new Map(),
  );
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(() => new Set());
  const [busyMediaId, setBusyMediaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);

  useEffect(() => {
    let active = true;

    if (!supabase || normalizedTaskIds.length === 0) {
      setMediaByTaskId(new Map());
      setLoadingTaskIds(new Set());
      setErrorMessage(null);
      return () => {
        active = false;
      };
    }

    setLoadingTaskIds(new Set(normalizedTaskIds));
    setErrorMessage(null);

    getCompletedTaskSubmissionMediaByTaskIds(supabase, normalizedTaskIds)
      .then((rows) => {
        if (!active) {
          return;
        }

        const nextMediaByTaskId = new Map<string, AdminTaskSubmissionMedia[]>();

        for (const row of rows) {
          const bucket = nextMediaByTaskId.get(row.task_id);

          if (bucket) {
            bucket.push(row);
            continue;
          }

          nextMediaByTaskId.set(row.task_id, [row]);
        }

        setMediaByTaskId(nextMediaByTaskId);
        setLoadingTaskIds(new Set());
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setMediaByTaskId(new Map());
        setLoadingTaskIds(new Set());
        setErrorMessage(t("loadFailed"));
      });

    return () => {
      active = false;
    };
  }, [normalizedTaskIds, supabase, t]);

  const resolveSignedUrl = useCallback(
    async (media: AdminTaskSubmissionMedia) => {
      if (!supabase) {
        throw new Error("missing_supabase_client");
      }

      return getAdminTaskSubmissionMediaSignedUrl(supabase, media);
    },
    [supabase],
  );

  const openPreview = useCallback(
    async (media: AdminTaskSubmissionMedia) => {
      if (busyMediaId === media.id) {
        return;
      }

      setBusyMediaId(media.id);
      setErrorMessage(null);

      try {
        const signedUrl = await resolveSignedUrl(media);
        setPreviewMedia({
          ...media,
          signedUrl,
        });
      } catch {
        setErrorMessage(t("openFailed"));
      } finally {
        setBusyMediaId((current) => (current === media.id ? null : current));
      }
    },
    [busyMediaId, resolveSignedUrl, t],
  );

  const downloadMedia = useCallback(
    async (media: AdminTaskSubmissionMedia) => {
      if (busyMediaId === media.id) {
        return;
      }

      setBusyMediaId(media.id);
      setErrorMessage(null);

      try {
        if (!supabase) {
          throw new Error("missing_supabase_client");
        }

        const blob = await downloadAdminTaskSubmissionMediaBlob(supabase, media);

        if (typeof window !== "undefined") {
          const objectUrl = window.URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.download = media.original_name;
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
        }
      } catch {
        setErrorMessage(t("downloadFailed"));
      } finally {
        setBusyMediaId((current) => (current === media.id ? null : current));
      }
    },
    [busyMediaId, supabase, t],
  );

  const closePreview = useCallback((open: boolean) => {
    if (!open) {
      setPreviewMedia(null);
    }
  }, []);

  return {
    busyMediaId,
    closePreview,
    downloadMedia,
    errorMessage,
    loadingTaskIds,
    mediaByTaskId,
    openPreview,
    previewMedia,
  };
}
