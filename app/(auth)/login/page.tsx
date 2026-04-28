import type { Metadata } from "next";

import { getLocale, getTranslations } from "next-intl/server";

import { LoginAnnouncementCard } from "@/components/auth/login-announcement-card";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { getAuthShellCopy } from "@/lib/auth-shell-content";
import { getLatestPublicAnnouncement } from "@/lib/public-announcements";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";
import { getServerSupabaseClient } from "@/lib/supabase-server";

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
  const [, params, t, authShellCopy, publicAnnouncement, locale] = await Promise.all([
    redirectAuthenticatedUserToWorkspace(),
    searchParams,
    getTranslations("LoginPage"),
    getAuthShellCopy(),
    getLoginPublicAnnouncement(),
    getLocale(),
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

        <LoginAnnouncementCard
          announcement={publicAnnouncement}
          copy={{ title: t("announcementTitle") }}
          locale={locale}
        />

        <div className="mt-8 rounded-[26px] border border-[#e7e5e0] bg-white/72 p-5 text-sm text-[#707981] shadow-[0_12px_32px_rgba(115,127,139,0.07)] sm:hidden">
          <p className="mb-2 font-semibold text-[#33424d]">{t("mobileNoteTitle")}</p>
          <p className="leading-7">{t("mobileNoteDescription")}</p>
        </div>
      </AuthShell>
    </ScopedIntlProvider>
  );
}

async function getLoginPublicAnnouncement() {
  try {
    const supabase = await getServerSupabaseClient();
    return await getLatestPublicAnnouncement(supabase);
  } catch {
    return null;
  }
}
