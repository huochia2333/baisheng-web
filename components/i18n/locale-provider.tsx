"use client";

import { useLocale as useNextLocale } from "next-intl";

import type { Locale } from "@/lib/locale";

export function useLocale() {
  const locale = useNextLocale() as Locale;

  return { locale };
}
