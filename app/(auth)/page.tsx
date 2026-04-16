import LoginPage, { generateMetadata } from "./login/page";

export { generateMetadata };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string; registered?: string }>;
}) {
  return <LoginPage searchParams={searchParams} />;
}
