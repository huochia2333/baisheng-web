import type { Metadata } from "next";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { ReferralsClient } from "@/components/dashboard/referrals-client";
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
    title: copy ? copy.title : "招聘工作台",
  };
}

export default async function RecruiterSectionPage({ params }: SectionPageProps) {
  const { section } = await params;

  if (section === "referrals") {
    return <ReferralsClient />;
  }

  const copy = getWorkspaceSectionCopy(section) ?? {
    title: "招聘工作台",
    description:
      "当前模块正在建设中。我们已经把招聘工作台的导航结构搭好，后续可以在这个壳子上继续扩展具体内容。",
  };

  return (
    <AdminSectionPlaceholder
      description={copy.description}
      homeHref="/recruiter/my"
      title={copy.title}
    />
  );
}
