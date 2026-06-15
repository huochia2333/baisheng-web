import type { ReactNode } from "react";

import dynamic from "next/dynamic";
import { forbidden, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import {
  getAdminOrdersPageData,
  parseAdminOrdersSearchParams,
} from "@/lib/admin-orders";
import { getAdminCommissionPageData } from "@/lib/admin-commission";
import { getAdminTaskMediaLibraryData } from "@/lib/admin-task-media-library";
import { getAdminTaskReviewBoardData } from "@/lib/admin-task-reviews";
import { getAdminReviewsPageData } from "@/lib/admin-reviews";
import { getAdminPeoplePageData } from "@/lib/admin-people";
import { getAdminOperationRecordsPageData } from "@/lib/admin-operation-records";
import { getAdminTasksPageData, parseAdminTasksSearchParams } from "@/lib/admin-tasks";
import { getSalesmanPeoplePageData } from "@/lib/salesman-people";
import {
  getReferralsPageData,
  parseReferralBusinessBoardSearchParams,
} from "@/lib/referrals";
import { getSalesmanCommissionPageData } from "@/lib/salesman-commission";
import {
  getSalesmanTasksPageData,
  parseSalesmanTasksSearchParams,
} from "@/lib/salesman-tasks";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { getTeamManagementPageData } from "@/lib/team-management";
import {
  getCurrentWorkspaceBusinessAccess,
  workspaceBusinessAccessIncludes,
} from "@/lib/workspace-business-access";
import {
  getWorkspaceConfigByRouteSegment,
  getWorkspaceHomeHref,
  isWorkspaceBusinessKey,
} from "@/lib/workspace-config";
import { getWorkspaceSectionKey } from "@/lib/workspace-sections";

import {
  getSectionNamespaces,
  isWorkspaceSectionEnabled,
} from "./section-helpers";
import type { SectionPageProps } from "./types";
import { renderWholesaleSectionPage } from "./wholesale-section-page";

export { generateWorkspaceSectionMetadata as generateMetadata } from "./section-metadata";

const AdminCommissionClient = dynamic(
  () =>
    import("@/components/dashboard/commission/admin-commission-client").then(
      (mod) => mod.AdminCommissionClient,
    ),
);

const AdminOrdersClient = dynamic(
  () =>
    import("@/components/dashboard/admin-orders/admin-orders-client").then(
      (mod) => mod.AdminOrdersClient,
    ),
);

const TourismPeopleClient = dynamic(
  () =>
    import("@/components/dashboard/tourism-people/tourism-people-client").then(
      (mod) => mod.TourismPeopleClient,
    ),
);

const SalesmanPeopleClient = dynamic(
  () =>
    import("@/components/dashboard/salesman-people/salesman-people-client").then(
      (mod) => mod.SalesmanPeopleClient,
    ),
);

const AdminOperationRecordsClient = dynamic(
  () =>
    import(
      "@/components/dashboard/admin-operation-records/admin-operation-records-client"
    ).then((mod) => mod.AdminOperationRecordsClient),
);

const AdminReviewsClient = dynamic(
  () =>
    import("@/components/dashboard/admin-reviews/admin-reviews-client").then(
      (mod) => mod.AdminReviewsClient,
    ),
);

const AdminTasksClient = dynamic(
  () =>
    import("@/components/dashboard/admin-tasks/admin-tasks-client").then(
      (mod) => mod.AdminTasksClient,
    ),
);

const ReferralsClient = dynamic(
  () =>
    import("@/components/dashboard/referrals/referrals-client").then(
      (mod) => mod.ReferralsClient,
    ),
);

const SalesmanCommissionClient = dynamic(
  () =>
    import("@/components/dashboard/commission/salesman-commission-client").then(
      (mod) => mod.SalesmanCommissionClient,
    ),
);

const SalesmanTasksClient = dynamic(
  () =>
    import("@/components/dashboard/salesman-tasks/salesman-tasks-client").then(
      (mod) => mod.SalesmanTasksClient,
    ),
);

const TeamManagementClient = dynamic(
  () =>
    import("@/components/dashboard/team-management/team-management-client").then(
      (mod) => mod.TeamManagementClient,
    ),
);

export default async function WorkspaceSectionPage({
  params,
  searchParams,
}: SectionPageProps) {
  const [{ business, section, workspace }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config || !isWorkspaceBusinessKey(business)) {
    notFound();
  }

  const accessSupabase = await getServerSupabaseClient();
  const workspaceBusinessAccess =
    await getCurrentWorkspaceBusinessAccess(accessSupabase);

  if (!workspaceBusinessAccessIncludes(workspaceBusinessAccess, business)) {
    forbidden();
  }

  if (business === "wholesale") {
    return renderWholesaleSectionPage(section, config);
  }

  const namespaces = getSectionNamespaces(section, config, business);
  const sectionKey = getWorkspaceSectionKey(section);
  let content: ReactNode | null = null;

  if (!sectionKey) {
    notFound();
  }

  if (!isWorkspaceSectionEnabled(sectionKey, config)) {
    forbidden();
  }

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
  } else if (section === "tasks") {
    if (config.pageVariants.tasks === "admin") {
      const supabase = await getServerSupabaseClient();
      const [initialData, initialReviewData, initialMediaLibraryData] = await Promise.all([
        getAdminTasksPageData(supabase),
        getAdminTaskReviewBoardData(supabase),
        getAdminTaskMediaLibraryData(supabase),
      ]);
      const initialView = parseAdminTasksSearchParams(resolvedSearchParams);
      content = (
        <AdminTasksClient
          initialData={initialData}
          initialMediaLibraryData={initialMediaLibraryData}
          initialReviewData={initialReviewData}
          initialView={initialView}
        />
      );
    } else if (config.pageVariants.tasks === "staff") {
      const supabase = await getServerSupabaseClient();
      const initialData = await getSalesmanTasksPageData(supabase);
      const initialView = parseSalesmanTasksSearchParams(resolvedSearchParams);
      content = <SalesmanTasksClient initialData={initialData} initialView={initialView} />;
    }
  } else if (section === "reviews" && config.pageVariants.reviews) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getAdminReviewsPageData(supabase);
    content = <AdminReviewsClient initialData={initialData} />;
  } else if (section === "people" && config.pageVariants.people) {
    const supabase = await getServerSupabaseClient();
    if (config.pageVariants.people === "admin") {
      const initialData = await getAdminPeoplePageData(supabase);
      content = <TourismPeopleClient initialData={initialData} />;
    } else {
      const initialData = await getSalesmanPeoplePageData(supabase);
      content = <SalesmanPeopleClient initialData={initialData} />;
    }
  } else if (section === "records" && config.pageVariants.records) {
    const supabase = await getServerSupabaseClient();
    const initialData = await getAdminOperationRecordsPageData(supabase);
    content = <AdminOperationRecordsClient initialData={initialData} />;
  } else if (section === "referrals" && config.pageVariants.referrals) {
    const supabase = await getServerSupabaseClient();
    const businessBoard =
      parseReferralBusinessBoardSearchParams(resolvedSearchParams);
    const initialData = await getReferralsPageData(supabase, { businessBoard });
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

