"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Check, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkspaceCustomizationSidebar } from "@/components/dashboard/workspace-customization-sidebar";
import type { DashboardHomePageData } from "@/lib/dashboard-home";
import { cn } from "@/lib/utils";

import { useDashboardHomeLayout } from "./use-dashboard-home-layout";
import { useDashboardHomeTodos } from "./use-dashboard-home-todos";
import type { HomeTodoCopy } from "./dashboard-home-todo-display";
import {
  HOME_WIDGET_ROW_UNIT_PX,
  type HomeWidgetType,
} from "./dashboard-home-layout";
import {
  DashboardHomeWidgetCard,
  DashboardHomeWidgetSidebar,
  type HomeCustomizerCopy,
} from "./dashboard-home-widget-card";
import {
  DashboardHomeWidgetContent,
  type DashboardHomeWidgetCopy,
} from "./dashboard-home-widget-content";

type DashboardHomeCustomizerProps = {
  copy: DashboardHomeWidgetCopy;
  customizerCopy: HomeCustomizerCopy;
  initialData: DashboardHomePageData;
  locale: string;
  todoCopy: HomeTodoCopy;
};

export function DashboardHomeCustomizer({
  copy,
  customizerCopy,
  initialData,
  locale,
  todoCopy,
}: DashboardHomeCustomizerProps) {
  const layout = useDashboardHomeLayout({
    initialWidgets: initialData.homeWidgetLayout,
    scope: initialData.layoutScope,
  });
  const {
    addWidget,
    editing,
    removeWidget,
    resetWidgets,
    startEditing,
    stopEditing,
    updateWidgetLayout,
    widgets,
  } = layout;
  const todoState = useDashboardHomeTodos({
    copy: todoCopy,
    initialTodos: initialData.todos,
  });
  const animationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [enteringWidgetId, setEnteringWidgetId] = useState<string | null>(null);
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null);
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
  const setWorkspaceSidebar = useWorkspaceCustomizationSidebar();

  const clearAnimatedStateLater = useCallback(
    (callback: () => void, delay = 260) => {
      const timer = setTimeout(callback, delay);
      animationTimersRef.current.push(timer);
    },
    [],
  );

  useEffect(
    () => () => {
      animationTimersRef.current.forEach((timer) => clearTimeout(timer));
      animationTimersRef.current = [];
    },
    [],
  );

  const handleAddWidget = useCallback(
    (type: HomeWidgetType) => {
      const widgetId = addWidget(type);

      setEnteringWidgetId(widgetId);
      clearAnimatedStateLater(() => setEnteringWidgetId(null), 340);
    },
    [addWidget, clearAnimatedStateLater],
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      if (deletingWidgetId) {
        return;
      }

      setDeletingWidgetId(widgetId);
      clearAnimatedStateLater(() => {
        removeWidget(widgetId);
        setDeletingWidgetId(null);
      }, 240);
    },
    [clearAnimatedStateLater, deletingWidgetId, removeWidget],
  );

  useEffect(() => {
    if (!editing) {
      setWorkspaceSidebar(null);
      return;
    }

    setWorkspaceSidebar(
      <DashboardHomeWidgetSidebar
        copy={customizerCopy}
        onAddWidget={handleAddWidget}
        onReset={resetWidgets}
      />,
    );

    return () => {
      setWorkspaceSidebar(null);
    };
  }, [
    customizerCopy,
    editing,
    handleAddWidget,
    resetWidgets,
    setWorkspaceSidebar,
  ]);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-5">
      <div className="flex justify-end">
        {editing ? (
          <Button
            className="h-11 rounded-[16px] bg-[#486782] px-4 text-white hover:bg-[#3e5f79]"
            data-testid="home-edit-done-button"
            onClick={stopEditing}
            type="button"
          >
            <Check className="size-4" />
            {customizerCopy.done}
          </Button>
        ) : (
          <Button
            className="h-11 rounded-[16px] border border-[#dfe5ea] bg-white/80 px-4 text-[#23313a] hover:bg-[#edf2f5]"
            data-testid="home-edit-button"
            onClick={startEditing}
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            {customizerCopy.edit}
          </Button>
        )}
      </div>

      <div className="relative min-w-0">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-2 rounded-[30px] border-2 border-dashed border-[#d44d4d] opacity-0 transition-opacity duration-200",
            editing && "opacity-100",
          )}
          data-testid="home-widget-placement-boundary"
        />
        <div
          className="grid min-w-0 grid-cols-5 gap-4 sm:gap-5"
          data-testid="home-widget-grid"
          style={{ gridAutoRows: `${HOME_WIDGET_ROW_UNIT_PX}px` }}
        >
          {widgets.length === 0 ? (
            <div className="col-span-5 rounded-[24px] border border-dashed border-[#bfd2e1] bg-white/68 p-8 text-center">
              <h2 className="text-xl font-bold text-[#23313a]">
                {customizerCopy.emptyTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md break-words text-sm leading-7 text-[#69747d]">
                {customizerCopy.emptyDescription}
              </p>
            </div>
          ) : (
            widgets.map((widget, index) => (
              <DashboardHomeWidgetCard
                copy={customizerCopy}
                deleting={deletingWidgetId === widget.id}
                dragging={draggingWidgetId === widget.id}
                editing={editing}
                entering={enteringWidgetId === widget.id}
                index={index}
                key={widget.id}
                onDragEnd={() => setDraggingWidgetId(null)}
                onDragStart={() => setDraggingWidgetId(widget.id)}
                onMove={(position) => {
                  updateWidgetLayout(widget.id, {
                    ...widget,
                    ...position,
                  });
                  setDraggingWidgetId(null);
                }}
                onRemove={() => handleRemoveWidget(widget.id)}
                onResize={(layout) => updateWidgetLayout(widget.id, layout)}
                onResizeEnd={() => setResizingWidgetId(null)}
                onResizeStart={() => setResizingWidgetId(widget.id)}
                resizing={resizingWidgetId === widget.id}
                widget={widget}
              >
                <DashboardHomeWidgetContent
                  announcements={initialData.announcements}
                  businessBoards={initialData.businessBoards}
                  copy={copy}
                  displayName={initialData.displayName}
                  greetingPeriod={initialData.greetingPeriod}
                  locale={locale}
                  referralCode={initialData.referralCode}
                  role={initialData.role}
                  todoCopy={todoCopy}
                  todoState={todoState}
                  widget={widget}
                />
              </DashboardHomeWidgetCard>
            ))
          )}
        </div>
      </div>

      {editing ? (
        <div className="md:hidden">
          <DashboardHomeWidgetSidebar
            copy={customizerCopy}
            onAddWidget={handleAddWidget}
            onReset={resetWidgets}
          />
        </div>
      ) : null}
    </section>
  );
}
