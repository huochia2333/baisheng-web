import {
  getWorkspaceBasePath,
  type AppRole,
  type WorkspaceBasePath,
} from "./auth-routing";
import {
  getWorkspaceBusinessNavGroups,
  getWorkspaceBusinessPageVariants,
  getWorkspaceWholesalePageVariants,
  workspaceBusinessKeys,
  workspaceWholesaleSectionKeys,
  type WorkspaceBusinessKey,
  type WorkspaceBusinessLabelKey,
  type WorkspaceBusinessPageVariants,
  type WorkspaceGlobalNavSegment,
  type WorkspaceNavGroup,
  type WorkspaceNavItem,
  type WorkspaceNavLabelKey,
  type WorkspaceNavSegment,
  type WorkspaceWholesaleSectionKey,
} from "./workspace-business-modules";
import {
  workspaceRouteSegments,
  type WorkspaceLoadingTitleKey,
  type WorkspaceRouteSegment,
} from "./workspace-route-segments";

export { workspaceBusinessKeys, workspaceRouteSegments, workspaceWholesaleSectionKeys };
export type {
  WorkspaceBusinessKey,
  WorkspaceBusinessLabelKey,
  WorkspaceGlobalNavSegment,
  WorkspaceLoadingTitleKey,
  WorkspaceNavGroup,
  WorkspaceNavItem,
  WorkspaceNavLabelKey,
  WorkspaceNavSegment,
  WorkspaceRouteSegment,
  WorkspaceWholesaleSectionKey,
};

export type WorkspacePageVariants = WorkspaceBusinessPageVariants & {
  accounts?: true;
  announcements?: true;
  feedback?: true;
  settings?: true;
};

export type WorkspaceRouteConfig = {
  authRole: AppRole;
  basePath: WorkspaceBasePath;
  globalNavItems: readonly WorkspaceNavItem[];
  initials: string;
  navGroups: readonly WorkspaceNavGroup[];
  pageVariants: WorkspacePageVariants;
  routeSegment: WorkspaceRouteSegment;
  wholesalePageVariants?: Partial<Record<WorkspaceWholesaleSectionKey, true>>;
};

const homeNavItems = [
  { segment: "home", labelKey: "home" },
] as const satisfies readonly WorkspaceNavItem[];

const adminGlobalNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "accounts", labelKey: "accounts" },
  { segment: "announcements", labelKey: "announcements" },
  { segment: "feedback", labelKey: "feedback" },
  { segment: "settings", labelKey: "settings" },
] as const satisfies readonly WorkspaceNavItem[];

function createWorkspaceRouteConfig({
  authRole,
  basePath,
  globalNavItems = homeNavItems,
  initials,
  routeSegment,
  globalPageVariants = {},
}: {
  authRole: AppRole;
  basePath: WorkspaceBasePath;
  globalNavItems?: readonly WorkspaceNavItem[];
  globalPageVariants?: Pick<
    WorkspacePageVariants,
    "accounts" | "announcements" | "feedback" | "settings"
  >;
  initials: string;
  routeSegment: WorkspaceRouteSegment;
}): WorkspaceRouteConfig {
  return {
    authRole,
    basePath,
    globalNavItems,
    initials,
    navGroups: getWorkspaceBusinessNavGroups(routeSegment),
    pageVariants: {
      ...globalPageVariants,
      ...getWorkspaceBusinessPageVariants(routeSegment),
    },
    routeSegment,
    wholesalePageVariants: getWorkspaceWholesalePageVariants(routeSegment),
  };
}

const WORKSPACE_ROUTE_CONFIG_BY_SEGMENT = {
  admin: createWorkspaceRouteConfig({
    authRole: "administrator",
    basePath: "/admin",
    globalNavItems: adminGlobalNavItems,
    globalPageVariants: {
      accounts: true,
      announcements: true,
      feedback: true,
      settings: true,
    },
    initials: "AD",
    routeSegment: "admin",
  }),
  client: createWorkspaceRouteConfig({
    authRole: "client",
    basePath: "/client",
    initials: "CL",
    routeSegment: "client",
  }),
  finance: createWorkspaceRouteConfig({
    authRole: "finance",
    basePath: "/finance",
    initials: "FN",
    routeSegment: "finance",
  }),
  manager: createWorkspaceRouteConfig({
    authRole: "manager",
    basePath: "/manager",
    initials: "MG",
    routeSegment: "manager",
  }),
  operator: createWorkspaceRouteConfig({
    authRole: "operator",
    basePath: "/operator",
    initials: "OP",
    routeSegment: "operator",
  }),
  recruiter: createWorkspaceRouteConfig({
    authRole: "recruiter",
    basePath: "/recruiter",
    initials: "RC",
    routeSegment: "recruiter",
  }),
  salesman: createWorkspaceRouteConfig({
    authRole: "salesman",
    basePath: "/salesman",
    initials: "YW",
    routeSegment: "salesman",
  }),
  promoter: createWorkspaceRouteConfig({
    authRole: "promoter",
    basePath: "/promoter",
    initials: "DT",
    routeSegment: "promoter",
  }),
} as const satisfies Record<WorkspaceRouteSegment, WorkspaceRouteConfig>;

const WORKSPACE_ROUTE_CONFIG_BY_BASE_PATH = {
  "/admin": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.admin,
  "/client": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.client,
  "/finance": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.finance,
  "/manager": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.manager,
  "/operator": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.operator,
  "/promoter": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.promoter,
  "/recruiter": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.recruiter,
  "/salesman": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.salesman,
} as const satisfies Record<WorkspaceBasePath, WorkspaceRouteConfig>;

const workspaceRouteSegmentSet = new Set<string>(workspaceRouteSegments);
const workspaceBusinessKeySet = new Set<string>(workspaceBusinessKeys);
const workspaceWholesaleSectionKeySet = new Set<string>(workspaceWholesaleSectionKeys);
const workspaceGlobalNavSegmentSet = new Set<string>([
  "accounts",
  "announcements",
  "feedback",
  "home",
  "my",
  "settings",
]);

export function isWorkspaceRouteSegment(value: string): value is WorkspaceRouteSegment {
  return workspaceRouteSegmentSet.has(value);
}

export function isWorkspaceBusinessKey(value: string): value is WorkspaceBusinessKey {
  return workspaceBusinessKeySet.has(value);
}

export function isWorkspaceWholesaleSectionKey(
  value: string,
): value is WorkspaceWholesaleSectionKey {
  return workspaceWholesaleSectionKeySet.has(value);
}

export function isWorkspaceGlobalNavSegment(
  value: string,
): value is WorkspaceGlobalNavSegment {
  return workspaceGlobalNavSegmentSet.has(value);
}

export function getWorkspaceConfigByRouteSegment(
  value: string,
): WorkspaceRouteConfig | null {
  if (!isWorkspaceRouteSegment(value)) {
    return null;
  }

  return WORKSPACE_ROUTE_CONFIG_BY_SEGMENT[value];
}

export function getWorkspaceConfigByBasePath(
  basePath: string | null,
): WorkspaceRouteConfig | null {
  if (!basePath) {
    return null;
  }

  return WORKSPACE_ROUTE_CONFIG_BY_BASE_PATH[basePath as WorkspaceBasePath] ?? null;
}

export function getWorkspaceConfigForPathname(pathname: string) {
  return getWorkspaceConfigByBasePath(getWorkspaceBasePath(pathname));
}

export function getWorkspaceNavHref(
  configOrSegment: WorkspaceRouteConfig | WorkspaceRouteSegment,
  segment: WorkspaceNavSegment,
) {
  const config =
    typeof configOrSegment === "string"
      ? WORKSPACE_ROUTE_CONFIG_BY_SEGMENT[configOrSegment]
      : configOrSegment;

  if (isWorkspaceGlobalNavSegment(segment)) {
    return `${config.basePath}/${segment}`;
  }

  return getWorkspaceBusinessNavHref(config, "tourism", segment);
}

export function getWorkspaceBusinessNavHref(
  configOrSegment: WorkspaceRouteConfig | WorkspaceRouteSegment,
  business: WorkspaceBusinessKey,
  segment: WorkspaceNavSegment,
) {
  const config =
    typeof configOrSegment === "string"
      ? WORKSPACE_ROUTE_CONFIG_BY_SEGMENT[configOrSegment]
      : configOrSegment;

  if (isWorkspaceGlobalNavSegment(segment)) {
    return `${config.basePath}/${segment}`;
  }

  return `${config.basePath}/${business}/${segment}`;
}

export function getWorkspaceHomeHref(
  configOrSegment: WorkspaceRouteConfig | WorkspaceRouteSegment,
) {
  return getWorkspaceNavHref(configOrSegment, "home");
}
