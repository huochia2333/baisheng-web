import type { Session, SupabaseClient } from "@supabase/supabase-js";

import {
  getDefaultSignedInPathForRole,
  type AppRole,
} from "./auth-routing";

const ACCOUNT_SWITCHER_STORAGE_KEY = "baisheng.account-switcher.alternate";
const ACCOUNT_SWITCHER_PENDING_KEY = "baisheng.account-switcher.pending";
const ACCOUNT_SWITCHER_TTL_MS = 8 * 60 * 60 * 1000;
const PENDING_LOGIN_TTL_MS = 30 * 60 * 1000;

export type AccountSwitcherStoredAccount = {
  defaultPath: string;
  displayName: string;
  email: string;
  expiresAt: number;
  lastUsedAt: number;
  reauthenticationRequiredAt?: number;
  role: AppRole;
  session: {
    accessToken: string;
    refreshToken: string;
  };
  userId: string;
};

export type AccountSwitcherPendingLogin = {
  createdAt: number;
  currentAccount: AccountSwitcherStoredAccount;
  kind: "add" | "reauthenticate";
  targetAccount?: AccountSwitcherStoredAccount;
};

export type AccountSwitcherLoginIntent = Pick<
  AccountSwitcherPendingLogin,
  "kind" | "targetAccount"
>;

export type AccountSwitcherLoginCompletion =
  | { status: "completed" | "none" }
  | { status: "role-unavailable" }
  | { currentEmail: string; status: "same-current-account" }
  | { status: "target-mismatch"; targetEmail: string };

export function getStoredAlternateAccount() {
  return readStoredAccount(ACCOUNT_SWITCHER_STORAGE_KEY);
}

export function saveStoredAlternateAccount(account: AccountSwitcherStoredAccount) {
  writeJson(ACCOUNT_SWITCHER_STORAGE_KEY, refreshStoredAccount(account));
}

export function markStoredAlternateAccountNeedsReauthentication(
  account: AccountSwitcherStoredAccount,
) {
  const nextAccount = {
    ...account,
    reauthenticationRequiredAt: Date.now(),
  } satisfies AccountSwitcherStoredAccount;

  writeJson(ACCOUNT_SWITCHER_STORAGE_KEY, nextAccount);
  return nextAccount;
}

export function removeStoredAlternateAccount() {
  removeStorageItem(ACCOUNT_SWITCHER_STORAGE_KEY);
}

export function clearAccountSwitcherStorage() {
  removeStorageItem(ACCOUNT_SWITCHER_STORAGE_KEY);
  removeStorageItem(ACCOUNT_SWITCHER_PENDING_KEY);
}

export function isStoredAccountExpired(account: AccountSwitcherStoredAccount) {
  return account.expiresAt <= Date.now();
}

export function isStoredAccountReauthenticationRequired(
  account: AccountSwitcherStoredAccount,
) {
  return Boolean(account.reauthenticationRequiredAt) || isStoredAccountExpired(account);
}

export function startAddAlternateAccount(currentAccount: AccountSwitcherStoredAccount) {
  writePendingLogin({
    createdAt: Date.now(),
    currentAccount: refreshStoredAccount(currentAccount),
    kind: "add",
  });
}

export function startAlternateAccountReauthentication({
  currentAccount,
  targetAccount,
}: {
  currentAccount: AccountSwitcherStoredAccount;
  targetAccount: AccountSwitcherStoredAccount;
}) {
  writePendingLogin({
    createdAt: Date.now(),
    currentAccount: refreshStoredAccount(currentAccount),
    kind: "reauthenticate",
    targetAccount,
  });
}

export function getAccountSwitcherLoginIntent(): AccountSwitcherLoginIntent | null {
  const pending = readPendingLogin();

  if (!pending) {
    return null;
  }

  return {
    kind: pending.kind,
    targetAccount: pending.targetAccount,
  };
}

export function completeAccountSwitcherLogin({
  role,
  session,
}: {
  role: AppRole | null;
  session: Session | null | undefined;
}): AccountSwitcherLoginCompletion {
  const pending = readPendingLogin();

  if (!pending || !session?.user) {
    return { status: "none" };
  }

  if (!role) {
    return { status: "role-unavailable" };
  }

  if (pending.currentAccount.userId === session.user.id) {
    return {
      currentEmail: pending.currentAccount.email,
      status: "same-current-account",
    };
  }

  if (pending.kind === "reauthenticate") {
    const targetAccount = pending.targetAccount;

    if (!targetAccount || targetAccount.userId !== session.user.id) {
      return {
        status: "target-mismatch",
        targetEmail: targetAccount?.email ?? "",
      };
    }
  }

  removeStorageItem(ACCOUNT_SWITCHER_PENDING_KEY);
  saveStoredAlternateAccount(pending.currentAccount);
  return { status: "completed" };
}

export async function createStoredAccountFromCurrentSession({
  displayName,
  role,
  supabase,
}: {
  displayName: string;
  role: AppRole | null;
  supabase: SupabaseClient | null;
}) {
  if (!supabase || !role) {
    throw new Error("account-switcher-unavailable");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return createStoredAccountFromSession({
    displayName,
    role,
    session,
  });
}

export function createStoredAccountFromSession({
  displayName,
  role,
  session,
}: {
  displayName: string;
  role: AppRole;
  session: Session | null | undefined;
}) {
  const email = session?.user.email?.trim();

  if (!session?.user.id || !email || !session.access_token || !session.refresh_token) {
    throw new Error("account-switcher-session-missing");
  }

  const now = Date.now();

  return {
    defaultPath: getDefaultSignedInPathForRole(role),
    displayName: displayName.trim() || email,
    email,
    expiresAt: now + ACCOUNT_SWITCHER_TTL_MS,
    lastUsedAt: now,
    role,
    session: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    },
    userId: session.user.id,
  } satisfies AccountSwitcherStoredAccount;
}

export async function restoreStoredAccountSession({
  account,
  supabase,
}: {
  account: AccountSwitcherStoredAccount;
  supabase: SupabaseClient | null;
}) {
  if (!supabase) {
    throw new Error("account-switcher-unavailable");
  }

  if (isStoredAccountExpired(account)) {
    throw new Error("account-switcher-expired");
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: account.session.accessToken,
    refresh_token: account.session.refreshToken,
  });

  if (error) {
    throw error;
  }

  if (data.session?.user.id !== account.userId) {
    throw new Error("account-switcher-session-mismatch");
  }

  return data.session;
}

function refreshStoredAccount(account: AccountSwitcherStoredAccount) {
  const now = Date.now();
  const accountReadyForSwitching = { ...account };

  delete accountReadyForSwitching.reauthenticationRequiredAt;

  return {
    ...accountReadyForSwitching,
    expiresAt: now + ACCOUNT_SWITCHER_TTL_MS,
    lastUsedAt: now,
  };
}

function readStoredAccount(key: string) {
  const parsed = readJson(key);

  if (!isStoredAccount(parsed)) {
    removeStorageItem(key);
    return null;
  }

  return parsed;
}

function readPendingLogin() {
  const parsed = readJson(ACCOUNT_SWITCHER_PENDING_KEY);

  if (!isPendingLogin(parsed)) {
    removeStorageItem(ACCOUNT_SWITCHER_PENDING_KEY);
    return null;
  }

  if (parsed.createdAt + PENDING_LOGIN_TTL_MS <= Date.now()) {
    removeStorageItem(ACCOUNT_SWITCHER_PENDING_KEY);
    return null;
  }

  return parsed;
}

function writePendingLogin(pending: AccountSwitcherPendingLogin) {
  writeJson(ACCOUNT_SWITCHER_PENDING_KEY, pending);
}

function readJson(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    clearLegacyLocalStorageItem(key);
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as unknown) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  clearLegacyLocalStorageItem(key);
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function removeStorageItem(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
  clearLegacyLocalStorageItem(key);
}

function clearLegacyLocalStorageItem(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage access failures. Session storage remains the active store.
  }
}

function isStoredAccount(value: unknown): value is AccountSwitcherStoredAccount {
  if (!value || typeof value !== "object") {
    return false;
  }

  const account = value as Partial<AccountSwitcherStoredAccount>;

  return (
    typeof account.userId === "string" &&
    typeof account.email === "string" &&
    typeof account.displayName === "string" &&
    typeof account.role === "string" &&
    typeof account.defaultPath === "string" &&
    typeof account.lastUsedAt === "number" &&
    typeof account.expiresAt === "number" &&
    (account.reauthenticationRequiredAt === undefined ||
      typeof account.reauthenticationRequiredAt === "number") &&
    typeof account.session?.accessToken === "string" &&
    typeof account.session?.refreshToken === "string"
  );
}

function isPendingLogin(value: unknown): value is AccountSwitcherPendingLogin {
  if (!value || typeof value !== "object") {
    return false;
  }

  const pending = value as Partial<AccountSwitcherPendingLogin>;

  return (
    (pending.kind === "add" || pending.kind === "reauthenticate") &&
    typeof pending.createdAt === "number" &&
    isStoredAccount(pending.currentAccount) &&
    (pending.targetAccount === undefined || isStoredAccount(pending.targetAccount))
  );
}
