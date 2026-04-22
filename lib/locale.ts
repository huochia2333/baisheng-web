import {
  defaultLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";

export type { Locale } from "@/i18n/config";

export type LocalizedValue<T = string> = {
  zh: T;
  en: T;
};

export const DEFAULT_LOCALE: Locale = defaultLocale;
export const LOCALE_COOKIE_NAME = localeCookieName;

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export function getDocumentLanguage(locale: Locale) {
  return locale === "en" ? "en" : "zh-CN";
}
