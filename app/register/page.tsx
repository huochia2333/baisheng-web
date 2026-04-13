import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { redirectAuthenticatedUserToWorkspace } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "注册",
};

export default async function RegisterPage() {
  await redirectAuthenticatedUserToWorkspace();

  return (
    <AuthShell
      mode="register"
      asideTitle={
        <>
          开启您的人文
          <br />
          策展管理之旅
        </>
      }
      asideDescription="在这个数字化的空间里，我们不仅管理数据，更在雕琢每一份专业深度。"
      noteTitle="系统邀请制"
      noteDescription="柏盛目前采用邀请制以保障服务质量。如果您尚未获得邀请码，请联系系统管理员或推荐人。"
      headerTitle="注册柏盛账号"
      headerDescription="请填写以下信息以创建您的管理账户。"
      footerPrompt="已有账号？"
      footerLinkHref="/login"
      footerLinkLabel="返回登录"
    >
      <RegisterForm />

      <div className="mt-8 rounded-[26px] border border-[#d5dde3] bg-[#eff4f7] p-5 text-sm text-[#627380] shadow-[0_14px_34px_rgba(115,127,139,0.07)] sm:hidden">
        <p className="mb-2 font-semibold text-[#33424d]">系统邀请制</p>
        <p className="leading-7">
          柏盛目前采用邀请制以保障服务质量。如果您尚未获得邀请码，请联系系统管理员或推荐人。
        </p>
      </div>
    </AuthShell>
  );
}
