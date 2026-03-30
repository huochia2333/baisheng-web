import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { GalleryVerticalEnd, ShieldCheck, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  mode: "login" | "register";
  asideTitle: ReactNode;
  asideDescription: string;
  noteTitle: string;
  noteDescription: string;
  headerTitle: string;
  headerDescription?: string;
  footerPrompt: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: ReactNode;
};

export function AuthShell({
  mode,
  asideTitle,
  asideDescription,
  noteTitle,
  noteDescription,
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
          <aside
            className="relative hidden min-h-[820px] overflow-hidden bg-[#f4f3f1] px-12 py-10 text-[#1f2a32] lg:flex lg:flex-col lg:justify-between"
          >
            <div className="absolute inset-0">
              <Image
                alt=""
                className={cn(
                  "scale-105 object-cover object-center",
                  isRegister ? "opacity-[0.82] saturate-[1.02]" : "opacity-[0.9] saturate-[1.08]",
                )}
                fill
                priority
                src="/images/zhang-kaiyv-Xqf2ph7vrgc-unsplash.jpg"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,243,241,0.34),rgba(244,243,241,0.46),rgba(244,243,241,0.66))]" />
            <div className="auth-grid-dots absolute inset-0 opacity-65" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_bottom,rgba(72,103,130,0.07),transparent_60%)]" />

            <div className="relative z-10">
              <div className="mb-16 flex items-center gap-3">
                <div
                  className="flex size-11 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-[#486782] shadow-sm"
                >
                  <GalleryVerticalEnd className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-[#486782]">柏盛管理系统</p>
                  <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                    Curated Admin Console
                  </p>
                </div>
              </div>

              <div className="max-w-[360px] space-y-8">
                <h1 className="max-w-[8ch] text-balance text-[56px] leading-[1.08] font-bold tracking-[-0.04em]">
                  {asideTitle}
                </h1>
                <p className="max-w-[330px] text-[16px] leading-8 text-[#66727d]">{asideDescription}</p>
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
                  <p className="text-sm font-semibold tracking-[0.08em] text-[#33424d]">{noteTitle}</p>
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
              <div className="mb-12 flex items-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#486782] text-white shadow-sm">
                  <GalleryVerticalEnd className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-[#486782]">
                    柏盛管理系统
                  </p>
                  <p className="font-label text-[11px] tracking-[0.2em] text-[#8e99a3] uppercase">
                    Curated Admin Console
                  </p>
                </div>
              </div>

              <header className="mb-10 space-y-3">
                <p className="font-label text-[11px] font-semibold tracking-[0.22em] text-[#5d7388] uppercase">
                    安全登录入口
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
                  <Link
                    href={footerLinkHref}
                    className="font-semibold text-[#486782] transition-colors hover:text-[#36536a]"
                  >
                    {footerLinkLabel}
                  </Link>
                </p>
              </div>

              <div className="mt-auto flex flex-col gap-4 pt-12 text-xs text-[#97a0a8] sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 柏盛管理系统</p>
                <div className="flex items-center justify-center gap-5 sm:justify-end">
                  <a className="transition-colors hover:text-[#486782]" href="#">
                    隐私政策
                  </a>
                  <a className="transition-colors hover:text-[#486782]" href="#">
                    服务条款
                  </a>
                  <a className="transition-colors hover:text-[#486782]" href="#">
                    帮助中心
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
