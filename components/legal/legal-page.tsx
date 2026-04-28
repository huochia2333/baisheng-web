import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import type { LegalPageCopy } from "@/lib/legal-content";
import { LEGAL_LINKS } from "@/lib/legal-routes";
import { cn } from "@/lib/utils";

type LegalPageProps = {
  activePath: string;
  copy: LegalPageCopy;
};

export function LegalPage({ activePath, copy }: LegalPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#faf9f7] px-4 py-6 text-[#1f2a32] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-16%] top-[-16%] h-[30rem] w-[30rem] rounded-full bg-[rgba(187,208,223,0.38)] blur-3xl" />
        <div className="absolute bottom-[-18%] left-[-12%] h-[26rem] w-[26rem] rounded-full bg-[rgba(208,226,217,0.28)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col gap-8">
        <header className="flex flex-col gap-5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex items-center gap-3 self-start text-[#486782] transition-colors hover:text-[#36536a]"
            href="/"
          >
            <BrandMark priority />
            <span>
              <span className="block text-lg font-bold">{copy.brandTitle}</span>
              <span className="font-label block text-[11px] text-[#8e99a3] uppercase">
                {copy.brandSubtitle}
              </span>
            </span>
          </Link>

          <ScopedIntlProvider namespaces={["LanguageToggle"]}>
            <LanguageToggle />
          </ScopedIntlProvider>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[28px] border border-white/90 bg-white/82 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] backdrop-blur sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                <ShieldCheck className="size-3.5" />
                {copy.eyebrow}
              </span>
              <h1 className="mt-6 text-4xl leading-tight font-bold text-[#21303a] sm:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-5 text-[15px] leading-7 text-[#68737d]">
                {copy.description}
              </p>
              <p className="mt-5 text-xs leading-6 text-[#8a949b]">
                {copy.lastUpdatedLabel}: {copy.lastUpdated}
              </p>
            </div>

            <nav
              aria-label={copy.eyebrow}
              className="flex flex-wrap gap-3 rounded-[24px] border border-white/90 bg-white/70 p-3 shadow-[0_12px_30px_rgba(96,113,128,0.06)] backdrop-blur"
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.key}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
                    link.href === activePath
                      ? "bg-[#486782] text-white"
                      : "bg-white text-[#486782] hover:bg-[#eef3f6]",
                  )}
                  href={link.href}
                >
                  {copy.nav[link.key]}
                </Link>
              ))}
            </nav>

            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#486782] transition-colors hover:text-[#36536a]"
              href="/"
            >
              <ArrowLeft className="size-4" />
              {copy.backHome}
            </Link>
          </aside>

          <article className="space-y-5">
            <div className="rounded-[24px] border border-[#e6e2dc] bg-[#fffdfa]/86 p-5 text-sm leading-7 text-[#68737d] shadow-[0_12px_30px_rgba(96,113,128,0.06)]">
              {copy.draftNotice}
            </div>

            {copy.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[28px] border border-white/90 bg-white/86 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.07)] backdrop-blur sm:p-8"
              >
                <h2 className="text-2xl font-bold text-[#23313a]">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4">
                  {section.items.map((item) => (
                    <p key={item} className="text-[15px] leading-8 text-[#68737d]">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </section>
      </div>
    </main>
  );
}
