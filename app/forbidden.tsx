import Link from "next/link";

import { getTranslations } from "next-intl/server";

export default async function Forbidden() {
  const t = await getTranslations("ForbiddenPage");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f6f2ea_0%,#f3f7fa_48%,#edf2f6_100%)] px-6 py-16">
      <section className="w-full max-w-xl rounded-[32px] border border-white/90 bg-white/90 p-8 shadow-[0_24px_80px_rgba(35,49,58,0.12)] sm:p-10">
        <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#23313a]">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#69747d]">{t("description")}</p>
        <div className="mt-8">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#486782] px-5 text-sm font-semibold text-white transition hover:bg-[#3e5f79]"
            href="/"
          >
            {t("primaryAction")}
          </Link>
        </div>
      </section>
    </main>
  );
}
