import type {
  WorkspaceBusinessKey,
  WorkspaceRouteConfig,
} from "@/lib/workspace-config";
import type { WorkspaceSectionKey } from "@/lib/workspace-sections";

export function isWorkspaceSectionEnabled(
  section: WorkspaceSectionKey,
  config: WorkspaceRouteConfig,
) {
  switch (section) {
    case "commission":
      return Boolean(config.pageVariants.commission);
    case "orders":
      return Boolean(config.pageVariants.orders);
    case "people":
      return Boolean(config.pageVariants.people);
    case "records":
      return config.pageVariants.records === true;
    case "referrals":
      return config.pageVariants.referrals === true;
    case "reviews":
      return config.pageVariants.reviews === true;
    case "tasks":
      return Boolean(config.pageVariants.tasks);
    case "team":
      return config.pageVariants.team === true;
  }
}

export function getSectionNamespaces(
  section: string,
  config: WorkspaceRouteConfig,
  business: WorkspaceBusinessKey,
) {
  const namespaces = ["AdminSectionPlaceholder"];

  if (business === "wholesale") {
    namespaces.push("WholesaleBusiness");
    return namespaces;
  }

  if (section === "orders" && config.pageVariants.orders) {
    namespaces.push("Orders", "OrdersUI", "DashboardPagination", "DashboardShared");
  }

  if (section === "commission" && config.pageVariants.commission) {
    namespaces.push("Commission", "DashboardPagination", "Tasks.shared");
  }

  if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      namespaces.push(
        "DashboardPagination",
        "DashboardShared",
        "ReviewsUI",
        "Tasks.admin",
        "Tasks.shared",
      );
    }

    if (config.pageVariants.tasks === "staff") {
      namespaces.push("DashboardPagination", "Tasks.salesman", "Tasks.shared");
    }
  }

  if (section === "reviews" && config.pageVariants.reviews) {
    namespaces.push("Reviews", "ReviewsUI", "DashboardShared", "Tasks.shared");
  }

  if (section === "people" && config.pageVariants.people) {
    namespaces.push(
      config.pageVariants.people === "admin" ? "TourismPeople" : "SalesmanPeople",
      "DashboardShared",
      "PersonPrivateNotes",
    );
  }

  if (section === "records" && config.pageVariants.records) {
    namespaces.push("OperationRecords", "DashboardShared");
  }

  if (section === "referrals" && config.pageVariants.referrals) {
    namespaces.push("DashboardShared", "Referrals");
  }

  if (section === "team" && config.pageVariants.team) {
    namespaces.push("TeamManagement");
  }

  return namespaces;
}
