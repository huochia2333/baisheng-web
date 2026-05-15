"use client";

import { startTransition, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  KeyRound,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  getDefaultSignedInPathForRole,
  getRoleFromAuthClaims,
} from "@/lib/auth-session-client";
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal-routes";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { AuthFeedback } from "./auth-feedback";
import { AuthField } from "./auth-field";
import { AuthPasswordField } from "./auth-password-field";
import { getPasswordPolicyState } from "./auth-password-policy";
import {
  formatAuthError,
  formatReferralCodeStatus,
  validateSignupReferralCode,
} from "./register-form-validation";

type SignupBusinessBoard = "" | "tourism" | "dropshipping";

type RegisterFormProps = {
  initialBusinessBoard?: string | null;
  initialInviteCode?: string | null;
};

export function RegisterForm({
  initialBusinessBoard = null,
  initialInviteCode = null,
}: RegisterFormProps) {
  const router = useRouter();
  const t = useTranslations("RegisterForm");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState(
    normalizeInitialInviteCode(initialInviteCode),
  );
  const [businessBoard, setBusinessBoard] = useState<SignupBusinessBoard>(
    normalizeInitialBusinessBoard(initialBusinessBoard),
  );
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const passwordPolicy = getPasswordPolicyState(password);
  const passwordHint =
    password.length > 0 && passwordPolicy.isValid ? t("passwordReady") : t("passwordHint");
  const passwordHintTone =
    password.length === 0 ? "default" : passwordPolicy.isValid ? "success" : "warning";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acceptedTerms) {
      setError(t("acceptTerms"));
      return;
    }

    if (!passwordPolicy.isValid) {
      setError(t("passwordPolicy"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setSubmitting(false);
      setError(t("serviceUnavailable"));
      return;
    }

    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const selectedBusinessBoard = businessBoard || null;
    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

    try {
      const referralCodeStatus = await validateSignupReferralCode(
        supabase,
        normalizedInviteCode,
        selectedBusinessBoard,
      );

      if (referralCodeStatus !== "valid" && referralCodeStatus !== "unavailable") {
        setError(formatReferralCodeStatus(referralCodeStatus, t));
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            referral_code: normalizedInviteCode,
            ...(selectedBusinessBoard
              ? { business_board: selectedBusinessBoard }
              : {}),
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
      setError(formatAuthError(signUpError, t));
    } finally {
      setSubmitting(false);
    }
  };

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

      <label className="flex flex-col gap-2">
        <span className="pl-1 font-label text-[11px] font-semibold tracking-[0.18em] text-[#5d7388] uppercase">
          {t("businessBoard")}
        </span>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#98a3ad] transition-colors group-focus-within:text-[#486783]">
            <BriefcaseBusiness className="size-4" />
          </span>
          <select
            className="h-[52px] w-full rounded-[22px] border border-[#ece9e4] bg-[#f2efeb]/90 pl-12 pr-10 text-[15px] text-[#22303a] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all focus:border-[#bfd2e1] focus:bg-white focus:ring-4 focus:ring-[#bfd2e1]/45 focus:outline-none disabled:cursor-wait disabled:opacity-80"
            disabled={submitting}
            name="businessBoard"
            onChange={(event) =>
              setBusinessBoard(normalizeInitialBusinessBoard(event.target.value))
            }
            value={businessBoard}
          >
            <option value="">{t("businessBoardAuto")}</option>
            <option value="tourism">{t("businessBoardTourism")}</option>
            <option value="dropshipping">{t("businessBoardDropshipping")}</option>
          </select>
        </div>
        <span className="pl-1 text-xs leading-5 text-[#8b959d]">
          {t("businessBoardHint")}
        </span>
      </label>

      <AuthPasswordField
        autoComplete="new-password"
        disabled={submitting}
        hidePasswordLabel={t("hidePassword")}
        hint={passwordHint}
        hintTone={passwordHintTone}
        label={t("password")}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={t("passwordPlaceholder")}
        required
        showPasswordLabel={t("showPassword")}
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

function normalizeInitialInviteCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? "";
}

function normalizeInitialBusinessBoard(
  value: string | null | undefined,
): SignupBusinessBoard {
  const normalized = value?.trim().toLowerCase();

  return normalized === "tourism" || normalized === "dropshipping"
    ? normalized
    : "";
}
