"use client";

import type { ReactNode } from "react";

import {
  Bell,
  Clock3,
  KeyRound,
  type LucideIcon,
  ListTodo,
  Megaphone,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  HOME_WIDGET_ROW_UNIT_PX,
  HOME_WIDGET_TYPES,
  type HomeWidgetInstance,
  type HomeWidgetType,
} from "./dashboard-home-layout";
import {
  startHomeWidgetPositionDrag,
  startHomeWidgetResize,
} from "./dashboard-home-widget-interactions";
import { getHomeWidgetResizeCursor } from "./dashboard-home-widget-resize";
import { useDashboardHomeWidgetLayoutAnimation } from "./use-dashboard-home-widget-layout-animation";
import { useDashboardHomeWidgetResizeHandle } from "./use-dashboard-home-widget-resize-handle";

export type HomeCustomizerCopy = {
  addWidget: string;
  done: string;
  edit: string;
  emptyDescription: string;
  emptyTitle: string;
  moveLeft: string;
  moveRight: string;
  removeWidget: string;
  reset: string;
  resizeWidget: string;
  sidebarDescription: string;
  sidebarTitle: string;
  sizeLabel: (width: number, height: number) => string;
  widgets: Record<HomeWidgetType, { description: string; title: string }>;
};

type DashboardHomeWidgetCardProps = {
  children: ReactNode;
  copy: HomeCustomizerCopy;
  deleting: boolean;
  dragging: boolean;
  editing: boolean;
  entering: boolean;
  index: number;
  onDragEnd: () => void;
  onDragStart: () => void;
  onMove: (position: Pick<HomeWidgetInstance, "x" | "y">) => void;
  onRemove: () => void;
  onResize: (
    layout: Pick<HomeWidgetInstance, "height" | "width" | "x" | "y">,
  ) => void;
  onResizeEnd: () => void;
  onResizeStart: () => void;
  resizing: boolean;
  widget: HomeWidgetInstance;
};

const widgetIcons: Record<HomeWidgetType, LucideIcon> = {
  announcements: Megaphone,
  clock: Clock3,
  greeting: Bell,
  invite: KeyRound,
  todos: ListTodo,
};

export function DashboardHomeWidgetCard({
  children,
  copy,
  deleting,
  dragging,
  editing,
  entering,
  index,
  onDragEnd,
  onDragStart,
  onMove,
  onRemove,
  onResize,
  onResizeEnd,
  onResizeStart,
  resizing,
  widget,
}: DashboardHomeWidgetCardProps) {
  const Icon = widgetIcons[widget.type];
  const widgetLabel = copy.widgets[widget.type].title;
  const {
    handleResizePointerLeave,
    handleResizePointerMove,
    resizeHandle,
  } = useDashboardHomeWidgetResizeHandle({
    deleting,
    dragging,
    editing,
    entering,
    resizing,
  });
  const cardRef = useDashboardHomeWidgetLayoutAnimation({
    disabled: !editing || !resizing || deleting || entering,
    resizing,
  });

  return (
    <article
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[24px] border border-white/85 bg-white/76 p-5 shadow-[0_18px_45px_rgba(96,113,128,0.06)] transition-[box-shadow,border-color,opacity] duration-200 will-change-transform",
        editing &&
          !deleting &&
          !entering &&
          !dragging &&
          !resizing &&
          "dashboard-home-wiggle cursor-grab border-[#bfd2e1] bg-white/88 shadow-[0_22px_52px_rgba(72,103,130,0.12)] active:cursor-grabbing",
        editing &&
          (deleting || entering || resizing) &&
          "border-[#bfd2e1] bg-white/88 shadow-[0_22px_52px_rgba(72,103,130,0.12)]",
        deleting && "dashboard-home-widget-exit pointer-events-none",
        dragging && "opacity-60 ring-4 ring-[#bfd2e1]/45",
        entering && "dashboard-home-widget-enter",
        resizing && "dashboard-home-widget-resizing",
      )}
      data-home-widget-id={widget.id}
      data-testid="home-widget-card"
      ref={cardRef}
      onPointerDown={(event) => {
        startHomeWidgetPositionDrag(event, {
          editing,
          onDragEnd,
          onDragStart,
          onMove,
          widget,
        });
      }}
      onPointerLeave={handleResizePointerLeave}
      onPointerMove={handleResizePointerMove}
      style={{
        animationDelay: `${(index % 5) * -45}ms`,
        gridColumn: `${widget.x + 1} / span ${widget.width}`,
        gridRow: `${widget.y + 1} / span ${widget.height}`,
        minHeight: `${widget.height * HOME_WIDGET_ROW_UNIT_PX}px`,
      }}
    >
      {editing ? (
        <>
          <button
            aria-label={copy.removeWidget}
            className="absolute left-1/2 top-3 z-40 inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-[#dfe5ea] bg-white/95 text-[#8a4b4b] shadow-sm transition hover:bg-[#f8e6e6]"
            data-home-widget-control="true"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            title={copy.removeWidget}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
          {resizeHandle ? (
            <button
              aria-label={copy.resizeWidget}
              className={cn(
                "absolute z-30 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#bfd2e1] bg-[#486782] text-white shadow-[0_12px_26px_rgba(72,103,130,0.24)] transition-[opacity,transform,background-color] duration-150 hover:bg-[#3e5f79]",
                getResizeHandleButtonClass(resizeHandle.direction),
                resizeHandle.visible
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0",
              )}
              data-resize-direction={resizeHandle.direction}
              data-home-widget-control="true"
              data-testid="home-widget-resize-handle-active"
              onPointerDown={(event) => {
                startHomeWidgetResize(event, widget, resizeHandle.direction, {
                  onResize,
                  onResizeEnd,
                  onResizeStart,
                });
              }}
              style={{
                cursor: getHomeWidgetResizeCursor(resizeHandle.direction),
                left: `${resizeHandle.left}px`,
                top: `${resizeHandle.top}px`,
              }}
              title={copy.resizeWidget}
              type="button"
            >
              <HomeWidgetResizeHandleMark direction={resizeHandle.direction} />
            </button>
          ) : null}
        </>
      ) : null}

      <div className={cn("h-full min-h-0", editing && "pt-11")}>
        {children}
      </div>

      {editing ? (
        <div className="absolute bottom-3 right-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-[#dfe5ea] bg-white/94 px-3 py-1 text-xs font-semibold text-[#53616d] shadow-sm">
          <Icon className="size-3.5 shrink-0 text-[#486782]" />
          <span className="min-w-0 truncate">{widgetLabel}</span>
          <span className="shrink-0 text-[#7b858d]">
            {copy.sizeLabel(widget.width, widget.height)}
          </span>
        </div>
      ) : null}
    </article>
  );
}

function getResizeHandleButtonClass(direction: string) {
  if (direction === "left" || direction === "right") {
    return "h-12 w-4 rounded-full";
  }

  if (direction === "top" || direction === "bottom") {
    return "h-4 w-12 rounded-full";
  }

  return "size-9 rounded-[14px]";
}

function HomeWidgetResizeHandleMark({
  direction,
}: {
  direction: string;
}) {
  if (direction === "left" || direction === "right") {
    return (
      <span
        aria-hidden="true"
        className="block h-7 w-0.5 rounded-full bg-white/95"
        data-resize-handle-shape="vertical"
      />
    );
  }

  if (direction === "top" || direction === "bottom") {
    return (
      <span
        aria-hidden="true"
        className="block h-0.5 w-7 rounded-full bg-white/95"
        data-resize-handle-shape="horizontal"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block size-4",
        direction === "top-left" && "border-l-2 border-t-2 border-white/95",
        direction === "top-right" && "border-r-2 border-t-2 border-white/95",
        direction === "bottom-right" &&
          "border-b-2 border-r-2 border-white/95",
        direction === "bottom-left" &&
          "border-b-2 border-l-2 border-white/95",
      )}
      data-resize-handle-shape="corner"
    />
  );
}

type DashboardHomeWidgetSidebarProps = {
  copy: HomeCustomizerCopy;
  onAddWidget: (type: HomeWidgetType) => void;
  onReset: () => void;
};

export function DashboardHomeWidgetSidebar({
  copy,
  onAddWidget,
  onReset,
}: DashboardHomeWidgetSidebarProps) {
  return (
    <section
      className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/80 bg-white/72 p-4 shadow-[0_18px_38px_rgba(96,113,128,0.08)]"
      data-testid="home-widget-sidebar"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold text-[#23313a]">
            {copy.sidebarTitle}
          </h3>
          <p className="mt-2 break-words text-sm leading-6 text-[#69747d]">
            {copy.sidebarDescription}
          </p>
        </div>
        <button
          aria-label={copy.reset}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dfe5ea] bg-white text-[#66727d] transition hover:bg-[#edf2f5]"
          onClick={onReset}
          title={copy.reset}
          type="button"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid min-h-0 gap-3 overflow-y-auto pr-1">
        {HOME_WIDGET_TYPES.map((type) => {
          const Icon = widgetIcons[type];

          return (
            <div
              className="rounded-[20px] border border-[#e2e7eb] bg-[#fbfaf8] p-4"
              key={type}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-[#edf2f5] text-[#486782]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-semibold text-[#23313a]">
                    {copy.widgets[type].title}
                  </h4>
                  <p className="mt-1 break-words text-xs leading-5 text-[#69747d]">
                    {copy.widgets[type].description}
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 h-10 w-full rounded-[16px] bg-[#486782] text-white hover:bg-[#3e5f79]"
                onClick={() => onAddWidget(type)}
                type="button"
              >
                <Plus className="size-4" />
                {copy.addWidget}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
