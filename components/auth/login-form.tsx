"use client";

import { startTransition, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Session } from "@supabase/supabase-js";

import {
  getDefaultSignedInPathForRole,
  getRoleFromAuthClaims,
  getRoleFromAuthSession,
} from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import {
  isEmailNotConfirmedAuthError,
  isInvalidCredentialsAuthError,
  isInvalidEmailAuthError,
  isTooFrequentAuthError,
} from "./auth-error-messages";
import { AuthPasswordField } from "./auth-password-field";

export function LoginForm({
  registered = false,
  passwordReset = false,
}: {
  registered?: boolean;
  passwordReset?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("LoginForm");
  const [supabase] = useState<ReturnType<typeof getBrowserSupabaseClient>>(() =>
    typeof window !== "undefined" ? getBrowserSupabaseClient() : null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToWorkspace = async (session?: Session | null) => {
    const role =
      getRoleFromAuthSession(session) ??
      (supabase ? await getRoleFromAuthClaims(supabase, session?.user) : null);
    const nextPath = role ? getDefaultSignedInPathForRole(role) : "/";

    startTransition(() => {
      router.replace(nextPath);
    });
  };

  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent: true,
    onAuthStateChange: async ({ event, isMounted, session }) => {
      if (event !== "INITIAL_SESSION" || !isMounted() || !session?.user) {
        return;
      }

      await redirectToWorkspace(session);
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    if (!supabase) {
      setSubmitting(false);
      setError(t("serviceUnavailable"));
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

      await redirectToWorkspace(data.session);
    } catch (signInError) {
      setError(formatLoginError(signInError, t));
      setSubmitting(false);
    }
  };

  return (
    <form aria-busy={submitting} className="space-y-6" onSubmit={handleSubmit}>
      {registered ? (
        <AuthFeedback tone="success">{t("registeredNotice")}</AuthFeedback>
      ) : null}

      {passwordReset ? (
        <AuthFeedback tone="success">{t("passwordResetNotice")}</AuthFeedback>
      ) : null}

      {error ? <AuthFeedback tone="error">{error}</AuthFeedback> : null}

      <AuthField
        autoComplete="email"
        icon={<Mail className="size-4" />}
        label={t("email")}
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        required
        disabled={submitting}
        type="email"
        value={email}
      />

      <AuthPasswordField
        autoComplete="current-password"
        disabled={submitting}
        hidePasswordLabel={t("hidePassword")}
        label={t("password")}
        labelAction={
          <Link
            aria-disabled={submitting}
            className={`text-xs font-medium text-[#5d7388] transition-colors hover:text-[#36536a] ${
              submitting ? "pointer-events-none opacity-60" : ""
            }`}
            href="/forgot-password"
            onClick={(event) => {
              if (submitting) {
                event.preventDefault();
              }
            }}
            tabIndex={submitting ? -1 : undefined}
          >
            {t("forgotPassword")}
          </Link>
        }
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={t("passwordPlaceholder")}
        required
        showPasswordLabel={t("showPassword")}
        value={password}
      />

      <button
        className="mt-2 flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        {submitting ? t("submitting") : t("submit")}
        {submitting ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin" />
        ) : (
          <ArrowRight className="size-4 shrink-0" />
        )}
      </button>
    </form>
  );
}

function formatLoginError(error: unknown, t: (key: string) => string) {
  if (isInvalidCredentialsAuthError(error)) {
    return t("invalidCredentials");
  }

  if (isEmailNotConfirmedAuthError(error)) {
    return t("emailNotConfirmed");
  }

  if (isInvalidEmailAuthError(error)) {
    return t("invalidEmail");
  }

  if (isTooFrequentAuthError(error)) {
    return t("tooFrequent");
  }

  return t("serviceUnavailable");
}
