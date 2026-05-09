import fs from "node:fs";
import path from "node:path";

export type RegressionRole = "administrator" | "salesman" | "client" | "finance";

export type RegressionAccount = {
  email: string;
  password: string;
  role: RegressionRole;
  workspacePath: string;
};

const ROLE_ENV_PREFIX: Record<RegressionRole, string> = {
  administrator: "E2E_ADMIN",
  client: "E2E_CLIENT",
  finance: "E2E_FINANCE",
  salesman: "E2E_SALESMAN",
};

const ROLE_WORKSPACE_PATH: Record<RegressionRole, string> = {
  administrator: "/admin",
  client: "/client",
  finance: "/finance",
  salesman: "/salesman",
};

const FALLBACK_ROLE_ORDER: readonly RegressionRole[] = [
  "administrator",
  "salesman",
  "client",
  "finance",
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_PATTERN = /[A-Za-z0-9!#$%&*+./:<=>?@^_`{|}~-]{8,}/g;

let cachedAccounts: Partial<Record<RegressionRole, RegressionAccount>> | null = null;

export function getRegressionAccount(role: RegressionRole): RegressionAccount {
  const accounts = loadRegressionAccounts();
  const account = accounts[role];

  if (!account) {
    throw new Error(
      `Missing ${role} regression account. Set ${ROLE_ENV_PREFIX[role]}_EMAIL and ${ROLE_ENV_PREFIX[role]}_PASSWORD, or keep the local test account file available.`,
    );
  }

  return account;
}

function loadRegressionAccounts() {
  if (cachedAccounts) {
    return cachedAccounts;
  }

  cachedAccounts = {
    ...loadAccountsFromLocalFile(),
    ...loadAccountsFromEnv(),
  };

  return cachedAccounts;
}

function loadAccountsFromEnv(): Partial<Record<RegressionRole, RegressionAccount>> {
  const accounts: Partial<Record<RegressionRole, RegressionAccount>> = {};

  for (const role of FALLBACK_ROLE_ORDER) {
    const prefix = ROLE_ENV_PREFIX[role];
    const email = process.env[`${prefix}_EMAIL`]?.trim();
    const password = process.env[`${prefix}_PASSWORD`];

    if (email && password) {
      accounts[role] = {
        email,
        password,
        role,
        workspacePath: ROLE_WORKSPACE_PATH[role],
      };
    }
  }

  return accounts;
}

function loadAccountsFromLocalFile(): Partial<Record<RegressionRole, RegressionAccount>> {
  const accountFilePath =
    process.env.E2E_ACCOUNTS_FILE?.trim() ||
    path.resolve(process.cwd(), "..", "测试账号.txt");

  if (!fs.existsSync(accountFilePath)) {
    return {};
  }

  const text = fs.readFileSync(accountFilePath, "utf8");
  const emails = Array.from(text.matchAll(EMAIL_PATTERN), (match) => match[0]);
  const passwords = text
    .split(/\r?\n/)
    .filter((line) => !line.match(EMAIL_PATTERN))
    .flatMap((line) => Array.from(line.matchAll(SECRET_PATTERN), (match) => match[0]));
  const accounts: Partial<Record<RegressionRole, RegressionAccount>> = {};

  FALLBACK_ROLE_ORDER.forEach((role, index) => {
    const email = emails[index];
    const password = passwords[index];

    if (email && password) {
      accounts[role] = {
        email,
        password,
        role,
        workspacePath: ROLE_WORKSPACE_PATH[role],
      };
    }
  });

  return accounts;
}
