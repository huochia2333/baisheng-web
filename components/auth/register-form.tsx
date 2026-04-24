"use client";

import { startTransition, useState } from "react";

import Link from "next/link";
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
import { useTranslations } from "next-intl";

import {
  getAuthSession,
  getDefaultSignedInPathForRole,
  getRoleFromAuthClaims,
} from "@/lib/auth-session-client";
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal-routes";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { AuthLoadingShell } from "./auth-loading-shell";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("RegisterForm");
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
          const role = await getRoleFromAuthClaims(supabase, session.user);
          const nextPath = role ? getDefaultSignedInPathForRole(role) : "/";

          startTransition(() => {
            router.replace(nextPath);
          });
          return;
        }
      } catch (sessionError) {
        if (!isMounted()) {
          return;
        }

        setError(formatAuthError(getErrorMessage(sessionError, t("serviceUnavailable")), t));
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
      setError(t("acceptTerms"));
      return;
    }

    setSubmitting(true);
    setError(null);

    if (!supabase) {
      setSubmitting(false);
      setError(t("serviceUnavailable"));
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
        const role = await getRoleFromAuthClaims(supabase, data.session.user);
        const nextPath = role ? getDefaultSignedInPathForRole(role) : "/";

        startTransition(() => {
          router.replace(nextPath);
        });
        return;
      }

      startTransition(() => {
        router.replace("/login?registered=1");
      });
    } catch (signUpError) {
      setError(formatAuthError(getErrorMessage(signUpError, t("serviceUnavailable")), t));
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
          label={t("username")}
          name="username"
          onChange={(event) => setName(event.target.value)}
          placeholder={t("usernamePlaceholder")}
          required
          type="text"
          value={name}
        />
        <AuthField
          autoComplete="tel"
          icon={<Phone className="size-4" />}
          label={t("phone")}
          name="phone"
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t("phonePlaceholder")}
          required
          type="tel"
          value={phone}
        />
      </div>

      <AuthField
        autoComplete="email"
        icon={<Mail className="size-4" />}
        label={t("email")}
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
        label={t("inviteCode")}
        name="inviteCode"
        onChange={(event) => setInviteCode(event.target.value)}
        placeholder={t("inviteCodePlaceholder")}
        required
        type="text"
        value={inviteCode}
      />

      <AuthField
        autoComplete="new-password"
        icon={<LockKeyhole className="size-4" />}
        label={t("password")}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={t("passwordPlaceholder")}
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
          {t("termsPrefix")}{" "}
          <Link
            className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
            href={TERMS_OF_SERVICE_PATH}
            onClick={(event) => event.stopPropagation()}
          >
            {t("terms")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            className="font-medium text-[#486782] transition-colors hover:text-[#36536a]"
            href={PRIVACY_POLICY_PATH}
            onClick={(event) => event.stopPropagation()}
          >
            {t("privacy")}
          </Link>
        </span>
      </label>

      <button
        className="mt-2 flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#486782] text-base font-semibold text-white shadow-[0_10px_30px_rgba(72,103,130,0.28)] transition-all hover:bg-[#3f5f78] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        {submitting ? t("submitting") : t("submit")}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function formatAuthError(
  message: string,
  t: (key: string) => string,
) {
  if (message.includes("referral_code is required")) {
    return t("referralRequired");
  }

  if (message.includes("referral_code does not exist")) {
    return t("referralNotFound");
  }

  if (message.includes("referral_code has reached max_uses")) {
    return t("referralMaxUses");
  }

  if (message.includes("referral_code has expired")) {
    return t("referralExpired");
  }

  if (message.includes("User already registered")) {
    return t("userExists");
  }

  return t("serviceUnavailable");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
