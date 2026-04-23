"use client";

import { useCallback, useState } from "react";

import {
  type AdminTasksPageData,
  type AdminTasksSearchParams,
} from "@/lib/admin-tasks";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import {
  type PageFeedback,
  type PageFeedbackValue,
} from "./admin-tasks-view-model-shared";
import { useAdminTaskAssignmentDialog } from "./use-admin-task-assignment-dialog";
import { useAdminTaskCreateDialog } from "./use-admin-task-create-dialog";
import { useAdminTaskDeleteAction } from "./use-admin-task-delete-action";
import { useAdminTasksRouteState } from "./use-admin-tasks-route-state";

export function useAdminTasksViewModel({
  initialData,
  initialView,
}: {
  initialData: AdminTasksPageData;
  initialView: AdminTasksSearchParams;
}) {
  const supabase = getBrowserSupabaseClient();
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const routeState = useAdminTasksRouteState({ initialData, initialView });

  const handlePageFeedback = useCallback((feedback: PageFeedbackValue) => {
    setPageFeedback(feedback);
  }, []);

  const { canView, refreshTaskBoard } = routeState;

  const handleRefresh = () => {
    if (!canView) {
      return;
    }

    setPageFeedback(null);
    refreshTaskBoard();
  };

  const createDialog = useAdminTaskCreateDialog({
    canView: routeState.canView,
    onPageFeedback: handlePageFeedback,
    refreshTaskBoard: routeState.refreshTaskBoard,
    supabase,
    taskTypeOptions: routeState.taskTypeOptions,
    viewerId: routeState.viewerId,
  });
  const assignmentDialog = useAdminTaskAssignmentDialog({
    onPageFeedback: handlePageFeedback,
    refreshTaskBoard: routeState.refreshTaskBoard,
    supabase,
    tasks: routeState.tasks,
  });
  const deleteAction = useAdminTaskDeleteAction({
    onPageFeedback: handlePageFeedback,
    refreshTaskBoard: routeState.refreshTaskBoard,
    supabase,
  });

  return {
    ...assignmentDialog,
    ...createDialog,
    ...deleteAction,
    ...routeState,
    handleRefresh,
    pageFeedback,
  };
}
