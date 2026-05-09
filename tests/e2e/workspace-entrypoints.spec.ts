import { test } from "@playwright/test";

import {
  expectNotForbiddenPage,
  expectWorkspaceShell,
  loginAs,
  type RegressionRole,
} from "./helpers/auth";

type WorkspaceEntry = {
  paths: readonly string[];
  role: RegressionRole;
};

const workspaceEntries: readonly WorkspaceEntry[] = [
  {
    paths: [
      "/admin/orders",
      "/admin/reviews",
      "/admin/people",
      "/admin/records",
      "/admin/feedback",
    ],
    role: "administrator",
  },
  {
    paths: [
      "/salesman/orders",
      "/salesman/tasks",
      "/salesman/commission",
      "/salesman/exchange-rates",
    ],
    role: "salesman",
  },
  {
    paths: ["/client/orders", "/client/referrals"],
    role: "client",
  },
  {
    paths: ["/finance/referrals", "/finance/team", "/finance/commission"],
    role: "finance",
  },
];

test.describe("workspace entrypoint regression", () => {
  for (const entry of workspaceEntries) {
    test(`${entry.role} can open key workspace sections`, async ({ page }) => {
      await loginAs(page, entry.role);

      for (const workspacePath of entry.paths) {
        await page.goto(workspacePath);
        await expectWorkspaceShell(page);
        await expectNotForbiddenPage(page);
      }
    });
  }
});
