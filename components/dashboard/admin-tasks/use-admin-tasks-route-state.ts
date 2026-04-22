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

import {
  type AdminTasksFilters,
  type AdminTasksPageData,
  type AdminTasksSearchParams,
} from "@/lib/admin-tasks";
import { paginateDashboardItems } from "@/lib/dashboard-pagination";

import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";
import {
  normalizeSearchText,
} from "@/components/dashboard/dashboard-shared-ui";
import {
  resolveTaskActorLabel,
} from "@/components/dashboard/tasks/tasks-display";

import {
  areAdminTaskFiltersEqual,
  type AdminTasksStats,
} from "./admin-tasks-view-model-shared";

export function useAdminTasksRouteState({
  initialData,
  initialView,
}: {
  initialData: AdminTasksPageData;
  initialView: AdminTasksSearchParams;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedT = useTranslations("Tasks.shared");
  const [isRefreshing, startRefreshTransition] = useTransition();

  const viewerId = initialData.viewerId;
  const tasks = initialData.tasks;
  const teamOptions = initialData.teamOptions;
  const canView = initialData.canView;

  const routeStateKey = useMemo(
    () =>
      [
        initialView.page,
        initialView.filters.searchText,
        initialView.filters.scope,
        initialView.filters.status,
        initialView.filters.teamId,
      ].join("|"),
    [
      initialView.filters.scope,
      initialView.filters.searchText,
      initialView.filters.status,
      initialView.filters.teamId,
      initialView.page,
    ],
  );
  const [draftState, setDraftState] = useState(() => ({
    filters: initialView.filters,
    page: initialView.page,
    routeStateKey,
  }));
  const usingStaleDraft = draftState.routeStateKey !== routeStateKey;
  const filters = usingStaleDraft ? initialView.filters : draftState.filters;
  const page = usingStaleDraft ? initialView.page : draftState.page;
  const deferredSearchText = useDeferredValue(filters.searchText);

  const refreshTaskBoard = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

  const replaceTasksRoute = useCallback(
    (next: {
      filters?: AdminTasksFilters;
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

      if (nextFilters.status !== "all") {
        nextParams.set("status", nextFilters.status);
      } else {
        nextParams.delete("status");
      }

      if (nextFilters.scope !== "all") {
        nextParams.set("scope", nextFilters.scope);
      } else {
        nextParams.delete("scope");
      }

      if (nextFilters.teamId !== "all") {
        nextParams.set("teamId", nextFilters.teamId);
      } else {
        nextParams.delete("teamId");
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

  const stats = useMemo<AdminTasksStats>(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "to_be_accepted").length,
      accepted: tasks.filter((task) => task.status === "accepted").length,
      completed: tasks.filter((task) => task.status === "completed").length,
      teamScoped: tasks.filter((task) => task.scope === "team").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearchText = normalizeSearchText(deferredSearchText);

    return tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      if (filters.scope !== "all" && task.scope !== filters.scope) {
        return false;
      }

      if (filters.teamId !== "all" && task.team_id !== filters.teamId) {
        return false;
      }

      if (!normalizedSearchText) {
        return true;
      }

      const searchableText = [
        task.task_name,
        task.task_intro,
        resolveTaskActorLabel(task.creator, task.created_by_user_id, sharedT),
        task.creator?.email,
        resolveTaskActorLabel(task.accepted_by, task.accepted_by_user_id, sharedT),
        task.accepted_by?.email,
        task.team?.team_name,
      ]
        .map((value) => normalizeSearchText(value))
        .filter(Boolean)
        .join(" ");

      return searchableText.includes(normalizedSearchText);
    });
  }, [deferredSearchText, filters.scope, filters.status, filters.teamId, sharedT, tasks]);

  const tasksPagination = useMemo(
    () => paginateDashboardItems(filteredTasks, page),
    [filteredTasks, page],
  );

  useEffect(() => {
    if (tasksPagination.page === page) {
      return;
    }

    if (
      areAdminTaskFiltersEqual(filters, initialView.filters) &&
      initialView.page !== tasksPagination.page
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
    if (areAdminTaskFiltersEqual(filters, initialView.filters)) {
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
    <Key extends keyof AdminTasksFilters>(
      key: Key,
      value: AdminTasksFilters[Key],
    ) => {
      setDraftState({
        filters: {
          ...filters,
          [key]: value,
        },
        page: 1,
        routeStateKey,
      });
    },
    [filters, routeStateKey],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      setDraftState({
        filters,
        page: nextPage,
        routeStateKey,
      });
      replaceTasksRoute({
        filters,
        page: nextPage,
      });
    },
    [filters, replaceTasksRoute, routeStateKey],
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

  return {
    canView,
    filteredTasks,
    filters,
    goToNextPage,
    goToPreviousPage,
    isRefreshing,
    refreshTaskBoard,
    stats,
    tasks,
    tasksPagination,
    teamOptions,
    updateFilter,
    viewerId,
  };
}
