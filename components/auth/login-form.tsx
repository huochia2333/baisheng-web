"use client";

import { startTransition, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LockKeyhole, Mail } from "lucide-react";

import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  getCurrentSession,
  getDefaultSignedInPathForRole,
  getRoleFromAccessToken,
} from "@/lib/user-self-service";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { Button } from "../ui/button";

export function LoginForm({
  registered = false,
  passwordReset = false,
}: {
  registered?: boolean;
  passwordReset?: boolean;
}) {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      try {
        const session = await getCurrentSession(supabase);

        if (!isMounted) {
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
        if (!isMounted) {
          return;
        }

        setError(formatAuthError(getErrorMessage(sessionError)));
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted || !session?.user) {
          return;
        }

        const nextPath = getDefaultSignedInPathForRole(
          getRoleFromAccessToken(session.access_token),
        );

        startTransition(() => {
          router.replace(nextPath);
        });
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!supabase) {
      setSubmitting(false);
      setError("当前服务暂时不可用，请稍后再试。");
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      startTransition(() => {
        router.replace(
          getDefaultSignedInPathForRole(
            getRoleFromAccessToken(data.session?.access_token),
          ),
        );
      });
    } catch (signInError) {
      setError(formatAuthError(getErrorMessage(signInError)));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession || !supabase) {
    return (
      <div className="rounded-[26px] border border-[#dfe5ea] bg-white/75 px-5 py-6 text-sm leading-7 text-[#647380] shadow-[0_12px_28px_rgba(115,127,139,0.06)]">
        正在检查当前登录状态...
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {registered ? (
        <AuthFeedback tone="success">
          注册请求已提交。若当前需要邮箱验证，请先完成验证后再登录。
        </AuthFeedback>
      ) : null}

      {passwordReset ? (
        <AuthFeedback tone="success">
          新密码已经更新完成，请使用新密码重新登录。
        </AuthFeedback>
      ) : null}

      {error ? <AuthFeedback tone="error">{error}</AuthFeedback> : null}

      <AuthField
        autoComplete="email"
        icon={<Mail className="size-4" />}
        label="电子邮箱"
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        required
        type="email"
        value={email}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#5d7388] uppercase">
            访问密码
          </span>
          <Link
            className="text-xs font-medium text-[#5d7388] transition-colors hover:text-[#36536a]"
            href="/forgot-password"
          >
            忘记密码？
          </Link>
        </div>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#98a3ad] transition-colors group-focus-within:text-[#486783]">
            <LockKeyhole className="size-4" />
          </span>
          <input
            autoComplete="current-password"
            className="h-[52px] w-full rounded-[22px] border border-[#ece9e4] bg-[#f2efeb]/90 pl-12 pr-4 text-[15px] text-[#22303a] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all placeholder:text-[#a9b1b8] focus:border-[#bfd2e1] focus:bg-white focus:ring-4 focus:ring-[#bfd2e1]/45 focus:outline-none"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入您的访问密码"
            required
            type="password"
            value={password}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="group inline-flex cursor-pointer items-center gap-3 text-sm text-[#6d767c]">
          <span className="relative flex size-5 items-center justify-center">
            <input
              checked={remember}
              className="peer sr-only"
              name="remember"
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            <span className="absolute inset-0 rounded-md border border-[#c7cbd0] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-colors peer-checked:border-[#486782] peer-checked:bg-[#486782]" />
            <Check className="relative size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </span>
          记住我的访问权限
        </label>
      </div>

      <Button
        className="mt-2 h-[56px] w-full rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78]"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "登录中..." : "登录"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

function formatAuthError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "邮箱或密码不正确，请重新输入。";
  }

  if (message.includes("Email not confirmed")) {
    return "邮箱尚未验证，请先完成邮箱验证。";
  }

  return message;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "当前服务暂时不可用，请稍后再试。";
}
