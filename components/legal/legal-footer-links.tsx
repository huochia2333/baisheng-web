import Link from "next/link";

import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal-routes";
import { cn } from "@/lib/utils";

type LegalFooterLinksCopy = {
  help: string;
  privacy: string;
  terms: string;
};

type LegalFooterLinksProps = {
  className?: string;
  copy: LegalFooterLinksCopy;
  linkClassName?: string;
};

export function LegalFooterLinks({
  className,
  copy,
  linkClassName,
}: LegalFooterLinksProps) {
  const resolvedLinkClassName = cn(
    "transition-colors hover:text-[#486782]",
    linkClassName,
  );

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <Link className={resolvedLinkClassName} href={PRIVACY_POLICY_PATH}>
        {copy.privacy}
      </Link>
      <Link className={resolvedLinkClassName} href={TERMS_OF_SERVICE_PATH}>
        {copy.terms}
      </Link>
      <a className={resolvedLinkClassName} href="#">
        {copy.help}
      </a>
    </div>
  );
}
