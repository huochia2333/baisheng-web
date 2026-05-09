import { expect, type Page } from "@playwright/test";

import {
  getRegressionAccount,
  type RegressionAccount,
  type RegressionRole,
} from "./accounts";

export type { RegressionRole } from "./accounts";

export async function loginAs(
  page: Page,
  role: RegressionRole,
): Promise<RegressionAccount> {
  const account = getRegressionAccount(role);

  await page.goto("/login");
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(
    new RegExp(`${escapeRegExp(account.workspacePath)}/home(?:[?#].*)?$`),
    { timeout: 30_000 },
  );
  await expectWorkspaceShell(page);

  return account;
}

export async function expectWorkspaceShell(page: Page) {
  await expect(page.getByRole("heading", { name: "柏盛管理系统" })).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
}

export async function expectForbiddenPage(page: Page) {
  await expect(
    page.getByRole("heading", { name: "当前账号无权访问这个页面" }),
  ).toBeVisible();
}

export async function expectNotForbiddenPage(page: Page) {
  await expect(
    page.getByRole("heading", { name: "当前账号无权访问这个页面" }),
  ).toHaveCount(0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
