import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import {
  getWorkspaceConfigByRouteSegment,
  isWorkspaceBusinessKey,
  isWorkspaceWholesaleSectionKey,
  type WorkspaceRouteConfig,
  type WorkspaceWholesaleSectionKey,
} from "@/lib/workspace-config";
import { getWorkspaceSectionKey } from "@/lib/workspace-sections";

import type { SectionPageProps } from "./types";

export async function generateWorkspaceSectionMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { business, section, workspace } = await params;
  const config = getWorkspaceConfigByRouteSegment(workspace);

  if (!config || !isWorkspaceBusinessKey(business)) {
    return {};
  }

  if (business === "wholesale") {
    const wholesaleSection = getEnabledWholesaleSection(section, config);

    if (!wholesaleSection) {
      return {};
    }

    const t = await getTranslations("WholesaleBusiness.sections");

    return {
      title: t(`${wholesaleSection}.title`),
    };
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

  if (section === "tasks" && config.pageVariants.tasks) {
    const t = await getTranslations("Tasks.metadata");

    return {
      title: t(config.pageVariants.tasks === "admin" ? "adminTitle" : "staffTitle"),
    };
  }

  if (section === "reviews" && config.pageVariants.reviews) {
    const t = await getTranslations("Reviews.metadata");

    return {
      title: t("title"),
    };
  }

  if (section === "people" && config.pageVariants.people) {
    const t = await getTranslations(
      config.pageVariants.people === "admin"
        ? "TourismPeople.metadata"
        : "SalesmanPeople.metadata",
    );

    return {
      title: t("title"),
    };
  }

  if (section === "records" && config.pageVariants.records) {
    const t = await getTranslations("OperationRecords.metadata");

    return {
      title: t("title"),
    };
  }

  const sectionT = await getTranslations("WorkspaceSections");
  const fallbackT = await getTranslations(
    `WorkspaceSections.fallbacks.${config.routeSegment}`,
  );
  const sectionKey = getWorkspaceSectionKey(section);

  if (!sectionKey) {
    return {};
  }

  return {
    title: sectionT(`${sectionKey}.title`) || fallbackT("title"),
  };
}

function getEnabledWholesaleSection(
  section: string,
  config: WorkspaceRouteConfig,
): WorkspaceWholesaleSectionKey | null {
  if (!isWorkspaceWholesaleSectionKey(section)) {
    return null;
  }

  return config.wholesalePageVariants?.[section] ? section : null;
}
