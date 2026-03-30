"use client";

import { startTransition, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { getBrowserSupabaseClient } from "@/lib/supabase";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { Button } from "../ui/button";

type ForgotPasswordMode = "request" | "sent" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [mode, setMode] = useState<ForgotPasswordMode>("request");
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const recoveryHint = useMemo(() => getRecoveryHint(), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const syncRecoveryState = async () => {
      if (recoveryHint) {
        setMode("reset");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (recoveryHint && session?.user) {
        setRecoveryReady(true);
        setNotice("重置链接验证成功，请设置新的登录密码。");
      }

      setCheckingRecovery(false);
    };

    void syncRecoveryState();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          return;
        }

        if (event === "PASSWORD_RECOVERY") {
          setMode("reset");
          setRecoveryReady(true);
          setError(null);
          setNotice("重置链接验证成功，请设置新的登录密码。");
          return;
        }

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && recoveryHint && session?.user) {
          setMode("reset");
          setRecoveryReady(true);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [recoveryHint, supabase]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownRemaining]);

  const handleSendResetEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (!supabase) {
      setSubmitting(false);
      setError("当前服务暂时不可用，请稍后再试。");
      return;
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/forgot-password` : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (resetError) {
      setSubmitting(false);
      setError(formatForgotPasswordError(resetError.message));
      return;
    }

    setSubmitting(false);
    setMode("sent");
    setCooldownRemaining(30);
    setNotice("重置密码邮件已发送，请检查邮箱并点击邮件里的链接继续。");
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("新密码至少需要 8 位。");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的新密码不一致，请重新确认。");
      return;
    }

    setSubmitting(true);

    if (!supabase) {
      setSubmitting(false);
      setError("当前服务暂时不可用，请稍后再试。");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSubmitting(false);
      setError(formatForgotPasswordError(updateError.message));
      return;
    }

    await supabase.auth.signOut();

    startTransition(() => {
      router.replace("/login?passwordReset=1");
    });
  };

  if (checkingRecovery || !supabase) {
    return (
      <div className="rounded-[26px] border border-[#dfe5ea] bg-white/75 px-5 py-6 text-sm leading-7 text-[#647380] shadow-[0_12px_28px_rgba(115,127,139,0.06)]">
        正在检查密码重置状态...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice ? <AuthFeedback tone="success">{notice}</AuthFeedback> : null}
      {error ? <AuthFeedback tone="error">{error}</AuthFeedback> : null}

      {mode === "reset" ? (
        recoveryReady ? (
          <form className="space-y-6" onSubmit={handleUpdatePassword}>
            <AuthField
              autoComplete="new-password"
              icon={<LockKeyhole className="size-4" />}
              label="新密码"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入新的登录密码"
              required
              type="password"
              value={password}
            />
            <AuthField
              autoComplete="new-password"
              icon={<ShieldCheck className="size-4" />}
              label="确认新密码"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="请再次输入新的登录密码"
              required
              type="password"
              value={confirmPassword}
            />
            <Button
              className="h-[56px] w-full rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78]"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "保存中..." : "保存新密码"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        ) : (
          <div className="rounded-[26px] border border-[#dfe5ea] bg-white/75 px-5 py-6 text-sm leading-7 text-[#647380] shadow-[0_12px_28px_rgba(115,127,139,0.06)]">
            正在验证重置链接，请稍候...
          </div>
        )
      ) : (
        <form className="space-y-6" onSubmit={handleSendResetEmail}>
          <AuthField
            autoComplete="email"
            icon={<Mail className="size-4" />}
            label="电子邮箱"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="请输入注册时使用的邮箱"
            required
            type="email"
            value={email}
          />
          <Button
            className="h-[56px] w-full rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78]"
            disabled={submitting || cooldownRemaining > 0}
            type="submit"
          >
            {submitting
              ? "发送中..."
              : cooldownRemaining > 0
                ? `${cooldownRemaining} 秒后可重新发送`
                : mode === "sent"
                  ? "重新发送重置邮件"
                  : "发送重置邮件"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      )}

      <div className="flex items-center justify-between gap-4 text-sm text-[#6d767c]">
        <Link
          className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
          href="/login"
        >
          返回登录
        </Link>
      </div>
    </div>
  );
}

function getRecoveryHint() {
  if (typeof window === "undefined") {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get("type") === "recovery" ||
    searchParams.get("type") === "recovery" ||
    hashParams.has("access_token") ||
    searchParams.has("code") ||
    searchParams.has("token_hash")
  );
}

function formatForgotPasswordError(message: string) {
  if (message.includes("User not found")) {
    return "没有找到这个邮箱对应的账户。";
  }

  if (message.includes("For security purposes")) {
    return "请求过于频繁，请稍后再试。";
  }

  if (message.includes("Auth session missing")) {
    return "重置链接已失效，请重新发送一封重置邮件。";
  }

  return message;
}
