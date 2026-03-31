"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
import { LayoutPanelLeft, LoaderCircle, Sparkles, UserRound } from "lucide-react";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  getCurrentSessionContext,
  getDefaultSignedInPathForRole,
  getRoleFromAccessToken,
  isPlaceholderWorkspaceRole,
  type AppRole,
} from "@/lib/user-self-service";

type PlaceholderCopy = {
  badge: string;
  title: string;
  description: string;
};

export function WorkspaceMyPlaceholder() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [role, setRole] = useState<AppRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const guardPage = async () => {
      try {
        const { user, role: nextRole } = await getCurrentSessionContext(supabase);

        if (!isMounted) {
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        if (!isPlaceholderWorkspaceRole(nextRole)) {
          router.replace(getDefaultSignedInPathForRole(nextRole));
          return;
        }

        setRole(nextRole);
        setReady(true);
      } catch {
        if (isMounted) {
          router.replace("/login");
        }
      }
    };

    void guardPage();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const nextRole = getRoleFromAccessToken(session.access_token);

      if (!isPlaceholderWorkspaceRole(nextRole)) {
        router.replace(getDefaultSignedInPathForRole(nextRole));
        return;
      }

      setRole(nextRole);
      setReady(true);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!supabase || !ready) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/90 bg-white/80 px-5 py-3 text-sm text-[#486782] shadow-[0_12px_30px_rgba(96,113,128,0.08)]">
          <LoaderCircle className="size-4 animate-spin" />
          正在准备我的页面
        </div>
      </section>
    );
  }

  const copy = getPlaceholderCopy(role);

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/78 shadow-[0_18px_45px_rgba(96,113,128,0.08)] backdrop-blur">
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-36 w-36 rounded-full bg-[rgba(92,133,168,0.16)] blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8e1e8] bg-[#f4f8fb] px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#486782] uppercase">
                <Sparkles className="size-4" />
                {copy.badge}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[#23313a] sm:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#65717b]">
                {copy.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatusCard
                icon={<UserRound className="size-5" />}
                label="当前导航"
                value="仅保留我的"
              />
              <StatusCard
                icon={<LayoutPanelLeft className="size-5" />}
                label="当前页面"
                value="占位界面"
              />
              <StatusCard
                icon={<Sparkles className="size-5" />}
                label="后续扩展"
                value="按角色补齐"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="现在已经可见"
          description="登录后会直接进入当前角色专属工作台，左侧只显示“我的”，页面不会再空白。"
        />
        <InfoCard
          title="后续可以继续加"
          description="个人资料、消息提醒、待办事项或角色专属功能都可以继续堆叠在这个位置。"
        />
      </div>
    </section>
  );
}

function getPlaceholderCopy(role: AppRole | null): PlaceholderCopy {
  if (role === "operator") {
    return {
      badge: "运营角色入口已开通",
      title: "运营角色“我的”页面占位中",
      description:
        "当前已为运营角色提供基础登录落点和专属工作台，后续可在这里继续补充个人信息、消息提醒和运营相关模块。",
    };
  }

  if (role === "manager") {
    return {
      badge: "经理角色入口已开通",
      title: "经理角色“我的”页面占位中",
      description:
        "当前已为经理角色提供基础登录落点和专属工作台，后续可在这里继续补充个人信息、审批提醒和管理相关模块。",
    };
  }

  if (role === "finance") {
    return {
      badge: "财务角色入口已开通",
      title: "财务角色“我的”页面占位中",
      description:
        "当前已为财务角色提供基础登录落点和专属工作台，后续可在这里继续补充个人信息、财务通知和结算相关模块。",
    };
  }

  if (role === "client") {
    return {
      badge: "客户角色入口已开通",
      title: "客户角色“我的”页面占位中",
      description:
        "当前已为客户角色提供基础登录落点和专属工作台，后续可在这里继续补充个人信息、服务进度和客户相关模块。",
    };
  }

  return {
    badge: "角色入口已开通",
    title: "“我的”页面占位中",
    description: "当前角色已拥有基础登录落点，后续功能会继续在这里扩展。",
  };
}

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[150px] rounded-[24px] border border-[#e8ecef] bg-[#f8fafb] px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#486782]">
        {icon}
      </div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#8a949b] uppercase">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#23313a]">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
      <h3 className="text-xl font-bold tracking-tight text-[#486782]">{title}</h3>
      <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{description}</p>
    </article>
  );
}
