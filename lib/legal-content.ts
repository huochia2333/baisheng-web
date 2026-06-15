import { getLocale, getTranslations } from "next-intl/server";

import { getAuthShellCopy } from "./auth-shell-content";
import { getCompanyText } from "./company-config";
import { FORMAL_LEGAL_CONTENT } from "./legal-formal-content";
import type { LegalLinkKey } from "./legal-routes";
import { normalizeLocale, type Locale } from "./locale";

export type LegalPageKey = "privacy" | "terms";

export type LegalSection = {
  title: string;
  items: string[];
};

export type LegalPageCopy = {
  backHome: string;
  brandSubtitle: string;
  brandTitle: string;
  description: string;
  draftNotice: string;
  eyebrow: string;
  lastUpdated: string;
  lastUpdatedLabel: string;
  nav: Record<LegalLinkKey, string>;
  sections: LegalSection[];
  title: string;
};

export async function getLegalPageCopy(pageKey: LegalPageKey): Promise<LegalPageCopy> {
  const [commonT, locale, authShellCopy] = await Promise.all([
    getTranslations("Legal.common"),
    getLocale(),
    getAuthShellCopy(),
  ]);
  const normalizedLocale = normalizeLocale(locale);
  const content = applyCompanyTextToLegalContent(
    FORMAL_LEGAL_CONTENT[normalizedLocale][pageKey],
    normalizedLocale,
  );

  return {
    backHome: commonT("backHome"),
    brandSubtitle: authShellCopy.brandSubtitle,
    brandTitle: authShellCopy.brandTitle,
    description: content.description,
    draftNotice: content.draftNotice,
    eyebrow: content.title,
    lastUpdated: content.lastUpdated,
    lastUpdatedLabel: commonT("lastUpdatedLabel"),
    nav: {
      privacy: commonT("nav.privacy"),
      terms: commonT("nav.terms"),
      help: commonT("nav.help"),
    },
    sections: content.sections,
    title: content.title,
  };
}

export async function getLegalPageMetadata(pageKey: LegalPageKey) {
  const locale = normalizeLocale(await getLocale());
  const content = applyCompanyTextToLegalContent(
    FORMAL_LEGAL_CONTENT[locale][pageKey],
    locale,
  );

  return {
    description: content.description,
    title: content.metadataTitle,
  };
}

function applyCompanyTextToLegalContent(
  content: (typeof FORMAL_LEGAL_CONTENT)[Locale][LegalPageKey],
  locale: Locale,
) {
  const companyText = getCompanyText(locale);

  return {
    ...content,
    description: replaceProductName(content.description, companyText.productName),
    draftNotice: replaceProductName(content.draftNotice, companyText.productName),
    metadataTitle: replaceProductName(content.metadataTitle, companyText.productName),
    sections: content.sections.map((section) => ({
      title: replaceProductName(section.title, companyText.productName),
      items: section.items.map((item) =>
        replaceProductName(item, companyText.productName),
      ),
    })),
    title: replaceProductName(content.title, companyText.productName),
  };
}

function replaceProductName(value: string, productName: string) {
  return value.replaceAll("{productName}", productName);
}
