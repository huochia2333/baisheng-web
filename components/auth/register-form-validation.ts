import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getErrorMessage,
  isEmailDeliveryAuthError,
  isInvalidEmailAuthError,
  isSignupDisabledAuthError,
  isTooFrequentAuthError,
  isUserAlreadyRegisteredAuthError,
  isWeakPasswordAuthError,
} from "./auth-error-messages";

type SignupReferralCodeStatus =
  | "valid"
  | "required"
  | "not_found"
  | "max_uses"
  | "expired";
type SignupReferralCodeValidationResult =
  | SignupReferralCodeStatus
  | "unavailable";

export async function validateSignupReferralCode(
  supabase: SupabaseClient,
  referralCode: string,
): Promise<SignupReferralCodeValidationResult> {
  const { data, error } = await supabase.rpc("validate_signup_referral_code", {
    _signup_referral_code: referralCode,
  });

  if (error) {
    if (isReferralValidationUnavailable(error)) {
      return "unavailable";
    }

    throw error;
  }

  return normalizeSignupReferralCodeStatus(data);
}

export function formatReferralCodeStatus(
  status: SignupReferralCodeStatus,
  t: (key: string) => string,
) {
  switch (status) {
    case "valid":
      return "";
    case "required":
      return t("referralRequired");
    case "not_found":
      return t("referralNotFound");
    case "max_uses":
      return t("referralMaxUses");
    case "expired":
      return t("referralExpired");
  }
}

export function formatAuthError(
  error: unknown,
  t: (key: string) => string,
) {
  const message = getErrorMessage(error, "");

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

  if (isUserAlreadyRegisteredAuthError(error)) {
    return t("userExists");
  }

  if (isWeakPasswordAuthError(error)) {
    return t("weakPassword");
  }

  if (isInvalidEmailAuthError(error)) {
    return t("invalidEmail");
  }

  if (isSignupDisabledAuthError(error)) {
    return t("signupDisabled");
  }

  if (isTooFrequentAuthError(error)) {
    return t("tooFrequent");
  }

  if (isEmailDeliveryAuthError(error)) {
    return t("emailDeliveryFailed");
  }

  if (message.includes("Database error saving new user")) {
    return t("registrationFailed");
  }

  return t("serviceUnavailable");
}

function normalizeSignupReferralCodeStatus(
  value: unknown,
): SignupReferralCodeStatus {
  switch (value) {
    case "valid":
    case "required":
    case "not_found":
    case "max_uses":
    case "expired":
      return value;
    default:
      return "not_found";
  }
}

function isReferralValidationUnavailable(error: unknown) {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  const message = typeof error.message === "string" ? error.message : "";

  return (
    code === "PGRST202" ||
    message.includes("validate_signup_referral_code") ||
    message.includes("Could not find the function")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
