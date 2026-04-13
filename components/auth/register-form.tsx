"use client";

import { startTransition, useState } from "react";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import {
  getAuthSession,
  getDefaultSignedInPathForRole,
  getRoleFromAccessToken,
} from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { AuthLoadingShell } from "./auth-loading-shell";

export function RegisterForm() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useSupabaseAuthSync(supabase, {
    onReady: async ({ isMounted }) => {
      if (!supabase) {
        return;
      }

      try {
        const session = await getAuthSession(supabase);

        if (!isMounted()) {
          return;
        }

        if (session?.user) {
          const nextPath = getDefaultSignedInPathForRole(
            getRoleFromAccessToken(session.access_token),
          );

          startTransition(() => {
            router.replace(nextPath);
          });
          return;
        }
      } catch (sessionError) {
        if (!isMounted()) {
          return;
        }

        setError(formatAuthError(getErrorMessage(sessionError)));
      } finally {
        if (isMounted()) {
          setCheckingSession(false);
        }
      }
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acceptedTerms) {
      setError("请先阅读并同意服务条款与隐私政策。");
      return;
    }

    setSubmitting(true);
    setError(null);

    if (!supabase) {
      setSubmitting(false);
      setError("当前服务暂时不可用，请稍后再试。");
      return;
    }

    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            referral_code: normalizedInviteCode,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session?.user) {
        const nextPath = getDefaultSignedInPathForRole(
          getRoleFromAccessToken(data.session.access_token),
        );

        startTransition(() => {
          router.replace(nextPath);
        });
        return;
      }

      startTransition(() => {
        router.replace("/login?registered=1");
      });
    } catch (signUpError) {
      setError(formatAuthError(getErrorMessage(signUpError)));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession || !supabase) {
    return <AuthLoadingShell variant="register" />;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error ? <AuthFeedback tone="error">{error}</AuthFeedback> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <AuthField
          autoComplete="username"
          icon={<UserRound className="size-4" />}
          label="用户名"
          name="username"
          onChange={(event) => setName(event.target.value)}
          placeholder="您的姓名或代号"
          required
          type="text"
          value={name}
        />
        <AuthField
          autoComplete="tel"
          icon={<Phone className="size-4" />}
          label="手机号"
          name="phone"
          onChange={(event) => setPhone(event.target.value)}
          placeholder="11 位手机号"
          required
          type="tel"
          value={phone}
        />
      </div>

      <AuthField
        autoComplete="email"
        icon={<Mail className="size-4" />}
        label="电子邮箱"
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="example@bs-system.com"
        required
        type="email"
        value={email}
      />

      <AuthField
        autoComplete="one-time-code"
        icon={<KeyRound className="size-4" />}
        label="邀请码"
        name="inviteCode"
        onChange={(event) => setInviteCode(event.target.value)}
        placeholder="必填项"
        required
        type="text"
        value={inviteCode}
      />

      <AuthField
        autoComplete="new-password"
        icon={<LockKeyhole className="size-4" />}
        label="设置密码"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="包含字母与数字的 8 位以上密码"
        required
        type="password"
        value={password}
      />

      <label className="flex items-start gap-3 pt-1 text-sm leading-6 text-[#6d767c]">
        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
          <input
            checked={acceptedTerms}
            className="peer sr-only"
            name="terms"
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            type="checkbox"
          />
          <span className="absolute inset-0 rounded-md border border-[#c7cbd0] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-colors peer-checked:border-[#486782] peer-checked:bg-[#486782]" />
          <Check className="relative size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span>
          我已阅读并同意{" "}
          <a
            className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
            href="#"
          >
            服务条款
          </a>{" "}
          和{" "}
          <a
            className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
            href="#"
          >
            隐私政策
          </a>
        </span>
      </label>

      <button
        className="mt-2 h-[58px] w-full rounded-[20px] bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "注册中..." : "立即注册并开启体验"}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function formatAuthError(message: string) {
  if (message.includes("referral_code is required")) {
    return "邀请码不能为空。";
  }

  if (message.includes("referral_code does not exist")) {
    return "邀请码不存在，请确认后重新输入。";
  }

  if (message.includes("referral_code has reached max_uses")) {
    return "邀请码已达到使用上限。";
  }

  if (message.includes("referral_code has expired")) {
    return "邀请码已过期，请联系管理员获取新的邀请码。";
  }

  if (message.includes("User already registered")) {
    return "该邮箱已注册，请直接登录。";
  }

  return message;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "当前服务暂时不可用，请稍后再试。";
}
