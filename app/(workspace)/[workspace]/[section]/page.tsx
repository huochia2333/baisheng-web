import type { Metadata } from "next";
import type { ReactNode } from "react";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import {
  getAdminOrdersPageData,
  parseAdminOrdersSearchParams,
} from "@/lib/admin-orders";
import { getAdminCommissionPageData } from "@/lib/admin-commission";
import { getAdminReviewsPageData } from "@/lib/admin-reviews";
import { getAdminTasksPageData, parseAdminTasksSearchParams } from "@/lib/admin-tasks";
import { getExchangeRatesPageData } from "@/lib/exchange-rates";
import { getReferralsPageData } from "@/lib/referrals";
import { getSalesmanCommissionPageData } from "@/lib/salesman-commission";
import {
  getSalesmanTasksPageData,
  parseSalesmanTasksSearchParams,
} from "@/lib/salesman-tasks";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getTeamManagementPageData } from "@/lib/team-management";
import {
  getWorkspaceConfigByRouteSegment,
  getWorkspaceHomeHref,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";
import { getWorkspaceSectionKey } from "@/lib/workspace-sections";

type SectionPageProps = {
  params: Promise<{ section: string; workspace: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function WorkspaceSectionPage({
  params,
  searchParams,
}: SectionPageProps) {
  const [{ section, workspace }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config) {
    notFound();
  }

  const namespaces = getSectionNamespaces(section, config);
  let content: ReactNode | null = null;

  if (section === "orders" && config.pageVariants.orders) {
    const supabase = await getServerSupabaseClient();
    const orderSearchParams = parseAdminOrdersSearchParams(resolvedSearchParams);
    const initialData = await getAdminOrdersPageData(supabase, {
      filters: orderSearchParams.filters,
      includeOrderCosts: config.pageVariants.orders === "admin",
      page: orderSearchParams.page,
    });

    content = (
      <AdminOrdersClient
        initialData={initialData}
        mode={config.pageVariants.orders}
      />
    );
  } else if (section === "commission") {
    if (config.pageVariants.commission === "admin") {
      const supabase = await getServerSupabaseClient();
      const initialData = await getAdminCommissionPageData(supabase);
      content = <AdminCommissionClient initialData={initialData} />;
    } else if (config.pageVariants.commission === "salesman") {
      const supabase = await getServerSupabaseClient();
      const initialData = await getSalesmanCommissionPageData(supabase);
      content = <SalesmanCommissionClient initialData={initialData} />;
    }
  } else if (section === "exchange-rates" && config.pageVariants.exchangeRates) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getExchangeRatesPageData(
      supabase,
      config.pageVariants.exchangeRates,
    );

    content = (
      <ExchangeRatesClient
        homeHref={getWorkspaceHomeHref(config)}
        initialData={initialData}
        mode={config.pageVariants.exchangeRates}
      />
    );
  } else if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      const supabase = await getServerSupabaseClient();
      const initialData = await getAdminTasksPageData(supabase);
      const initialView = parseAdminTasksSearchParams(resolvedSearchParams);
      content = <AdminTasksClient initialData={initialData} initialView={initialView} />;
    } else if (config.pageVariants.tasks === "salesman") {
      const supabase = await getServerSupabaseClient();
      const initialData = await getSalesmanTasksPageData(supabase);
      const initialView = parseSalesmanTasksSearchParams(resolvedSearchParams);
      content = <SalesmanTasksClient initialData={initialData} initialView={initialView} />;
    }
  } else if (section === "reviews" && config.pageVariants.reviews) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getAdminReviewsPageData(supabase);
    content = <AdminReviewsClient initialData={initialData} />;
  } else if (section === "referrals" && config.pageVariants.referrals) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getReferralsPageData(supabase);
    content = <ReferralsClient initialData={initialData} />;
  } else if (section === "team" && config.pageVariants.team) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getTeamManagementPageData(supabase);
    content = <TeamManagementClient initialData={initialData} />;
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
