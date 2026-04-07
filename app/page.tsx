import LoginPage, { metadata } from "./login/page";

export { metadata };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string; registered?: string }>;
}) {
  return <LoginPage searchParams={searchParams} />;
}
