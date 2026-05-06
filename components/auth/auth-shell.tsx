import type { ReactNode } from "react";

import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";

import { AuthRouteLink } from "@/components/auth/auth-route-link";
import { BrandMark } from "@/components/brand/brand-mark";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import type { AuthShellCopy } from "@/lib/auth-shell-content";
import { cn } from "@/lib/utils";

const AUTH_SHELL_IMAGE_BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAeABQDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAQBBQYD/8QAHRAAAgIDAQEBAAAAAAAAAAAAAAECAwQREiEiMf/EABgBAAMBAQAAAAAAAAAAAAAAAAEEBQID/8QAGhEAAwEBAQEAAAAAAAAAAAAAAAEhAgMSEf/aAAwDAQACEQMRAD8Asaqxmv58IUoKHWwhNT/GSVlp/UNujKjtAcneo+MCgusFHzpnMXMndRzv0YryLKlsosayWPfynsYys+cXpIDxYds7lLSed1LbYGeeXNsDXlg9ZP/Z";

type AuthShellProps = {
  copy: AuthShellCopy;
  mode: "login" | "register";
  asideTitle: ReactNode;
  asideDescription: string;
  noteTitle: string;
  noteDescription: string;
  headerEyebrow?: string;
  headerTitle: string;
  headerDescription?: string;
  footerPrompt: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: ReactNode;
};

export function AuthShell({
  copy,
  mode,
  asideTitle,
  asideDescription,
  noteTitle,
  noteDescription,
  headerEyebrow,
  headerTitle,
  headerDescription,
  footerPrompt,
  footerLinkHref,
  footerLinkLabel,
  children,
}: AuthShellProps) {
  const isRegister = mode === "register";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf9f7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-12%] top-[-16%] h-[28rem] w-[28rem] rounded-full bg-[rgba(187,208,223,0.38)] blur-3xl" />
        <div className="absolute bottom-[-18%] left-[-14%] h-[26rem] w-[26rem] rounded-full bg-[rgba(208,226,217,0.28)] blur-3xl" />
      </div>

      <main className="relative flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
        <div className="auth-card-surface grid w-full max-w-[1360px] overflow-hidden rounded-[34px] border border-white/75 shadow-[0_24px_80px_rgba(86,103,119,0.12)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <aside className="relative hidden min-h-[820px] overflow-hidden bg-[#f4f3f1] px-12 py-10 text-[#1f2a32] lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0">
              <Image
                alt=""
                className={cn(
                  "scale-105 object-cover object-center",
                  isRegister ? "opacity-[0.82] saturate-[1.02]" : "opacity-[0.9] saturate-[1.08]",
                )}
                fill
                blurDataURL={AUTH_SHELL_IMAGE_BLUR_DATA_URL}
                fetchPriority={isRegister ? "auto" : "high"}
                loading={isRegister ? "lazy" : "eager"}
                placeholder="blur"
                quality={78}
                sizes="(min-width: 1024px) 46vw, 0vw"
                src="/images/zhang-kaiyv-Xqf2ph7vrgc-unsplash.jpg"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,243,241,0.34),rgba(244,243,241,0.46),rgba(244,243,241,0.66))]" />
            <div className="auth-grid-dots absolute inset-0 opacity-65" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_bottom,rgba(72,103,130,0.07),transparent_60%)]" />

            <div className="relative z-10">
              <div className="mb-16 flex items-center gap-3">
                <BrandMark priority />
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-[#486782]">
                    {copy.brandTitle}
                  </p>
                  <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                    {copy.brandSubtitle}
                  </p>
                </div>
              </div>

              <div className="max-w-[360px] space-y-8">
                <h1 className="max-w-[9ch] text-balance text-[56px] leading-[1.08] font-bold tracking-[-0.04em]">
                  {asideTitle}
                </h1>
                <p className="max-w-[330px] text-[16px] leading-8 text-[#66727d]">
                  {asideDescription}
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="max-w-[360px] rounded-[28px] border border-[#e4e2df] bg-white/80 p-6 shadow-[0_12px_36px_rgba(120,135,148,0.08)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#eef3ef] text-[#4c7259]">
                    {isRegister ? (
                      <ShieldCheck className="size-5" />
                    ) : (
                      <Sparkles className="size-5" />
                    )}
                  </div>
                  <p className="text-sm font-semibold tracking-[0.08em] text-[#33424d]">
                    {noteTitle}
                  </p>
                </div>
                <p className="text-sm leading-7 text-[#6f7980]">{noteDescription}</p>
              </div>

              <div className="flex items-center gap-4 font-label text-[11px] tracking-[0.28em] text-[#97a0a8] uppercase">
                <span>Precision</span>
                <span className="h-px w-8 bg-[#d7dadc]" />
                <span>Elegance</span>
                <span className="h-px w-8 bg-[#d7dadc]" />
                <span>Humanity</span>
              </div>
            </div>
          </aside>

          <section className="relative flex min-h-[760px] flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(250,249,247,0.94))]">
            <div className="mx-auto flex w-full max-w-[580px] flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-16">
              <div className="mb-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <BrandMark priority />
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold tracking-tight text-[#486782]">
                      {copy.brandTitle}
                    </p>
                    <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                      {copy.brandSubtitle}
                    </p>
                  </div>
                </div>

                <div className="ml-auto">
                  <LanguageToggle />
                </div>
              </div>

              <header className="mb-10 space-y-3">
                <p className="font-label text-[11px] font-semibold tracking-[0.22em] text-[#5d7388] uppercase">
                  {headerEyebrow ?? copy.secureAccess}
                </p>
                <h2 className="text-[40px] leading-[1.08] font-bold tracking-[-0.04em] text-[#21303a] sm:text-[46px]">
                  {headerTitle}
                </h2>
                {headerDescription ? (
                  <p className="max-w-[420px] text-[15px] leading-7 text-[#68737d]">
                    {headerDescription}
                  </p>
                ) : null}
              </header>

              <div className="flex-1">{children}</div>

              <div className="border-t border-[#dfdfdc] pt-8 text-center">
                <p className="text-sm text-[#6d767c]">
                  {footerPrompt}{" "}
                  <AuthRouteLink
                    href={footerLinkHref}
                    className="font-semibold text-[#486782] transition-colors hover:text-[#36536a]"
                  >
                    {footerLinkLabel}
                  </AuthRouteLink>
                </p>
              </div>

              <div className="mt-auto flex flex-col gap-4 pt-12 text-xs text-[#97a0a8] sm:flex-row sm:items-center sm:justify-between">
                <p>{copy.copyright}</p>
                <LegalFooterLinks
                  className="justify-center sm:justify-end"
                  copy={copy}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
