import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminCommissionClient } from "@/components/dashboard/admin-commission-client";
import { AdminOrdersClient } from "@/components/dashboard/admin-orders-client";
import { AdminReviewsClient } from "@/components/dashboard/admin-reviews-client";
import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { AdminTasksClient } from "@/components/dashboard/admin-tasks-client";
import { ExchangeRatesClient } from "@/components/dashboard/exchange-rates-client";
import { ReferralsClient } from "@/components/dashboard/referrals-client";
import { SalesmanCommissionClient } from "@/components/dashboard/salesman-commission-client";
import { SalesmanTasksClient } from "@/components/dashboard/salesman-tasks-client";
import { TeamManagementClient } from "@/components/dashboard/team-management-client";
import {
  getWorkspaceConfigByRouteSegment,
  getWorkspaceHomeHref,
} from "@/lib/workspace-config";
import { getWorkspaceSectionKey } from "@/lib/workspace-sections";

type SectionPageProps = {
  params: Promise<{ section: string; workspace: string }>;
};

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

  if (section === "orders" && config.pageVariants.orders) {
    return <AdminOrdersClient mode={config.pageVariants.orders} />;
  }

  if (section === "commission") {
    if (config.pageVariants.commission === "admin") {
      return <AdminCommissionClient />;
    }

    if (config.pageVariants.commission === "salesman") {
      return <SalesmanCommissionClient />;
    }
  }

  if (section === "exchange-rates" && config.pageVariants.exchangeRates) {
    return (
      <ExchangeRatesClient
        homeHref={getWorkspaceHomeHref(config)}
        mode={config.pageVariants.exchangeRates}
      />
    );
  }

  if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      return <AdminTasksClient />;
    }

    if (config.pageVariants.tasks === "salesman") {
      return <SalesmanTasksClient />;
    }
  }

  if (section === "reviews" && config.pageVariants.reviews) {
    return <AdminReviewsClient />;
  }

  if (section === "referrals" && config.pageVariants.referrals) {
    return <ReferralsClient />;
  }

  if (section === "team" && config.pageVariants.team) {
    return <TeamManagementClient />;
  }

  const sectionT = await getTranslations("WorkspaceSections");
  const fallbackT = await getTranslations(
    `WorkspaceSections.fallbacks.${config.routeSegment}`,
  );
  const sectionKey = getWorkspaceSectionKey(section);
  const title = sectionKey ? sectionT(`${sectionKey}.title`) : fallbackT("title");
  const description = sectionKey
    ? sectionT(`${sectionKey}.description`)
    : fallbackT("description");

  return (
    <AdminSectionPlaceholder
      description={description}
      homeHref={getWorkspaceHomeHref(config)}
      title={title}
    />
  );
}
