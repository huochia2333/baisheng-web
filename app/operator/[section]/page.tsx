import type { Metadata } from "next";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { ReferralsClient } from "@/components/dashboard/referrals-client";
import { TeamManagementClient } from "@/components/dashboard/team-management-client";
import { getWorkspaceSectionCopy } from "@/lib/workspace-sections";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const copy = getWorkspaceSectionCopy(section);

  return {
    title: copy ? copy.title : "运营工作台",
  };
}

export default async function OperatorSectionPage({ params }: SectionPageProps) {
  const { section } = await params;

  if (section === "referrals") {
    return <ReferralsClient />;
  }

  if (section === "team") {
    return <TeamManagementClient />;
  }

  const copy = getWorkspaceSectionCopy(section) ?? {
    title: "运营工作台",
    description:
      "当前模块正在建设中。我们已经把运营工作台的导航结构搭好，后续可以在这个壳子上继续扩展具体内容。",
  };

  return (
    <AdminSectionPlaceholder
      description={copy.description}
      homeHref="/operator/my"
      title={copy.title}
    />
  );
}
