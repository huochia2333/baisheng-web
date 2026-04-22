import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAuthShellCopy } from "@/lib/auth-shell-content";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("RegisterPage");

  return {
    title: t("title"),
  };
}

export default async function RegisterPage() {
  await redirectAuthenticatedUserToWorkspace();

  const [t, authShellCopy] = await Promise.all([
    getTranslations("RegisterPage"),
    getAuthShellCopy(),
  ]);

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle", "RegisterForm"]}>
      <AuthShell
        copy={authShellCopy}
        mode="register"
        asideDescription={t("asideDescription")}
        asideTitle={t.rich("asideTitle", {
          br: () => <br />,
        })}
        footerLinkHref="/login"
        footerLinkLabel={t("footerLinkLabel")}
        footerPrompt={t("footerPrompt")}
        headerDescription={t("headerDescription")}
        headerTitle={t("headerTitle")}
        noteDescription={t("noteDescription")}
        noteTitle={t("noteTitle")}
      >
        <RegisterForm />

        <div className="mt-8 rounded-[26px] border border-[#d5dde3] bg-[#eff4f7] p-5 text-sm text-[#627380] shadow-[0_14px_34px_rgba(115,127,139,0.07)] sm:hidden">
          <p className="mb-2 font-semibold text-[#33424d]">{t("mobileNoteTitle")}</p>
          <p className="leading-7">{t("mobileNoteDescription")}</p>
        </div>
      </AuthShell>
    </ScopedIntlProvider>
  );
}
