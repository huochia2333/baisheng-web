"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { Languages, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getDocumentLanguage, LOCALE_COOKIE_NAME, type Locale } from "@/lib/locale";

export function LanguageToggle() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("LanguageToggle");
  const [isPending, startTransition] = useTransition();
  const [switchingLocale, setSwitchingLocale] = useState<Locale | null>(null);
  const activeSwitchingLocale =
    switchingLocale && switchingLocale !== locale ? switchingLocale : null;
  const isSwitching = Boolean(activeSwitchingLocale) || isPending;

  const handleSwitch = (nextLocale: Locale) => {
    if (nextLocale === locale || isSwitching) {
      return;
    }

    setSwitchingLocale(nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
    document.documentElement.lang = getDocumentLanguage(nextLocale);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <div
        aria-busy={isSwitching}
        aria-live="polite"
        className="inline-flex items-center gap-1 rounded-full border border-[#d7dde3] bg-white/88 p-1 shadow-[0_10px_24px_rgba(96,113,128,0.08)] backdrop-blur"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-[#486782]">
          {isSwitching ? (
            <LoaderCircle className="size-4.5 animate-spin" />
          ) : (
            <Languages className="size-4.5" />
          )}
        </span>
        <button
          className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-80 ${
            locale === "zh"
              ? "bg-[#486782] text-white"
              : "text-[#486782] hover:bg-[#eef3f6]"
          }`}
          disabled={isSwitching}
          onClick={() => handleSwitch("zh")}
          type="button"
        >
          {activeSwitchingLocale === "zh" ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" />
              {t("switching")}
            </>
          ) : (
            t("zh")
          )}
        </button>
        <button
          className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-80 ${
            locale === "en"
              ? "bg-[#486782] text-white"
              : "text-[#486782] hover:bg-[#eef3f6]"
          }`}
          disabled={isSwitching}
          onClick={() => handleSwitch("en")}
          type="button"
        >
          {activeSwitchingLocale === "en" ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" />
              {t("switching")}
            </>
          ) : (
            t("en")
          )}
        </button>
      </div>

      {isSwitching ? (
        <div className="fixed inset-0 z-50 flex cursor-wait items-start justify-end bg-transparent p-4 sm:p-6">
          <div
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d7dde3] bg-white/94 px-4 text-sm font-semibold text-[#486782] shadow-[0_16px_36px_rgba(72,86,98,0.18)] backdrop-blur"
            role="status"
          >
            <LoaderCircle className="size-4 animate-spin" />
            {t("switching")}
          </div>
        </div>
      ) : null}
    </>
  );
}
