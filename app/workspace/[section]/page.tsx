import { redirect } from "next/navigation";

type WorkspaceSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function WorkspaceSectionPage({
  params,
}: WorkspaceSectionPageProps) {
  await params;
  redirect("/workspace/my");
}
