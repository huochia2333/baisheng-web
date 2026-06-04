"use client";

export type HomeWidgetType =
  | "greeting"
  | "clock"
  | "announcements"
  | "todos"
  | "invite";

export type HomeWidgetInstance = {
  height: number;
  id: string;
  type: HomeWidgetType;
  width: number;
  x: number;
  y: number;
};

export const HOME_WIDGET_GRID_COLUMNS = 5;
export const HOME_WIDGET_MAX_SIZE = 5;
export const HOME_WIDGET_MIN_SIZE = 1;
export const HOME_WIDGET_ROW_UNIT_PX = 112;

export const HOME_WIDGET_TYPES: readonly HomeWidgetType[] = [
  "greeting",
  "clock",
  "invite",
  "announcements",
  "todos",
];

const DEFAULT_WIDGET_SIZE: Record<
  HomeWidgetType,
  Pick<HomeWidgetInstance, "height" | "width">
> = {
  announcements: { height: 3, width: 2 },
  clock: { height: 2, width: 2 },
  greeting: { height: 2, width: 5 },
  invite: { height: 2, width: 2 },
  todos: { height: 4, width: 3 },
};

export const DEFAULT_HOME_WIDGET_LAYOUT: readonly HomeWidgetInstance[] = [
  {
    ...DEFAULT_WIDGET_SIZE.greeting,
    id: "home-greeting",
    type: "greeting",
    x: 0,
    y: 0,
  },
  {
    ...DEFAULT_WIDGET_SIZE.invite,
    id: "home-invite",
    type: "invite",
    x: 0,
    y: 2,
  },
  {
    ...DEFAULT_WIDGET_SIZE.clock,
    id: "home-clock",
    type: "clock",
    x: 0,
    y: 4,
  },
  {
    ...DEFAULT_WIDGET_SIZE.announcements,
    id: "home-announcements",
    type: "announcements",
    x: 0,
    y: 6,
  },
  {
    ...DEFAULT_WIDGET_SIZE.todos,
    id: "home-todos",
    type: "todos",
    x: 2,
    y: 2,
  },
];

export function createHomeWidgetInstance(
  type: HomeWidgetType,
  id: string,
  position: Pick<HomeWidgetInstance, "x" | "y">,
): HomeWidgetInstance {
  return {
    ...DEFAULT_WIDGET_SIZE[type],
    id,
    ...position,
    type,
  };
}

export function clampHomeWidgetSize(value: number) {
  if (!Number.isFinite(value)) {
    return HOME_WIDGET_MIN_SIZE;
  }

  return Math.min(
    HOME_WIDGET_MAX_SIZE,
    Math.max(HOME_WIDGET_MIN_SIZE, Math.round(value)),
  );
}

export function cloneDefaultHomeWidgetLayout() {
  return DEFAULT_HOME_WIDGET_LAYOUT.map((widget) => ({ ...widget }));
}

export function normalizeHomeWidgetLayout(value: unknown) {
  if (!Array.isArray(value)) {
    return cloneDefaultHomeWidgetLayout();
  }

  const seenIds = new Set<string>();
  const widgets: HomeWidgetInstance[] = [];

  value.forEach((item) => {
    if (!isHomeWidgetRecord(item) || !isHomeWidgetType(item.type)) {
      return;
    }

    const id = item.id.trim();

    if (!id || seenIds.has(id)) {
      return;
    }

    const width = clampHomeWidgetSize(item.width);
    const height = clampHomeWidgetSize(item.height);
    const hasSavedPosition =
      typeof item.x === "number" && typeof item.y === "number";
    const position = hasSavedPosition
      ? {
          x: clampHomeWidgetX(item.x, width),
          y: clampHomeWidgetY(item.y),
        }
      : findAvailableHomeWidgetPosition(widgets, { height, width });

    seenIds.add(id);
    widgets.push({
      height,
      id,
      type: item.type,
      width,
      ...position,
    });
  });

  return normalizeHomeWidgetCoordinates(widgets);
}

export function findAvailableHomeWidgetPosition(
  widgets: readonly HomeWidgetInstance[],
  size: Pick<HomeWidgetInstance, "height" | "width">,
) {
  const width = clampHomeWidgetSize(size.width);
  const height = clampHomeWidgetSize(size.height);

  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x <= HOME_WIDGET_GRID_COLUMNS - width; x += 1) {
      const candidate = { height, width, x, y };

      if (!widgets.some((widget) => doWidgetsOverlap(widget, candidate))) {
        return { x, y };
      }
    }
  }

  return {
    x: 0,
    y: widgets.reduce(
      (maxY, widget) => Math.max(maxY, widget.y + widget.height),
      0,
    ),
  };
}

export function normalizeHomeWidgetCoordinates(
  widgets: readonly HomeWidgetInstance[],
  pinnedWidgetId?: string,
) {
  const normalized = widgets.map((widget) => {
    const width = clampHomeWidgetSize(widget.width);
    const height = clampHomeWidgetSize(widget.height);

    return {
      ...widget,
      height,
      width,
      x: clampHomeWidgetX(widget.x, width),
      y: clampHomeWidgetY(widget.y),
    };
  });
  const byId = new Map<string, HomeWidgetInstance>();
  const placed: HomeWidgetInstance[] = [];
  const pinnedWidget = pinnedWidgetId
    ? normalized.find((widget) => widget.id === pinnedWidgetId)
    : null;

  if (pinnedWidget) {
    byId.set(pinnedWidget.id, pinnedWidget);
    placed.push(pinnedWidget);
  }

  normalized.forEach((widget) => {
    if (widget.id === pinnedWidgetId) {
      return;
    }

    const nextWidget = findNonOverlappingWidget(widget, placed);
    byId.set(nextWidget.id, nextWidget);
    placed.push(nextWidget);
  });

  return normalized.map((widget) => byId.get(widget.id) ?? widget);
}

export function clampHomeWidgetX(value: number, width: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    HOME_WIDGET_GRID_COLUMNS - width,
    Math.max(0, Math.round(value)),
  );
}

export function clampHomeWidgetY(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function findNonOverlappingWidget(
  widget: HomeWidgetInstance,
  placed: readonly HomeWidgetInstance[],
) {
  let nextWidget = { ...widget };

  while (placed.some((placedWidget) => doWidgetsOverlap(placedWidget, nextWidget))) {
    nextWidget = {
      ...nextWidget,
      y: nextWidget.y + 1,
    };
  }

  return nextWidget;
}

function doWidgetsOverlap(
  first: Pick<HomeWidgetInstance, "height" | "width" | "x" | "y">,
  second: Pick<HomeWidgetInstance, "height" | "width" | "x" | "y">,
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function isHomeWidgetRecord(
  value: unknown,
): value is HomeWidgetInstance {
  return (
    typeof value === "object" &&
    value !== null &&
    "height" in value &&
    "id" in value &&
    "type" in value &&
    "width" in value &&
    typeof value.height === "number" &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.width === "number"
  );
}

function isHomeWidgetType(value: string): value is HomeWidgetType {
  return HOME_WIDGET_TYPES.includes(value as HomeWidgetType);
}
