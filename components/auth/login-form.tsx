"use client";

import { startTransition, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  getDefaultSignedInPathForRole,
  getRoleFromAuthClaims,
} from "@/lib/auth-session-client";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";

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

  const redirectToWorkspace = async (user?: Parameters<typeof getRoleFromAuthClaims>[1]) => {
    const role = supabase ? await getRoleFromAuthClaims(supabase, user) : null;
    const nextPath = role ? getDefaultSignedInPathForRole(role) : "/";

    startTransition(() => {
      router.replace(nextPath);
    });
  };

  useSupabaseAuthSync(supabase, {
    includeInitialSessionEvent: true,
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted() || !session?.user) {
        return;
      }

      await redirectToWorkspace(session.user);
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

      await redirectToWorkspace(data.session?.user);
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

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#5d7388] uppercase">
            {t("password")}
          </span>
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
        </div>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#98a3ad] transition-colors group-focus-within:text-[#486783]">
            <LockKeyhole className="size-4" />
          </span>
          <input
            autoComplete="current-password"
            className="h-[52px] w-full rounded-[22px] border border-[#ece9e4] bg-[#f2efeb]/90 pl-12 pr-4 text-[15px] text-[#22303a] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all placeholder:text-[#a9b1b8] focus:border-[#bfd2e1] focus:bg-white focus:ring-4 focus:ring-[#bfd2e1]/45 focus:outline-none disabled:cursor-wait disabled:opacity-80"
            disabled={submitting}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            type="password"
            value={password}
          />
        </div>
      </div>

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
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Invalid login credentials")) {
    return t("invalidCredentials");
  }

  if (message.includes("Email not confirmed")) {
    return t("emailNotConfirmed");
  }

  return t("serviceUnavailable");
}
