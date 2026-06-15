import { companyConfig } from "./company-config";
import type { CommissionRuleCode } from "./commission-settings";
import type { WorkspaceRouteSegment } from "./workspace-route-segments";
import type { WorkspaceSectionKey } from "./workspace-sections";

export const allWorkspaceBusinessKeys = ["tourism", "wholesale"] as const;

export type WorkspaceBusinessKey = (typeof allWorkspaceBusinessKeys)[number];

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

export type WorkspaceBusinessPageVariants = {
  commission?: WorkspaceCommissionPageMode;
  orders?: WorkspaceOrdersPageMode;
  people?: WorkspacePeoplePageMode;
  records?: true;
  referrals?: true;
  reviews?: true;
  tasks?: WorkspaceTasksPageMode;
  team?: true;
};

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

export type WorkspaceBusinessPageEntry = "tourism" | "wholesale";

export type WorkspaceBusinessSettingsSection =
  | { kind: "tourismServiceFees" }
  | { kind: "tourismServiceOrders" }
  | {
      kind: "commissionRules";
      ruleCodes: readonly CommissionRuleCode[];
    };

export type WorkspaceBusinessSettingsModule = {
  business: WorkspaceBusinessKey;
  descriptionKey: string;
  sections: readonly WorkspaceBusinessSettingsSection[];
  titleKey: string;
};

export type WorkspaceBusinessModule = {
  key: WorkspaceBusinessKey;
  labelKey: WorkspaceBusinessLabelKey;
  navItemsByRouteSegment: Partial<
    Record<WorkspaceRouteSegment, readonly WorkspaceNavItem[]>
  >;
  pageEntry: WorkspaceBusinessPageEntry;
  pageVariantsByRouteSegment: Partial<
    Record<WorkspaceRouteSegment, WorkspaceBusinessPageVariants>
  >;
  settings?: WorkspaceBusinessSettingsModule;
  wholesalePageVariantsByRouteSegment?: Partial<
    Record<WorkspaceRouteSegment, Partial<Record<WorkspaceWholesaleSectionKey, true>>>
  >;
};

const managerTourismNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const staffReadTourismNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const financeTourismNavItems = [
  ...staffReadTourismNavItems,
  { segment: "commission", labelKey: "commission" },
] as const satisfies readonly WorkspaceNavItem[];

const clientTourismNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
] as const satisfies readonly WorkspaceNavItem[];

const recruiterTourismNavItems = [
  { segment: "referrals", labelKey: "referrals" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const sharedSalesTourismNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "people", labelKey: "people" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "commission", labelKey: "commission" },
  { segment: "tasks", labelKey: "tasks" },
] as const satisfies readonly WorkspaceNavItem[];

const adminTourismNavItems = [
  { segment: "orders", labelKey: "orders" },
  { segment: "referrals", labelKey: "referrals" },
  { segment: "team", labelKey: "team" },
  { segment: "people", labelKey: "people" },
  { segment: "records", labelKey: "records" },
  { segment: "commission", labelKey: "commission" },
  { segment: "tasks", labelKey: "tasks" },
  { segment: "reviews", labelKey: "reviews" },
] as const satisfies readonly WorkspaceNavItem[];

const adminWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["order-claims", "orderClaims"],
  ["logistics", "logistics"],
  ["people", "people"],
  ["referrals", "referrals"],
  ["commission", "commission"],
  ["incentives", "incentives"],
]);

const salesWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["order-claims", "orderClaims"],
  ["logistics", "logistics"],
  ["people", "people"],
  ["referrals", "referrals"],
  ["commission", "commission"],
  ["incentives", "incentives"],
]);

const clientWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["logistics", "logistics"],
  ["referrals", "referrals"],
  ["commission", "commission"],
]);

const financeWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["logistics", "logistics"],
  ["commission", "commission"],
  ["incentives", "incentives"],
]);

const managerWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["logistics", "logistics"],
  ["referrals", "referrals"],
  ["commission", "commission"],
  ["incentives", "incentives"],
]);

const operatorWholesaleNavItems = createWholesaleNavItems([
  ["orders", "wholesaleOrders"],
  ["logistics", "logistics"],
]);

const recruiterWholesaleNavItems = createWholesaleNavItems([
  ["referrals", "referrals"],
]);

const allWorkspaceBusinessModules: readonly WorkspaceBusinessModule[] = [
  {
    key: "tourism",
    labelKey: "tourism",
    navItemsByRouteSegment: {
      admin: adminTourismNavItems,
      client: clientTourismNavItems,
      finance: financeTourismNavItems,
      manager: managerTourismNavItems,
      operator: staffReadTourismNavItems,
      promoter: sharedSalesTourismNavItems,
      recruiter: recruiterTourismNavItems,
      salesman: sharedSalesTourismNavItems,
    },
    pageEntry: "tourism",
    pageVariantsByRouteSegment: {
      admin: {
        commission: "admin",
        orders: "admin",
        people: "admin",
        records: true,
        referrals: true,
        reviews: true,
        tasks: "admin",
        team: true,
      },
      client: {
        orders: "client",
        referrals: true,
      },
      finance: {
        commission: "admin",
        referrals: true,
        tasks: "staff",
        team: true,
      },
      manager: {
        referrals: true,
        tasks: "staff",
        team: true,
      },
      operator: {
        referrals: true,
        tasks: "staff",
        team: true,
      },
      promoter: {
        commission: "salesman",
        orders: "salesman",
        people: "salesman",
        referrals: true,
        tasks: "staff",
        team: true,
      },
      recruiter: {
        referrals: true,
        tasks: "staff",
      },
      salesman: {
        commission: "salesman",
        orders: "salesman",
        people: "salesman",
        referrals: true,
        tasks: "staff",
        team: true,
      },
    },
    settings: {
      business: "tourism",
      descriptionKey: "tabs.tourism.description",
      sections: [
        { kind: "tourismServiceFees" },
        { kind: "tourismServiceOrders" },
        {
          kind: "commissionRules",
          ruleCodes: [
            "service_escort_salesman",
            "digital_survival_salesman",
            "service_referral_rate",
            "vip_first_year_referral_bonus",
          ],
        },
      ],
      titleKey: "tabs.tourism.title",
    },
  },
  {
    key: "wholesale",
    labelKey: "wholesale",
    navItemsByRouteSegment: {
      admin: adminWholesaleNavItems,
      client: clientWholesaleNavItems,
      finance: financeWholesaleNavItems,
      manager: managerWholesaleNavItems,
      operator: operatorWholesaleNavItems,
      promoter: salesWholesaleNavItems,
      recruiter: recruiterWholesaleNavItems,
      salesman: salesWholesaleNavItems,
    },
    pageEntry: "wholesale",
    pageVariantsByRouteSegment: {},
    settings: {
      business: "wholesale",
      descriptionKey: "tabs.wholesale.description",
      sections: [
        {
          kind: "commissionRules",
          ruleCodes: ["purchase_salesman_tier", "purchase_referral_rate"],
        },
      ],
      titleKey: "tabs.wholesale.title",
    },
    wholesalePageVariantsByRouteSegment: {
      admin: createWholesalePageVariants(adminWholesaleNavItems),
      client: createWholesalePageVariants(clientWholesaleNavItems),
      finance: createWholesalePageVariants(financeWholesaleNavItems),
      manager: createWholesalePageVariants(managerWholesaleNavItems),
      operator: createWholesalePageVariants(operatorWholesaleNavItems),
      promoter: createWholesalePageVariants(salesWholesaleNavItems),
      recruiter: createWholesalePageVariants(recruiterWholesaleNavItems),
      salesman: createWholesalePageVariants(salesWholesaleNavItems),
    },
  },
];

const enabledBusinessKeySet = new Set<string>(companyConfig.enabledBusinessKeys);

export const workspaceBusinessModules = allWorkspaceBusinessModules.filter(
  (module) => enabledBusinessKeySet.has(module.key),
);

export const workspaceBusinessKeys = workspaceBusinessModules.map(
  (module) => module.key,
) as WorkspaceBusinessKey[];

export function getWorkspaceBusinessModule(
  business: WorkspaceBusinessKey,
): WorkspaceBusinessModule | null {
  return (
    workspaceBusinessModules.find((module) => module.key === business) ?? null
  );
}

export function getWorkspaceBusinessNavGroups(
  routeSegment: WorkspaceRouteSegment,
): WorkspaceNavGroup[] {
  return workspaceBusinessModules
    .map((module) => {
      const navItems: readonly WorkspaceNavItem[] =
        module.navItemsByRouteSegment[routeSegment] ?? [];

      return {
        business: module.key,
        labelKey: module.labelKey,
        navItems: navItems.map((item) => ({
          ...item,
          business: item.business ?? module.key,
        })),
      };
    })
    .filter((group) => group.navItems.length > 0);
}

export function getWorkspaceBusinessPageVariants(
  routeSegment: WorkspaceRouteSegment,
): WorkspaceBusinessPageVariants {
  return workspaceBusinessModules.reduce<WorkspaceBusinessPageVariants>(
    (variants, module) => ({
      ...variants,
      ...(module.pageVariantsByRouteSegment[routeSegment] ?? {}),
    }),
    {},
  );
}

export function getWorkspaceWholesalePageVariants(
  routeSegment: WorkspaceRouteSegment,
): Partial<Record<WorkspaceWholesaleSectionKey, true>> | undefined {
  const wholesaleModule = getWorkspaceBusinessModule("wholesale");

  return wholesaleModule?.wholesalePageVariantsByRouteSegment?.[routeSegment];
}

export function getWorkspaceBusinessSettingsModules() {
  return workspaceBusinessModules
    .map((module) => module.settings)
    .filter((settings): settings is WorkspaceBusinessSettingsModule =>
      Boolean(settings),
    );
}

export function getWorkspaceBusinessSettingsModule(
  business: WorkspaceBusinessKey,
) {
  return getWorkspaceBusinessSettingsModules().find(
    (module) => module.business === business,
  );
}

function createWholesaleNavItems(
  entries: readonly [WorkspaceWholesaleSectionKey, WorkspaceNavLabelKey][],
) {
  return entries.map(([segment, labelKey]) => ({
    business: "wholesale" as const,
    labelKey,
    segment,
  })) satisfies WorkspaceNavItem[];
}

function createWholesalePageVariants(
  navItems: readonly WorkspaceNavItem[],
): Partial<Record<WorkspaceWholesaleSectionKey, true>> {
  return Object.fromEntries(
    navItems.map((item) => [item.segment, true]),
  ) as Partial<Record<WorkspaceWholesaleSectionKey, true>>;
}
