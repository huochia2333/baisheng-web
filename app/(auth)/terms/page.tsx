import type { Metadata } from "next";

import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalPageCopy, getLegalPageMetadata } from "@/lib/legal-content";
import { TERMS_OF_SERVICE_PATH } from "@/lib/legal-routes";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalPageMetadata("terms");
}

export default async function TermsPage() {
  const copy = await getLegalPageCopy("terms");

  return (
    <ScopedIntlProvider namespaces={["LanguageToggle"]}>
      <LegalPage activePath={TERMS_OF_SERVICE_PATH} copy={copy} />
    </ScopedIntlProvider>
  );
}
