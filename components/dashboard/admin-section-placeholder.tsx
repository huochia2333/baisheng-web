import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type AdminSectionPlaceholderProps = {
  title: string;
  description: string;
  homeHref?: string;
};

export function AdminSectionPlaceholder({
  title,
  description,
  homeHref = "/admin/my",
}: AdminSectionPlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
      <div className="rounded-[28px] border border-white/80 bg-white/72 p-8 shadow-[0_18px_45px_rgba(96,113,128,0.08)] backdrop-blur">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3ef] text-[#4c7259]">
          <Sparkles className="size-6" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#23313a]">{title}</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#65717b]">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={homeHref}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#486782] px-5 text-sm font-medium text-white transition-colors hover:bg-[#3e5f79]"
          >
            查看我的页
            <ArrowRight className="size-4" />
          </Link>
          <div className="rounded-full border border-[#d8dcdf] bg-[#f6f5f2] px-4 py-3 text-sm text-[#70808e]">
            当前模块会继续按角色扩展对应能力
          </div>
        </div>
      </div>
    </section>
  );
}
