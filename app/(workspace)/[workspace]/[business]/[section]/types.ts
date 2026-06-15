export type SectionPageProps = {
  params: Promise<{ business: string; section: string; workspace: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
