"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { paginateDashboardItems } from "@/lib/dashboard-pagination";
import {
  acceptSalesmanTask,
  getTaskAttachmentSignedUrl,
  type SalesmanTasksFilters,
  type SalesmanTasksPageData,
  type SalesmanTasksSearchParams,
  type SalesmanTaskRow,
} from "@/lib/salesman-tasks";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  cancelTaskReviewSubmissionDraft,
  createTaskReviewSubmissionDraft,
  removeStoredTaskReviewSubmissionAssets,
  submitTaskReview,
  uploadTaskReviewSubmissionAssets,
} from "@/lib/task-reviews";
import {
  normalizeSearchText,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  toSalesmanTaskErrorMessage,
} from "@/components/dashboard/tasks/tasks-display";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";

type PageFeedback = { tone: NoticeTone; message: string } | null;

function areSalesmanTasksFiltersEqual(
  left: SalesmanTasksFilters,
  right: SalesmanTasksFilters,
) {
  return (
    left.searchText === right.searchText
    && left.focus === right.focus
  );
}

export function useSalesmanTasksPage({
  initialData,
  initialView,
}: {
  initialData: SalesmanTasksPageData;
  initialView: SalesmanTasksSearchParams;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Tasks.salesman");
  const sharedT = useTranslations("Tasks.shared");
  const [isRefreshing, startRefreshTransition] = useTransition();

  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [filters, setFilters] = useState<SalesmanTasksFilters>(initialView.filters);
  const [page, setPage] = useState(initialView.page);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [attachmentBusyKey, setAttachmentBusyKey] = useState<string | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitDialogTask, setSubmitDialogTask] = useState<SalesmanTaskRow | null>(null);
  const [submitDialogNote, setSubmitDialogNote] = useState("");
  const [submitDialogFiles, setSubmitDialogFiles] = useState<File[]>([]);
  const [submitDialogFeedback, setSubmitDialogFeedback] = useState<PageFeedback>(null);
  const [submitDialogPending, setSubmitDialogPending] = useState(false);

  const deferredSearchText = useDeferredValue(filters.searchText);
  const viewerId = initialData.viewerId;
  const tasks = initialData.tasks;
  const canView = initialData.canView;
  const openTaskCount = useMemo(
    () => tasks.filter((task) => task.status !== "completed").length,
    [tasks],
  );

  useEffect(() => {
    setFilters(initialView.filters);
  }, [initialView.filters]);

  useEffect(() => {
    setPage(initialView.page);
  }, [initialView.page]);

  const refreshTaskBoard = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

  const replaceTasksRoute = useCallback(
    (next: {
      filters?: SalesmanTasksFilters;
      page?: number;
    }) => {
      const nextFilters = next.filters ?? filters;
      const nextPage = next.page ?? page;
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextFilters.searchText) {
        nextParams.set("searchText", nextFilters.searchText);
      } else {
        nextParams.delete("searchText");
      }

      if (nextFilters.focus !== "all") {
        nextParams.set("focus", nextFilters.focus);
      } else {
        nextParams.delete("focus");
      }

      if (nextPage > 1) {
        nextParams.set("page", String(nextPage));
      } else {
        nextParams.delete("page");
      }

      const nextQuery = nextParams.toString();

      startRefreshTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      });
    },
    [filters, page, pathname, router, searchParams, startRefreshTransition],
  );

  useWorkspaceSyncEffect(refreshTaskBoard);

  const summary = useMemo(
    () => ({
      all: openTaskCount,
      available: tasks.filter((task) => task.status === "to_be_accepted").length,
      inProgress: tasks.filter(
        (task) => task.status === "accepted" && task.accepted_by_user_id === viewerId,
      ).length,
      reviewing: tasks.filter(
        (task) => task.status === "reviewing" && task.accepted_by_user_id === viewerId,
      ).length,
      rejected: tasks.filter(
        (task) => task.status === "rejected" && task.accepted_by_user_id === viewerId,
      ).length,
      completed: tasks.filter(
        (task) => task.status === "completed" && task.accepted_by_user_id === viewerId,
      ).length,
    }),
    [openTaskCount, tasks, viewerId],
  );

  const filteredTasks = useMemo(() => {
    const normalizedText = normalizeSearchText(deferredSearchText);

    return tasks.filter((task) => {
      if (filters.focus === "all" && task.status === "completed") {
        return false;
      }

      if (filters.focus === "available" && task.status !== "to_be_accepted") {
        return false;
      }

      if (
        filters.focus === "in_progress"
        && !(task.status === "accepted" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (
        filters.focus === "reviewing"
        && !(task.status === "reviewing" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (
        filters.focus === "rejected"
        && !(task.status === "rejected" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (
        filters.focus === "completed"
        && !(task.status === "completed" && task.accepted_by_user_id === viewerId)
      ) {
        return false;
      }

      if (!normalizedText) {
        return true;
      }

      const searchableText = [
        task.task_name,
        task.task_intro,
        task.task_type_label,
        task.review_reject_reason,
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedText);
    });
  }, [deferredSearchText, filters.focus, tasks, viewerId]);

  const tasksPagination = useMemo(
    () => paginateDashboardItems(filteredTasks, page),
    [filteredTasks, page],
  );

  useEffect(() => {
    if (tasksPagination.page === page) {
      return;
    }

    setPage(tasksPagination.page);

    if (
      areSalesmanTasksFiltersEqual(filters, initialView.filters)
      && initialView.page !== tasksPagination.page
    ) {
      replaceTasksRoute({
        filters,
        page: tasksPagination.page,
      });
    }
  }, [
    filters,
    initialView.filters,
    initialView.page,
    page,
    replaceTasksRoute,
    tasksPagination.page,
  ]);

  useEffect(() => {
    if (areSalesmanTasksFiltersEqual(filters, initialView.filters)) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      replaceTasksRoute({
        filters,
        page: 1,
      });
    }, 250);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [filters, initialView.filters, replaceTasksRoute]);

  const updateFilter = useCallback(
    <Key extends keyof SalesmanTasksFilters>(key: Key, value: SalesmanTasksFilters[Key]) => {
      setPage(1);
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      replaceTasksRoute({
        filters,
        page: nextPage,
      });
    },
    [filters, replaceTasksRoute],
  );

  const goToNextPage = useCallback(() => {
    if (!tasksPagination.hasNextPage) {
      return;
    }

    goToPage(tasksPagination.page + 1);
  }, [goToPage, tasksPagination.hasNextPage, tasksPagination.page]);

  const goToPreviousPage = useCallback(() => {
    if (!tasksPagination.hasPreviousPage) {
      return;
    }

    goToPage(tasksPagination.page - 1);
  }, [goToPage, tasksPagination.hasPreviousPage, tasksPagination.page]);

  const resetSubmitDialog = useCallback(() => {
    setSubmitDialogOpen(false);
    setSubmitDialogTask(null);
    setSubmitDialogNote("");
    setSubmitDialogFiles([]);
    setSubmitDialogFeedback(null);
    setSubmitDialogPending(false);
  }, []);

  const openSubmitDialog = useCallback((task: SalesmanTaskRow) => {
    setSubmitDialogTask(task);
    setSubmitDialogOpen(true);
    setSubmitDialogNote("");
    setSubmitDialogFiles([]);
    setSubmitDialogFeedback(null);
  }, []);

  const handleSubmitDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setSubmitDialogOpen(true);
        return;
      }

      resetSubmitDialog();
    },
    [resetSubmitDialog],
  );

  const handleAcceptTask = useCallback(
    async (taskId: string) => {
      if (!supabase || busyTaskId) {
        return;
      }

      setBusyTaskId(taskId);
      setPageFeedback(null);

      try {
        await acceptSalesmanTask(supabase, taskId);
        setPageFeedback({
          tone: "success",
          message: t("feedback.accepted"),
        });
        refreshTaskBoard();
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        setBusyTaskId(null);
      }
    },
    [busyTaskId, refreshTaskBoard, sharedT, supabase, t],
  );

  const handleSubmitReview = useCallback(async () => {
    if (!supabase || !submitDialogTask || !viewerId || submitDialogPending) {
      return;
    }

    setSubmitDialogPending(true);
    setSubmitDialogFeedback(null);
    setPageFeedback(null);

    let draftId: string | null = null;
    let uploadedAssets: Array<{
      bucket_name: string;
      task_attachment_storage_path: string;
    }> = [];

    try {
      const draft = await createTaskReviewSubmissionDraft(supabase, {
        taskId: submitDialogTask.id,
        submissionNote: submitDialogNote,
      });
      draftId = draft.id;

      const assets = await uploadTaskReviewSubmissionAssets(supabase, {
        submissionId: draft.id,
        uploadedByUserId: viewerId,
        files: submitDialogFiles,
      });

      uploadedAssets = assets;

      await submitTaskReview(supabase, {
        taskId: submitDialogTask.id,
        submissionId: draft.id,
      });

      resetSubmitDialog();
      setPageFeedback({
        tone: "success",
        message:
          submitDialogTask.status === "rejected"
            ? t("feedback.reviewResubmitted")
            : t("feedback.reviewSubmitted"),
      });
      refreshTaskBoard();
    } catch (error) {
      if (uploadedAssets.length > 0) {
        try {
          await removeStoredTaskReviewSubmissionAssets(supabase, uploadedAssets);
        } catch {
          // Best effort rollback for uploaded objects.
        }
      }

      if (draftId) {
        try {
          await cancelTaskReviewSubmissionDraft(supabase, draftId);
        } catch {
          // Best effort rollback for the draft row.
        }
      }

      setSubmitDialogFeedback({
        tone: "error",
        message: toSalesmanTaskErrorMessage(error, sharedT),
      });
    } finally {
      setSubmitDialogPending(false);
    }
  }, [
    refreshTaskBoard,
    resetSubmitDialog,
    sharedT,
    submitDialogFiles,
    submitDialogNote,
    submitDialogPending,
    submitDialogTask,
    supabase,
    t,
    viewerId,
  ]);

  const handleOpenAttachment = useCallback(
    async (taskId: string, attachment: SalesmanTaskRow["attachments"][number]) => {
      if (!supabase) {
        return;
      }

      const busyKey = `${taskId}:${attachment.id}`;
      setAttachmentBusyKey(busyKey);

      try {
        const signedUrl = await getTaskAttachmentSignedUrl(supabase, attachment);
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toSalesmanTaskErrorMessage(error, sharedT),
        });
      } finally {
        setAttachmentBusyKey(null);
      }
    },
    [sharedT, supabase],
  );

  return {
    attachmentBusyKey,
    busyTaskId,
    canView,
    filteredTasks,
    filters,
    goToNextPage,
    goToPreviousPage,
    handleAcceptTask,
    handleOpenAttachment,
    handleSubmitDialogOpenChange,
    handleSubmitReview,
    isRefreshing,
    pageFeedback,
    setSubmitDialogFiles,
    setSubmitDialogNote,
    submitDialogFeedback,
    submitDialogFiles,
    submitDialogNote,
    submitDialogOpen,
    submitDialogPending,
    submitDialogTask,
    summary,
    tasksPagination,
    updateFilter,
    viewerId,
    openSubmitDialog,
  };
}
