import { getLocale, getTranslations } from "next-intl/server";

import { getCompanyText } from "./company-config";
import { normalizeLocale } from "./locale";

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
  const [t, locale] = await Promise.all([
    getTranslations("AuthShell"),
    getLocale(),
  ]);
  const companyText = getCompanyText(normalizeLocale(locale));

  return {
    brandSubtitle: companyText.brandSubtitle,
    brandTitle: companyText.productName,
    copyright: companyText.copyright,
    help: t("help"),
    privacy: t("privacy"),
    secureAccess: t("secureAccess"),
    terms: t("terms"),
  };
}
