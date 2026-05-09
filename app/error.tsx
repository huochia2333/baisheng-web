"use client";

import { useEffect, useState } from "react";

import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/locale";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

const ERROR_BOUNDARY_COPY = {
  zh: {
    badge: "页面保护",
    title: "当前页面暂时出错",
    description: "页面已经拦住这次异常。你可以先重试一次；如果问题持续，再刷新页面。",
    tryAgain: "重试",
    reload: "刷新页面",
  },
  en: {
    badge: "Page protection",
    title: "This page is temporarily unavailable",
    description: "The page caught this issue. Try again first. If it continues, reload the page.",
    tryAgain: "Try again",
    reload: "Reload",
  },
} as const satisfies Record<
  Locale,
  {
    badge: string;
    title: string;
    description: string;
    tryAgain: string;
    reload: string;
  }
>;

export default function Error({ error, reset }: ErrorPageProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLocale(getPreferredErrorLocale());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const copy = ERROR_BOUNDARY_COPY[locale];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f6f2ea_0%,#f3f7fa_48%,#edf2f6_100%)] px-6 py-16">
      <section className="w-full max-w-xl rounded-[32px] border border-white/90 bg-white/90 p-8 shadow-[0_24px_80px_rgba(35,49,58,0.12)] sm:p-10">
        <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
          {copy.badge}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#23313a]">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#69747d]">
          {copy.description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#486782] px-5 text-sm font-semibold text-white transition hover:bg-[#3e5f79]"
            onClick={() => reset()}
            type="button"
          >
            {copy.tryAgain}
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8e2e8] bg-white px-5 text-sm font-semibold text-[#486782] transition hover:bg-[#eef3f6]"
            onClick={() => window.location.reload()}
            type="button"
          >
            {copy.reload}
          </button>
        </div>
      </section>
    </main>
  );
}

function getPreferredErrorLocale(): Locale {
  if (typeof document !== "undefined") {
    const documentLanguage = document.documentElement.lang.trim().toLowerCase();

    if (documentLanguage.length > 0) {
      return normalizeLocale(documentLanguage.startsWith("en") ? "en" : "zh");
    }
  }

  if (typeof navigator !== "undefined") {
    return normalizeLocale(
      navigator.language.toLowerCase().startsWith("en") ? "en" : "zh",
    );
  }

  return DEFAULT_LOCALE;
}
