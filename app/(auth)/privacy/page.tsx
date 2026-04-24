import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalPageCopy } from "@/lib/legal-content";
import { PRIVACY_POLICY_PATH } from "@/lib/legal-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");

  return {
    title: t("metadataTitle"),
    description: t("description"),
  };
}

export default async function PrivacyPage() {
  const copy = await getLegalPageCopy("privacy");

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle"]}>
      <LegalPage activePath={PRIVACY_POLICY_PATH} copy={copy} />
    </ScopedIntlProvider>
  );
}
