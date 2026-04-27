import { LegalPage } from "@/components/legal/legal-page";
import {
  getHelpCenterMetadata,
  getHelpCenterPageCopy,
} from "@/lib/help-center-content";
import { HELP_CENTER_PATH } from "@/lib/legal-routes";

export function generateMetadata() {
  return getHelpCenterMetadata();
}

export default async function HelpCenterPage() {
  const copy = await getHelpCenterPageCopy();

  return <LegalPage activePath={HELP_CENTER_PATH} copy={copy} />;
}
