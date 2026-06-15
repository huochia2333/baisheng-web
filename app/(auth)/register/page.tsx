import type { Metadata } from "next";
import { Fragment } from "react";

import { getLocale, getTranslations } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAuthShellCopy } from "@/lib/auth-shell-content";
import { getCompanyText } from "@/lib/company-config";
import { normalizeLocale } from "@/lib/locale";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("RegisterPage");

  return {
    title: t("title"),
  };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const [, params, t, authShellCopy, locale] = await Promise.all([
    redirectAuthenticatedUserToWorkspace(),
    searchParams,
    getTranslations("RegisterPage"),
    getAuthShellCopy(),
    getLocale(),
  ]);
  const initialInviteCode = normalizeInviteCode(firstSearchParam(params.ref));
  const companyText = getCompanyText(normalizeLocale(locale));

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle", "RegisterForm"]}>
      <AuthShell
        copy={authShellCopy}
        mode="register"
        asideDescription={t("asideDescription")}
        asideTitle={renderConfiguredTitle(companyText.registerAsideTitle)}
        footerLinkHref="/login"
        footerLinkLabel={t("footerLinkLabel")}
        footerPrompt={t("footerPrompt")}
        headerDescription={t("headerDescription")}
        headerTitle={companyText.registerHeaderTitle}
        noteDescription={companyText.inviteAccessDescription}
        noteTitle={t("noteTitle")}
      >
        <RegisterForm initialInviteCode={initialInviteCode} />

        <div className="mt-8 rounded-[26px] border border-[#d5dde3] bg-[#eff4f7] p-5 text-sm text-[#627380] shadow-[0_14px_34px_rgba(115,127,139,0.07)] sm:hidden">
          <p className="mb-2 font-semibold text-[#33424d]">{t("mobileNoteTitle")}</p>
          <p className="leading-7">{companyText.inviteAccessDescription}</p>
        </div>
      </AuthShell>
    </ScopedIntlProvider>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeInviteCode(value: string | undefined) {
  return value?.trim().toUpperCase();
}

function renderConfiguredTitle(value: string) {
  return value.split("<br></br>").map((part, index) =>
    index === 0 ? (
      part
    ) : (
      <Fragment key={`${part}-${index}`}>
        <br />
        {part}
      </Fragment>
    ),
  );
}
