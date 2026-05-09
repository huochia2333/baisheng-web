import { test } from "@playwright/test";

import { loginAs, type RegressionRole } from "./helpers/auth";

const roles: readonly RegressionRole[] = [
  "administrator",
  "salesman",
  "client",
  "finance",
];

test.describe("authentication regression", () => {
  for (const role of roles) {
    test(`${role} can sign in and reach its home workspace`, async ({ page }) => {
      await loginAs(page, role);
    });
  }
});
