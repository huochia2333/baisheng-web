import type { Metadata } from "next";
import type { ReactNode } from "react";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import {
  getWorkspaceConfigByRouteSegment,
  getWorkspaceHomeHref,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";
import { getWorkspaceSectionKey } from "@/lib/workspace-sections";

type SectionPageProps = {
  params: Promise<{ section: string; workspace: string }>;
};

const AdminCommissionClient = dynamic(
  () =>
    import("@/components/dashboard/admin-commission-client").then(
      (mod) => mod.AdminCommissionClient,
    ),
);

const AdminOrdersClient = dynamic(
  () =>
    import("@/components/dashboard/admin-orders-client").then(
      (mod) => mod.AdminOrdersClient,
    ),
);

const AdminReviewsClient = dynamic(
  () =>
    import("@/components/dashboard/admin-reviews-client").then(
      (mod) => mod.AdminReviewsClient,
    ),
);

const AdminTasksClient = dynamic(
  () =>
    import("@/components/dashboard/admin-tasks-client").then(
      (mod) => mod.AdminTasksClient,
    ),
);

const ExchangeRatesClient = dynamic(
  () =>
    import("@/components/dashboard/exchange-rates-client").then(
      (mod) => mod.ExchangeRatesClient,
    ),
);

const ReferralsClient = dynamic(
  () =>
    import("@/components/dashboard/referrals-client").then(
      (mod) => mod.ReferralsClient,
    ),
);

const SalesmanCommissionClient = dynamic(
  () =>
    import("@/components/dashboard/salesman-commission-client").then(
      (mod) => mod.SalesmanCommissionClient,
    ),
);

const SalesmanTasksClient = dynamic(
  () =>
    import("@/components/dashboard/salesman-tasks-client").then(
      (mod) => mod.SalesmanTasksClient,
    ),
);

const TeamManagementClient = dynamic(
  () =>
    import("@/components/dashboard/team-management-client").then(
      (mod) => mod.TeamManagementClient,
    ),
);

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section, workspace } = await params;
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    return {};
  }

  if (section === "orders" && config.pageVariants.orders) {
    const t = await getTranslations("Orders.metadata");

    return {
      title: t(config.pageVariants.orders),
    };
  }

  if (section === "commission" && config.pageVariants.commission) {
    const t = await getTranslations("Commission.metadata");

    return {
      title: t(
        config.pageVariants.commission === "admin"
          ? "adminTitle"
          : "salesmanTitle",
      ),
    };
  }

  if (section === "exchange-rates" && config.pageVariants.exchangeRates) {
    const t = await getTranslations("ExchangeRates.metadata");

    return {
      title: t("title"),
    };
  }

  if (section === "tasks" && config.pageVariants.tasks) {
    const t = await getTranslations("Tasks.metadata");

    return {
      title: t(config.pageVariants.tasks === "admin" ? "adminTitle" : "salesmanTitle"),
    };
  }

  if (section === "reviews" && config.pageVariants.reviews) {
    const t = await getTranslations("Reviews.metadata");

    return {
      title: t("title"),
    };
  }

  const sectionT = await getTranslations("WorkspaceSections");
  const fallbackT = await getTranslations(
    `WorkspaceSections.fallbacks.${config.routeSegment}`,
  );
  const sectionKey = getWorkspaceSectionKey(section);

  return {
    title: sectionKey ? sectionT(`${sectionKey}.title`) : fallbackT("title"),
  };
}

export default async function WorkspaceSectionPage({ params }: SectionPageProps) {
  const { section, workspace } = await params;
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    notFound();
  }

  const namespaces = getSectionNamespaces(section, config);
  let content: ReactNode | null = null;

  if (section === "orders" && config.pageVariants.orders) {
    content = <AdminOrdersClient mode={config.pageVariants.orders} />;
  } else if (section === "commission") {
    if (config.pageVariants.commission === "admin") {
      content = <AdminCommissionClient />;
    } else if (config.pageVariants.commission === "salesman") {
      content = <SalesmanCommissionClient />;
    }
  } else if (section === "exchange-rates" && config.pageVariants.exchangeRates) {
    content = (
      <ExchangeRatesClient
        homeHref={getWorkspaceHomeHref(config)}
        mode={config.pageVariants.exchangeRates}
      />
    );
  } else if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      content = <AdminTasksClient />;
    } else if (config.pageVariants.tasks === "salesman") {
      content = <SalesmanTasksClient />;
    }
  } else if (section === "reviews" && config.pageVariants.reviews) {
    content = <AdminReviewsClient />;
  } else if (section === "referrals" && config.pageVariants.referrals) {
    content = <ReferralsClient />;
  } else if (section === "team" && config.pageVariants.team) {
    content = <TeamManagementClient />;
  }

  if (!content) {
    const sectionT = await getTranslations("WorkspaceSections");
    const fallbackT = await getTranslations(
      `WorkspaceSections.fallbacks.${config.routeSegment}`,
    );
    const sectionKey = getWorkspaceSectionKey(section);
    const title = sectionKey ? sectionT(`${sectionKey}.title`) : fallbackT("title");
    const description = sectionKey
      ? sectionT(`${sectionKey}.description`)
      : fallbackT("description");

    content = (
      <AdminSectionPlaceholder
        description={description}
        homeHref={getWorkspaceHomeHref(config)}
        title={title}
      />
    );
  }

  return <ScopedIntlProvider namespaces={namespaces}>{content}</ScopedIntlProvider>;
}

function getSectionNamespaces(
  section: string,
  config: WorkspaceRouteConfig,
) {
  const namespaces = ["AdminSectionPlaceholder"];

  if (section === "orders" && config.pageVariants.orders) {
    namespaces.push("Orders", "OrdersUI", "DashboardPagination", "DashboardShared");
  }

  if (section === "commission" && config.pageVariants.commission) {
    namespaces.push("Commission");
  }

  if (section === "exchange-rates" && config.pageVariants.exchangeRates) {
    namespaces.push("DashboardPagination", "ExchangeRates");
  }

  if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      namespaces.push("Tasks.admin", "Tasks.shared");
    }

    if (config.pageVariants.tasks === "salesman") {
      namespaces.push("Tasks.salesman", "Tasks.shared");
    }
  }

  if (section === "reviews" && config.pageVariants.reviews) {
    namespaces.push("Reviews", "ReviewsUI", "DashboardShared");
  }

  if (section === "referrals" && config.pageVariants.referrals) {
    namespaces.push("DashboardShared", "Referrals");
  }

  if (section === "team" && config.pageVariants.team) {
    namespaces.push("TeamManagement");
  }

  return namespaces;
}
