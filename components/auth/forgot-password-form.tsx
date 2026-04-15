"use client";

import { startTransition, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { getAuthSession } from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { AuthLoadingShell } from "./auth-loading-shell";

type ForgotPasswordMode = "request" | "sent" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const t = useTranslations("ForgotPasswordForm");
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

  useSupabaseAuthSync(supabase, {
    onReady: async ({ isMounted }) => {
      if (!supabase) {
        return;
      }

      try {
        if (recoveryHint) {
          setMode("reset");
        }

        const session = await getAuthSession(supabase);

        if (!isMounted()) {
          return;
        }

        if (recoveryHint && session?.user) {
          setRecoveryReady(true);
          setNotice(t("recoverySuccess"));
        }
      } catch (sessionError) {
        if (!isMounted()) {
          return;
        }

        setError(
          formatForgotPasswordError(
            getErrorMessage(sessionError, t("serviceUnavailable")),
            t,
          ),
        );
      } finally {
        if (isMounted()) {
          setCheckingRecovery(false);
        }
      }
    },
    onAuthStateChange: ({ event, isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setRecoveryReady(true);
        setError(null);
        setNotice(t("recoverySuccess"));
        return;
      }

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        recoveryHint &&
        session?.user
      ) {
        setMode("reset");
        setRecoveryReady(true);
      }
    },
  });

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
      setError(t("serviceUnavailable"));
      return;
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/forgot-password` : undefined;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setMode("sent");
      setCooldownRemaining(30);
      setNotice(t("resetEmailSent"));
    } catch (resetError) {
      if (shouldMaskForgotPasswordError(resetError)) {
        setMode("sent");
        setCooldownRemaining(30);
        setNotice(t("resetEmailSent"));
        return;
      }

      setError(
        formatForgotPasswordError(getErrorMessage(resetError, t("serviceUnavailable")), t),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);

    if (!supabase) {
      setSubmitting(false);
      setError(t("serviceUnavailable"));
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      startTransition(() => {
        router.replace("/login?passwordReset=1");
      });
    } catch (updateError) {
      setError(
        formatForgotPasswordError(getErrorMessage(updateError, t("serviceUnavailable")), t),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingRecovery || !supabase) {
    return <AuthLoadingShell variant="recovery" />;
  }

  const resetButtonLabel = submitting
    ? t("sending")
    : cooldownRemaining > 0
      ? t("resendCountdown", { seconds: cooldownRemaining })
      : mode === "sent"
        ? t("resendResetEmail")
        : t("sendResetEmail");

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
              label={t("newPassword")}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("newPasswordPlaceholder")}
              required
              type="password"
              value={password}
            />
            <AuthField
              autoComplete="new-password"
              icon={<ShieldCheck className="size-4" />}
              label={t("confirmPassword")}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              required
              type="password"
              value={confirmPassword}
            />
            <button
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              type="submit"
            >
              {submitting ? t("savingPassword") : t("savePassword")}
              <ArrowRight className="size-4" />
            </button>
          </form>
        ) : (
          <AuthLoadingShell variant="recovery" />
        )
      ) : (
        <form className="space-y-6" onSubmit={handleSendResetEmail}>
          <AuthField
            autoComplete="email"
            icon={<Mail className="size-4" />}
            label={t("email")}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={email}
          />
          <button
            className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting || cooldownRemaining > 0}
            type="submit"
          >
            {resetButtonLabel}
            <ArrowRight className="size-4" />
          </button>
        </form>
      )}

      <div className="flex items-center justify-between gap-4 text-sm text-[#6d767c]">
        <Link
          className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
          href="/login"
        >
          {t("backToLogin")}
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

function formatForgotPasswordError(
  message: string,
  t: (key: string) => string,
) {
  if (message.includes("For security purposes")) {
    return t("tooFrequent");
  }

  if (message.includes("Auth session missing")) {
    return t("authSessionMissing");
  }

  return t("serviceUnavailable");
}

function shouldMaskForgotPasswordError(error: unknown) {
  const message = getErrorMessage(error, "");
  return message.includes("User not found");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
