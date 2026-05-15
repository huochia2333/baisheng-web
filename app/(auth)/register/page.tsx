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

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string | string[]; ref?: string | string[] }>;
}) {
  const [, params, t, authShellCopy] = await Promise.all([
    redirectAuthenticatedUserToWorkspace(),
    searchParams,
    getTranslations("RegisterPage"),
    getAuthShellCopy(),
  ]);
  const initialInviteCode = buildInitialInviteCode(
    firstSearchParam(params.ref),
    firstSearchParam(params.board),
  );

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
        <RegisterForm initialInviteCode={initialInviteCode} />

        <div className="mt-8 rounded-[26px] border border-[#d5dde3] bg-[#eff4f7] p-5 text-sm text-[#627380] shadow-[0_14px_34px_rgba(115,127,139,0.07)] sm:hidden">
          <p className="mb-2 font-semibold text-[#33424d]">{t("mobileNoteTitle")}</p>
          <p className="leading-7">{t("mobileNoteDescription")}</p>
        </div>
      </AuthShell>
    </ScopedIntlProvider>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildInitialInviteCode(
  referralCode: string | undefined,
  businessBoard: string | undefined,
) {
  const normalizedCode = referralCode?.trim().toUpperCase();

  if (!normalizedCode || /-[TD]$/i.test(normalizedCode)) {
    return normalizedCode;
  }

  const suffix = getInviteCodeBoardSuffix(businessBoard);

  return suffix ? `${normalizedCode}-${suffix}` : normalizedCode;
}

function getInviteCodeBoardSuffix(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "tourism") {
    return "T";
  }

  if (normalized === "dropshipping") {
    return "D";
  }

  return null;
}
