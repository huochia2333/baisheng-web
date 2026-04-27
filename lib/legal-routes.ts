export const PRIVACY_POLICY_PATH = "/privacy";
export const TERMS_OF_SERVICE_PATH = "/terms";
export const HELP_CENTER_PATH = "/help";

export const LEGAL_LINKS = [
  {
    key: "privacy",
    href: PRIVACY_POLICY_PATH,
  },
  {
    key: "terms",
    href: TERMS_OF_SERVICE_PATH,
  },
  {
    key: "help",
    href: HELP_CENTER_PATH,
  },
] as const;

export type LegalLinkKey = (typeof LEGAL_LINKS)[number]["key"];
