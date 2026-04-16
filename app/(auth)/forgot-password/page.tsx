import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAuthShellCopy } from "@/lib/auth-shell-copy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ForgotPasswordPage");

  return {
    title: t("title"),
  };
}

export default async function ForgotPasswordPage() {
  const [t, authShellCopy] = await Promise.all([
    getTranslations("ForgotPasswordPage"),
    getAuthShellCopy(),
  ]);

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle", "ForgotPasswordForm"]}>
      <AuthShell
        copy={authShellCopy}
        mode="login"
        asideDescription={t("asideDescription")}
        asideTitle={t("asideTitle")}
        footerLinkHref="/login"
        footerLinkLabel={t("footerLinkLabel")}
        footerPrompt={t("footerPrompt")}
        headerTitle={t("headerTitle")}
        noteDescription={t("noteDescription")}
        noteTitle={t("noteTitle")}
      >
        <ForgotPasswordForm />
      </AuthShell>
    </ScopedIntlProvider>
  );
}
