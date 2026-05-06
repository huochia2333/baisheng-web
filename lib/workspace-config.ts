import {
  getWorkspaceBasePath,
  type AppRole,
  type WorkspaceBasePath,
} from "./auth-routing";
import type { WorkspaceSectionKey } from "./workspace-sections";

export const workspaceRouteSegments = [
  "admin",
  "salesman",
  "recruiter",
  "manager",
  "operator",
  "finance",
  "client",
] as const;

export type WorkspaceRouteSegment = (typeof workspaceRouteSegments)[number];

export type WorkspaceLoadingTitleKey = WorkspaceRouteSegment;

export type WorkspaceNavSegment = "home" | "my" | WorkspaceSectionKey;

export type WorkspaceNavLabelKey =
  | "announcements"
  | "home"
  | "my"
  | "orders"
  | "people"
  | "referrals"
  | "team"
  | "commission"
  | "exchangeRates"
  | "feedback"
  | "tasks"
  | "reviews";

export type WorkspaceOrdersPageMode = "admin" | "salesman" | "client";
export type WorkspaceCommissionPageMode = "admin" | "salesman";
export type WorkspaceExchangeRatesMode = "manage" | "readonly";
export type WorkspaceTasksPageMode = "admin" | "salesman";

export type WorkspaceNavItem = {
  segment: WorkspaceNavSegment;
  labelKey: WorkspaceNavLabelKey;
};

export type WorkspacePageVariants = {
  announcements?: true;
  commission?: WorkspaceCommissionPageMode;
  exchangeRates?: WorkspaceExchangeRatesMode;
  feedback?: true;
  orders?: WorkspaceOrdersPageMode;
  people?: true;
  referrals?: true;
  reviews?: true;
  tasks?: WorkspaceTasksPageMode;
  team?: true;
};

export type WorkspaceRouteConfig = {
  authRole: AppRole;
  basePath: WorkspaceBasePath;
  initials: string;
  navItems: readonly WorkspaceNavItem[];
  pageVariants: WorkspacePageVariants;
  routeSegment: WorkspaceRouteSegment;
};

const managerNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
] as const satisfies readonly WorkspaceNavItem[];

const staffReadNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
] as const satisfies readonly WorkspaceNavItem[];

const financeNavItems = [
  ...staffReadNavItems,
  { segment: "commission", labelKey: "commission" },
] as const satisfies readonly WorkspaceNavItem[];

const clientNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
] as const satisfies readonly WorkspaceNavItem[];

const recruiterNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "referrals", labelKey: "referrals" },
] as const satisfies readonly WorkspaceNavItem[];

const sharedNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "commission", labelKey: "commission" },
  { segment: "exchange-rates", labelKey: "exchangeRates" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const adminNavItems = [
  { segment: "home", labelKey: "home" },
  { segment: "announcements", labelKey: "announcements" },
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "people", labelKey: "people" },
  { segment: "commission", labelKey: "commission" },
  { segment: "tasks", labelKey: "tasks" },
  { segment: "reviews", labelKey: "reviews" },
  { segment: "feedback", labelKey: "feedback" },
] as const satisfies readonly WorkspaceNavItem[];

const WORKSPACE_ROUTE_CONFIG_BY_SEGMENT = {
  admin: {
    authRole: "administrator",
    basePath: "/admin",
    initials: "AD",
    navItems: adminNavItems,
    pageVariants: {
      announcements: true,
      commission: "admin",
      exchangeRates: "manage",
      feedback: true,
      orders: "admin",
      people: true,
      referrals: true,
      reviews: true,
      tasks: "admin",
      team: true,
    },
    routeSegment: "admin",
  },
  client: {
    authRole: "client",
    basePath: "/client",
    initials: "CL",
    navItems: clientNavItems,
    pageVariants: {
      orders: "client",
      referrals: true,
    },
    routeSegment: "client",
  },
  finance: {
    authRole: "finance",
    basePath: "/finance",
    initials: "FN",
    navItems: financeNavItems,
    pageVariants: {
      commission: "admin",
      referrals: true,
      team: true,
    },
    routeSegment: "finance",
  },
  manager: {
    authRole: "manager",
    basePath: "/manager",
    initials: "MG",
    navItems: managerNavItems,
    pageVariants: {
      referrals: true,
      team: true,
    },
    routeSegment: "manager",
  },
  operator: {
    authRole: "operator",
    basePath: "/operator",
    initials: "OP",
    navItems: staffReadNavItems,
    pageVariants: {
      referrals: true,
      team: true,
    },
    routeSegment: "operator",
  },
  recruiter: {
    authRole: "recruiter",
    basePath: "/recruiter",
    initials: "RC",
    navItems: recruiterNavItems,
    pageVariants: {
      referrals: true,
    },
    routeSegment: "recruiter",
  },
  salesman: {
    authRole: "salesman",
    basePath: "/salesman",
    initials: "YW",
    navItems: sharedNavItems,
    pageVariants: {
      commission: "salesman",
      exchangeRates: "readonly",
      orders: "salesman",
      referrals: true,
      tasks: "salesman",
      team: true,
    },
    routeSegment: "salesman",
  },
} as const satisfies Record<WorkspaceRouteSegment, WorkspaceRouteConfig>;

const WORKSPACE_ROUTE_CONFIG_BY_BASE_PATH = {
  "/admin": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.admin,
  "/client": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.client,
  "/finance": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.finance,
  "/manager": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.manager,
  "/operator": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.operator,
  "/recruiter": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.recruiter,
  "/salesman": WORKSPACE_ROUTE_CONFIG_BY_SEGMENT.salesman,
} as const satisfies Record<WorkspaceBasePath, WorkspaceRouteConfig>;

const workspaceRouteSegmentSet = new Set<string>(workspaceRouteSegments);

export function isWorkspaceRouteSegment(value: string): value is WorkspaceRouteSegment {
  return workspaceRouteSegmentSet.has(value);
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

  return `${config.basePath}/${segment}`;
}

export function getWorkspaceHomeHref(
  configOrSegment: WorkspaceRouteConfig | WorkspaceRouteSegment,
) {
  return getWorkspaceNavHref(configOrSegment, "home");
}
