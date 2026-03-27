import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "忘记密码",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      mode="login"
      asideTitle="找回访问权限"
      asideDescription="通过邮箱完成密码重置，几分钟内就能重新回到你的协作空间。"
      noteTitle="密码重置"
      noteDescription="系统会把重置链接发送到你的注册邮箱。点击邮件中的链接后，会回到当前页面继续设置新密码。"
      headerTitle="忘记密码"
      footerPrompt="想起密码了？"
      footerLinkHref="/login"
      footerLinkLabel="返回登录"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
