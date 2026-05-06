"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { markBrowserCloudSyncActivity } from "@/lib/browser-sync-recovery";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  WORKSPACE_FEEDBACK_STATUS_OPTIONS,
  WORKSPACE_FEEDBACK_TYPE_OPTIONS,
  isWorkspaceFeedbackStatus,
  isWorkspaceFeedbackType,
  sortWorkspaceFeedback,
  updateWorkspaceFeedbackStatus,
  type AdminWorkspaceFeedbackPageData,
  type WorkspaceFeedbackStatus,
  type WorkspaceFeedbackType,
} from "@/lib/workspace-feedback";

import type { NoticeTone } from "../dashboard-shared-ui";
import {
  feedbackMatchesSearch,
  type AdminFeedbackRoleLabels,
  type AdminFeedbackStatusLabels,
  type AdminFeedbackTypeLabels,
} from "./admin-feedback-display";

type Feedback = { tone: NoticeTone; message: string } | null;
type FilterValue<T extends string> = T | "all";

export function useAdminFeedbackViewModel({
  initialData,
}: {
  initialData: AdminWorkspaceFeedbackPageData;
}) {
  const t = useTranslations("WorkspaceFeedback");
  const supabase = getBrowserSupabaseClient();
  const [feedbackItems, setFeedbackItems] = useState(initialData.feedback);
  const [pageFeedback, setPageFeedback] = useState<Feedback>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<WorkspaceFeedbackStatus>>("all");
  const [typeFilter, setTypeFilter] =
    useState<FilterValue<WorkspaceFeedbackType>>("all");
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const typeLabels = useMemo<AdminFeedbackTypeLabels>(
    () => ({
      bug: t("types.bug"),
      suggestion: t("types.suggestion"),
    }),
    [t],
  );

  const statusLabels = useMemo<AdminFeedbackStatusLabels>(
    () => ({
      declined: t("statuses.declined"),
      in_progress: t("statuses.inProgress"),
      new: t("statuses.new"),
      resolved: t("statuses.resolved"),
    }),
    [t],
  );

  const roleLabels = useMemo<AdminFeedbackRoleLabels>(
    () => ({
      administrator: t("roles.administrator"),
      client: t("roles.client"),
      finance: t("roles.finance"),
      manager: t("roles.manager"),
      operator: t("roles.operator"),
      recruiter: t("roles.recruiter"),
      salesman: t("roles.salesman"),
    }),
    [t],
  );

  const summary = useMemo(
    () => ({
      declined: feedbackItems.filter((item) => item.status === "declined").length,
      inProgress: feedbackItems.filter((item) => item.status === "in_progress")
        .length,
      new: feedbackItems.filter((item) => item.status === "new").length,
      resolved: feedbackItems.filter((item) => item.status === "resolved").length,
      total: feedbackItems.length,
    }),
    [feedbackItems],
  );

  const filteredFeedback = useMemo(
    () =>
      feedbackItems.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        if (typeFilter !== "all" && item.feedback_type !== typeFilter) {
          return false;
        }

        return feedbackMatchesSearch(item, searchText);
      }),
    [feedbackItems, searchText, statusFilter, typeFilter],
  );

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(
      value === "all" || isWorkspaceFeedbackStatus(value) ? value : "all",
    );
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" || isWorkspaceFeedbackType(value) ? value : "all");
  };

  const handleStatusChange = async (
    feedbackId: string,
    nextStatus: WorkspaceFeedbackStatus,
  ) => {
    if (!supabase || pendingStatusId || !isWorkspaceFeedbackStatus(nextStatus)) {
      return;
    }

    setPendingStatusId(feedbackId);
    setPageFeedback(null);

    try {
      const updatedFeedback = await updateWorkspaceFeedbackStatus(
        supabase,
        feedbackId,
        nextStatus,
      );

      markBrowserCloudSyncActivity();
      setFeedbackItems((currentItems) =>
        sortWorkspaceFeedback(
          currentItems.map((item) =>
            item.id === updatedFeedback.id
              ? {
                  ...item,
                  ...updatedFeedback,
                }
              : item,
          ),
        ),
      );
      setPageFeedback({
        tone: "success",
        message: t("feedback.statusSaved"),
      });
    } catch {
      setPageFeedback({
        tone: "error",
        message: t("feedback.statusError"),
      });
    } finally {
      setPendingStatusId(null);
    }
  };

  return {
    feedbackItems,
    filteredFeedback,
    hasPermission: initialData.hasPermission,
    pageFeedback,
    pendingStatusId,
    roleLabels,
    searchText,
    statusFilter,
    statusLabels,
    statusOptions: WORKSPACE_FEEDBACK_STATUS_OPTIONS,
    summary,
    typeFilter,
    typeLabels,
    typeOptions: WORKSPACE_FEEDBACK_TYPE_OPTIONS,
    handleStatusChange,
    handleStatusFilterChange,
    handleTypeFilterChange,
    setSearchText,
  };
}
