import { getLocale, getTranslations } from "next-intl/server";

import { getAuthShellCopy } from "./auth-shell-content";
import { FORMAL_LEGAL_CONTENT } from "./legal-formal-content";
import type { LegalLinkKey } from "./legal-routes";
import { normalizeLocale } from "./locale";

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
  const content = FORMAL_LEGAL_CONTENT[normalizeLocale(locale)][pageKey];

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
  const content = FORMAL_LEGAL_CONTENT[locale][pageKey];

  return {
    description: content.description,
    title: content.metadataTitle,
  };
}
