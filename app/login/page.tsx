import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "登录",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string; registered?: string }>;
}) {
  await redirectAuthenticatedUserToWorkspace();

  const params = await searchParams;

  return (
    <AuthShell
      mode="login"
      asideTitle="让每一次协作都有迹可循"
      asideDescription="专为追求效率的合作伙伴打造。在这里，数据即沟通。"
      noteTitle="今日灵感"
      noteDescription="设计不只是视觉，更是一种思考和呼吸的方式。"
      headerTitle="欢迎回来"
      headerDescription="请输入您的凭据访问柏盛管理系统。"
      footerPrompt="还没有账号？"
      footerLinkHref="/register"
      footerLinkLabel="立即注册"
    >
      <LoginForm
        passwordReset={params.passwordReset === "1"}
        registered={params.registered === "1"}
      />

      <div className="mt-8 rounded-[26px] border border-[#e7e5e0] bg-white/72 p-5 text-sm text-[#707981] shadow-[0_12px_32px_rgba(115,127,139,0.07)] sm:hidden">
        <p className="mb-2 font-semibold text-[#33424d]">今日灵感</p>
        <p className="leading-7">设计不只是视觉，更是一种思考和呼吸的方式。</p>
      </div>
    </AuthShell>
  );
}
