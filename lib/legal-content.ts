import { getTranslations } from "next-intl/server";

import { getAuthShellCopy } from "./auth-shell-content";
import type { LegalLinkKey } from "./legal-routes";

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
  const [commonT, pageT, authShellCopy] = await Promise.all([
    getTranslations("Legal.common"),
    getTranslations(`Legal.${pageKey}`),
    getAuthShellCopy(),
  ]);

  return {
    backHome: commonT("backHome"),
    brandSubtitle: authShellCopy.brandSubtitle,
    brandTitle: authShellCopy.brandTitle,
    description: pageT("description"),
    draftNotice: commonT("draftNotice"),
    eyebrow: pageT("eyebrow"),
    lastUpdated: pageT("lastUpdated"),
    lastUpdatedLabel: commonT("lastUpdatedLabel"),
    nav: {
      privacy: commonT("nav.privacy"),
      terms: commonT("nav.terms"),
    },
    sections: readLegalSections(pageT.raw("sections")),
    title: pageT("title"),
  };
}

function readLegalSections(value: unknown): LegalSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.title !== "string") {
      return [];
    }

    const items = Array.isArray(entry.items)
      ? entry.items.filter((item): item is string => typeof item === "string")
      : [];

    if (items.length === 0) {
      return [];
    }

    return [
      {
        title: entry.title,
        items,
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
