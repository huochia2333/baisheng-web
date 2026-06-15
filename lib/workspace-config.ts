import {
  getWorkspaceBasePath,
  type AppRole,
  type WorkspaceBasePath,
} from "./auth-routing";
import type { WorkspaceSectionKey } from "./workspace-sections";

export const workspaceRouteSegments = [
  "admin",
  "salesman",
  "promoter",
  "recruiter",
  "manager",
  "operator",
  "finance",
  "client",
] as const;

export type WorkspaceRouteSegment = (typeof workspaceRouteSegments)[number];

export type WorkspaceLoadingTitleKey = WorkspaceRouteSegment;

export const workspaceBusinessKeys = ["tourism", "wholesale"] as const;

export type WorkspaceBusinessKey = (typeof workspaceBusinessKeys)[number];

export const workspaceWholesaleSectionKeys = [
  "orders",
  "order-claims",
  "logistics",
  "people",
  "referrals",
  "commission",
  "incentives",
] as const;

export type WorkspaceWholesaleSectionKey =
  (typeof workspaceWholesaleSectionKeys)[number];

export type WorkspaceGlobalNavSegment =
  | "accounts"
  | "announcements"
  | "feedback"
  | "home"
  | "my"
  | "settings";

export type WorkspaceNavSegment =
  | WorkspaceGlobalNavSegment
  | WorkspaceSectionKey
  | WorkspaceWholesaleSectionKey;

export type WorkspaceNavLabelKey =
  | "accounts"
  | "announcements"
  | "home"
  | "my"
  | "orders"
  | "people"
  | "records"
  | "referrals"
  | "team"
  | "commission"
  | "feedback"
  | "tasks"
  | "reviews"
  | "settings"
  | "incentives"
  | "orderClaims"
  | "logistics"
  | "wholesaleOrders";

export type WorkspaceBusinessLabelKey = WorkspaceBusinessKey;

export type WorkspaceOrdersPageMode = "admin" | "salesman" | "client";
export type WorkspaceCommissionPageMode = "admin" | "salesman";
export type WorkspaceTasksPageMode = "admin" | "staff";
export type WorkspacePeoplePageMode = "admin" | "salesman";

export type WorkspaceNavItem = {
  business?: WorkspaceBusinessKey;
  segment: WorkspaceNavSegment;
  labelKey: WorkspaceNavLabelKey;
};

export type WorkspaceNavGroup = {
  business: WorkspaceBusinessKey;
  labelKey: WorkspaceBusinessLabelKey;
  navItems: readonly WorkspaceNavItem[];
};

export type WorkspacePageVariants = {
  accounts?: true;
  announcements?: true;
  commission?: WorkspaceCommissionPageMode;
  feedback?: true;
  orders?: WorkspaceOrdersPageMode;
  people?: WorkspacePeoplePageMode;
  records?: true;
  referrals?: true;
  reviews?: true;
  settings?: true;
  tasks?: WorkspaceTasksPageMode;
  team?: true;
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

const managerNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const staffReadNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const financeNavItems = [
  ...staffReadNavItems,
  { segment: "commission", labelKey: "commission" },
] as const satisfies readonly WorkspaceNavItem[];

const clientNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
] as const satisfies readonly WorkspaceNavItem[];

const recruiterNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const sharedNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "people", labelKey: "people" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "commission", labelKey: "commission" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const adminNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "people", labelKey: "people" },
  { segment: "records", labelKey: "records" },
  { segment: "commission", labelKey: "commission" },
  { segment: "tasks", labelKey: "tasks" },
  { segment: "reviews", labelKey: "reviews" },
] as const satisfies readonly WorkspaceNavItem[];

const adminWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "order-claims", labelKey: "orderClaims" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
  { business: "wholesale", segment: "people", labelKey: "people" },
  { business: "wholesale", segment: "referrals", labelKey: "referrals" },
  { business: "wholesale", segment: "commission", labelKey: "commission" },
  { business: "wholesale", segment: "incentives", labelKey: "incentives" },
] as const satisfies readonly WorkspaceNavItem[];

const salesWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "order-claims", labelKey: "orderClaims" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
  { business: "wholesale", segment: "people", labelKey: "people" },
  { business: "wholesale", segment: "referrals", labelKey: "referrals" },
  { business: "wholesale", segment: "commission", labelKey: "commission" },
  { business: "wholesale", segment: "incentives", labelKey: "incentives" },
] as const satisfies readonly WorkspaceNavItem[];

const clientWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
  { business: "wholesale", segment: "referrals", labelKey: "referrals" },
  { business: "wholesale", segment: "commission", labelKey: "commission" },
] as const satisfies readonly WorkspaceNavItem[];

const financeWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
  { business: "wholesale", segment: "commission", labelKey: "commission" },
  { business: "wholesale", segment: "incentives", labelKey: "incentives" },
] as const satisfies readonly WorkspaceNavItem[];

const managerWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
  { business: "wholesale", segment: "referrals", labelKey: "referrals" },
  { business: "wholesale", segment: "commission", labelKey: "commission" },
  { business: "wholesale", segment: "incentives", labelKey: "incentives" },
] as const satisfies readonly WorkspaceNavItem[];

const operatorWholesaleNavItems = [
  { business: "wholesale", segment: "orders", labelKey: "wholesaleOrders" },
  { business: "wholesale", segment: "logistics", labelKey: "logistics" },
] as const satisfies readonly WorkspaceNavItem[];

const recruiterWholesaleNavItems = [
  { business: "wholesale", segment: "referrals", labelKey: "referrals" },
] as const satisfies readonly WorkspaceNavItem[];

function createTourismNavGroup(
  navItems: readonly WorkspaceNavItem[],
): WorkspaceNavGroup {
  return {
    business: "tourism",
    labelKey: "tourism",
    navItems: navItems.map((item) => ({ ...item, business: "tourism" })),
  };
}

function createWholesaleNavGroup(
  navItems: readonly WorkspaceNavItem[],
): WorkspaceNavGroup {
  return {
    business: "wholesale",
    labelKey: "wholesale",
    navItems,
  };
}

const adminNavGroups = [
  createTourismNavGroup(adminNavItems),
  createWholesaleNavGroup(adminWholesaleNavItems),
] as const satisfies readonly WorkspaceNavGroup[];

const createBusinessNavGroups = (
  tourismItems: readonly WorkspaceNavItem[],
  wholesaleItems: readonly WorkspaceNavItem[],
) =>
  [
    createTourismNavGroup(tourismItems),
    createWholesaleNavGroup(wholesaleItems),
  ] as const satisfies readonly WorkspaceNavGroup[];

function createWholesalePageVariants(
  navItems: readonly WorkspaceNavItem[],
): Partial<Record<WorkspaceWholesaleSectionKey, true>> {
  return Object.fromEntries(
    navItems.map((item) => [item.segment, true]),
  ) as Partial<Record<WorkspaceWholesaleSectionKey, true>>;
}

const WORKSPACE_ROUTE_CONFIG_BY_SEGMENT = {
  admin: {
    authRole: "administrator",
    basePath: "/admin",
    globalNavItems: adminGlobalNavItems,
    initials: "AD",
    navGroups: adminNavGroups,
    pageVariants: {
      accounts: true,
      announcements: true,
      commission: "admin",
      feedback: true,
      orders: "admin",
      people: "admin",
      records: true,
      referrals: true,
      reviews: true,
      settings: true,
      tasks: "admin",
      team: true,
    },
    routeSegment: "admin",
    wholesalePageVariants: {
      commission: true,
      incentives: true,
      logistics: true,
      "order-claims": true,
      orders: true,
      people: true,
      referrals: true,
    },
  },
  client: {
    authRole: "client",
    basePath: "/client",
    globalNavItems: homeNavItems,
    initials: "CL",
    navGroups: createBusinessNavGroups(clientNavItems, clientWholesaleNavItems),
    pageVariants: {
      orders: "client",
      referrals: true,
    },
    routeSegment: "client",
    wholesalePageVariants: createWholesalePageVariants(clientWholesaleNavItems),
  },
  finance: {
    authRole: "finance",
    basePath: "/finance",
    globalNavItems: homeNavItems,
    initials: "FN",
    navGroups: createBusinessNavGroups(financeNavItems, financeWholesaleNavItems),
    pageVariants: {
      commission: "admin",
      referrals: true,
      tasks: "staff",
      team: true,
    },
    routeSegment: "finance",
    wholesalePageVariants: createWholesalePageVariants(financeWholesaleNavItems),
  },
  manager: {
    authRole: "manager",
    basePath: "/manager",
    globalNavItems: homeNavItems,
    initials: "MG",
    navGroups: createBusinessNavGroups(managerNavItems, managerWholesaleNavItems),
    pageVariants: {
      referrals: true,
      tasks: "staff",
      team: true,
    },
    routeSegment: "manager",
    wholesalePageVariants: createWholesalePageVariants(managerWholesaleNavItems),
  },
  operator: {
    authRole: "operator",
    basePath: "/operator",
    globalNavItems: homeNavItems,
    initials: "OP",
    navGroups: createBusinessNavGroups(staffReadNavItems, operatorWholesaleNavItems),
    pageVariants: {
      referrals: true,
      tasks: "staff",
      team: true,
    },
    routeSegment: "operator",
    wholesalePageVariants: createWholesalePageVariants(operatorWholesaleNavItems),
  },
  recruiter: {
    authRole: "recruiter",
    basePath: "/recruiter",
    globalNavItems: homeNavItems,
    initials: "RC",
    navGroups: createBusinessNavGroups(recruiterNavItems, recruiterWholesaleNavItems),
    pageVariants: {
      referrals: true,
      tasks: "staff",
    },
    routeSegment: "recruiter",
    wholesalePageVariants: createWholesalePageVariants(recruiterWholesaleNavItems),
  },
  salesman: {
    authRole: "salesman",
    basePath: "/salesman",
    globalNavItems: homeNavItems,
    initials: "YW",
    navGroups: createBusinessNavGroups(sharedNavItems, salesWholesaleNavItems),
    pageVariants: {
      commission: "salesman",
      orders: "salesman",
      people: "salesman",
      referrals: true,
      tasks: "staff",
      team: true,
    },
    routeSegment: "salesman",
    wholesalePageVariants: createWholesalePageVariants(salesWholesaleNavItems),
  },
  promoter: {
    authRole: "promoter",
    basePath: "/promoter",
    globalNavItems: homeNavItems,
    initials: "DT",
    navGroups: createBusinessNavGroups(sharedNavItems, salesWholesaleNavItems),
    pageVariants: {
      commission: "salesman",
      orders: "salesman",
      people: "salesman",
      referrals: true,
      tasks: "staff",
      team: true,
    },
    routeSegment: "promoter",
    wholesalePageVariants: createWholesalePageVariants(salesWholesaleNavItems),
  },
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

  if (business === "tourism") {
    return `${config.basePath}/tourism/${segment}`;
  }

  return `${config.basePath}/wholesale/${segment}`;
}

export function getWorkspaceHomeHref(
  configOrSegment: WorkspaceRouteConfig | WorkspaceRouteSegment,
) {
  return getWorkspaceNavHref(configOrSegment, "home");
}
