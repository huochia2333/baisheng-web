import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAuthShellCopy } from "@/lib/auth-shell-copy";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LoginPage");

  return {
    title: t("title"),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string; registered?: string }>;
}) {
  await redirectAuthenticatedUserToWorkspace();

  const [params, t, authShellCopy] = await Promise.all([
    searchParams,
    getTranslations("LoginPage"),
    getAuthShellCopy(),
  ]);

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle", "LoginForm"]}>
      <AuthShell
        copy={authShellCopy}
        mode="login"
        asideDescription={t("asideDescription")}
        asideTitle={t("asideTitle")}
        footerLinkHref="/register"
        footerLinkLabel={t("footerLinkLabel")}
        footerPrompt={t("footerPrompt")}
        headerDescription={t("headerDescription")}
        headerTitle={t("headerTitle")}
        noteDescription={t("noteDescription")}
        noteTitle={t("noteTitle")}
      >
        <LoginForm
          passwordReset={params.passwordReset === "1"}
          registered={params.registered === "1"}
        />

        <div className="mt-8 rounded-[26px] border border-[#e7e5e0] bg-white/72 p-5 text-sm text-[#707981] shadow-[0_12px_32px_rgba(115,127,139,0.07)] sm:hidden">
          <p className="mb-2 font-semibold text-[#33424d]">{t("mobileNoteTitle")}</p>
          <p className="leading-7">{t("mobileNoteDescription")}</p>
        </div>
      </AuthShell>
    </ScopedIntlProvider>
  );
}
