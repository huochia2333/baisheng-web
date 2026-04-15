"use client";

import { useEffect, useState } from "react";

import "./auth.css";

import {
  DEFAULT_LOCALE,
  getDocumentLanguage,
  normalizeLocale,
  type Locale,
} from "@/lib/locale";

type GlobalErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

const GLOBAL_ERROR_COPY = {
  zh: {
    badge: "\u5168\u5c40\u9519\u8bef",
    title: "\u9875\u9762\u51fa\u73b0\u5f02\u5e38",
    description:
      "\u53ef\u4ee5\u5148\u91cd\u8bd5\u4e00\u6b21\uff1b\u5982\u679c\u95ee\u9898\u4ecd\u7136\u5b58\u5728\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u518d\u8fd4\u56de\u5f53\u524d\u9875\u9762\u3002",
    retry: "\u91cd\u8bd5",
    reload: "\u5237\u65b0\u9875\u9762",
  },
  en: {
    badge: "Global Error",
    title: "Something went wrong",
    description: "Try again first. If the problem persists, reload the page and return to this view.",
    retry: "Try again",
    reload: "Reload",
  },
} as const satisfies Record<
  Locale,
  {
    badge: string;
    title: string;
    description: string;
    retry: string;
    reload: string;
  }
>;

export default function GlobalError({ error, reset }: GlobalErrorPageProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLocale(getPreferredGlobalErrorLocale());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const copy = GLOBAL_ERROR_COPY[locale];

  return (
    <html lang={getDocumentLanguage(locale)}>
      <body className="min-h-screen bg-[linear-gradient(160deg,#f6f2ea_0%,#f3f7fa_48%,#edf2f6_100%)]">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <section className="w-full max-w-xl rounded-[32px] border border-white/90 bg-white/92 p-8 shadow-[0_24px_80px_rgba(35,49,58,0.12)] sm:p-10">
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
                {copy.retry}
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
      </body>
    </html>
  );
}

function getPreferredGlobalErrorLocale(): Locale {
  if (typeof document !== "undefined") {
    const documentLanguage = document.documentElement.lang.trim().toLowerCase();

    if (documentLanguage.length > 0) {
      return normalizeLocale(documentLanguage.startsWith("en") ? "en" : "zh");
    }
  }

  if (typeof navigator !== "undefined") {
    return normalizeLocale(navigator.language.toLowerCase().startsWith("en") ? "en" : "zh");
  }

  return DEFAULT_LOCALE;
}
