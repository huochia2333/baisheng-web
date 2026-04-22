import { getTranslations } from "next-intl/server";

export type AuthShellCopy = {
  brandSubtitle: string;
  brandTitle: string;
  copyright: string;
  help: string;
  privacy: string;
  secureAccess: string;
  terms: string;
};

export async function getAuthShellCopy(): Promise<AuthShellCopy> {
  const t = await getTranslations("AuthShell");

  return {
    brandSubtitle: t("brandSubtitle"),
    brandTitle: t("brandTitle"),
    copyright: t("copyright"),
    help: t("help"),
    privacy: t("privacy"),
    secureAccess: t("secureAccess"),
    terms: t("terms"),
  };
}
