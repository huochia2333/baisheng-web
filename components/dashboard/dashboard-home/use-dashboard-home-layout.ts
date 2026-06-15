"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { markBrowserCloudSyncActivity } from "@/lib/browser-sync-recovery";
import {
  getCurrentUserHomeWidgetLayout,
  saveUserHomeWidgetLayout,
} from "@/lib/dashboard-home-layouts";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { useWorkspaceSyncEffect } from "../workspace-session-provider";
import {
  cloneDefaultHomeWidgetLayout,
  createHomeWidgetInstance,
  findAvailableHomeWidgetPosition,
  normalizeHomeWidgetCoordinates,
  normalizeHomeWidgetLayout,
  type HomeWidgetInstance,
  type HomeWidgetType,
} from "./dashboard-home-layout";

type UseDashboardHomeLayoutOptions = {
  initialWidgets: unknown;
  scope: string;
};

export function useDashboardHomeLayout({
  initialWidgets,
  scope,
}: UseDashboardHomeLayoutOptions) {
  const supabase = getBrowserSupabaseClient();
  const normalizedInitialWidgets = useMemo(
    () => normalizeHomeWidgetLayout(initialWidgets),
    [initialWidgets],
  );
  const [editing, setEditing] = useState(false);
  const [widgets, setWidgets] = useState<HomeWidgetInstance[]>(() =>
    normalizedInitialWidgets,
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedWidgetsJsonRef = useRef(
    JSON.stringify(normalizedInitialWidgets),
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const widgetsJson = JSON.stringify(widgets);

    if (widgetsJson === lastSavedWidgetsJsonRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveUserHomeWidgetLayout(supabase, scope, widgets)
        .then((layout) => {
          const normalizedWidgets = normalizeHomeWidgetLayout(layout.widgets);

          markBrowserCloudSyncActivity();
          lastSavedWidgetsJsonRef.current = JSON.stringify(normalizedWidgets);
        })
        .catch(() => {
          lastSavedWidgetsJsonRef.current = "";
        });
    }, 250);
  }, [scope, supabase, widgets]);

  const refreshLayout = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase || editing) {
        return;
      }

      const layout = await getCurrentUserHomeWidgetLayout(supabase, scope);

      if (!layout || !isMounted()) {
        return;
      }

      const nextWidgets = normalizeHomeWidgetLayout(layout.widgets);

      lastSavedWidgetsJsonRef.current = JSON.stringify(nextWidgets);
      setWidgets(nextWidgets);
    },
    [editing, scope, supabase],
  );

  useWorkspaceSyncEffect(refreshLayout);

  const addWidget = useCallback((type: HomeWidgetType) => {
    const id = createWidgetId(type);
    let nextWidgetId = id;

    setWidgets((current) => {
      const widget = createHomeWidgetInstance(
        type,
        id,
        findAvailableHomeWidgetPosition(current, getDefaultWidgetSize(type)),
      );

      nextWidgetId = widget.id;

      return normalizeHomeWidgetCoordinates([...current, widget], widget.id);
    });

    return nextWidgetId;
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(cloneDefaultHomeWidgetLayout());
  }, []);

  const updateWidgetLayout = useCallback(
    (
      id: string,
      layout: Pick<HomeWidgetInstance, "height" | "width" | "x" | "y">,
    ) => {
      setWidgets((current) =>
        normalizeHomeWidgetCoordinates(
          current.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  ...layout,
                }
              : widget,
          ),
          id,
        ),
      );
    },
    [],
  );

  const startEditing = useCallback(() => setEditing(true), []);
  const stopEditing = useCallback(() => setEditing(false), []);

  return {
    addWidget,
    editing,
    removeWidget,
    resetWidgets,
    startEditing,
    stopEditing,
    updateWidgetLayout,
    widgets,
  };
}

function getDefaultWidgetSize(type: HomeWidgetType) {
  const widget = createHomeWidgetInstance(type, "preview", { x: 0, y: 0 });

  return {
    height: widget.height,
    width: widget.width,
  };
}

function createWidgetId(type: HomeWidgetType) {
  const randomId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${type}-${randomId}`;
}
