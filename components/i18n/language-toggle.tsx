"use client";

import { startTransition } from "react";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getDocumentLanguage, LOCALE_COOKIE_NAME, type Locale } from "@/lib/locale";

export function LanguageToggle() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("LanguageToggle");

  const handleSwitch = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
    document.documentElement.lang = getDocumentLanguage(nextLocale);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#d7dde3] bg-white/88 p-1 shadow-[0_10px_24px_rgba(96,113,128,0.08)] backdrop-blur">
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-[#486782]">
        <Languages className="size-4.5" />
      </span>
      <button
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "zh"
            ? "bg-[#486782] text-white"
            : "text-[#486782] hover:bg-[#eef3f6]"
        }`}
        onClick={() => handleSwitch("zh")}
        type="button"
      >
        {t("zh")}
      </button>
      <button
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-[#486782] text-white"
            : "text-[#486782] hover:bg-[#eef3f6]"
        }`}
        onClick={() => handleSwitch("en")}
        type="button"
      >
        {t("en")}
      </button>
    </div>
  );
}
