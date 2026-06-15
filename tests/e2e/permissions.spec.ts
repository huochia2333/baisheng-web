import { test } from "@playwright/test";

import { expectForbiddenPage, loginAs } from "./helpers/auth";

test.describe("workspace permission regression", () => {
  test("client cannot open the administrator workspace", async ({ page }) => {
    await loginAs(page, "client");

    await page.goto("/admin/home");

    await expectForbiddenPage(page);
  });

  test("salesman cannot open administrator review queues", async ({ page }) => {
    await loginAs(page, "salesman");

    await page.goto("/admin/tourism/reviews");

    await expectForbiddenPage(page);
  });

  test("salesman cannot open administrator operation records", async ({ page }) => {
    await loginAs(page, "salesman");

    await page.goto("/admin/tourism/records");

    await expectForbiddenPage(page);
  });

  test("salesman cannot open tourism business by default", async ({ page }) => {
    await loginAs(page, "salesman");

    await page.goto("/salesman/tourism/orders");

    await expectForbiddenPage(page);
  });

  test("promoter cannot open wholesale business by default", async ({ page }) => {
    await loginAs(page, "promoter");

    await page.goto("/promoter/wholesale/orders");

    await expectForbiddenPage(page);
  });

  test("finance cannot open salesman task workspace", async ({ page }) => {
    await loginAs(page, "finance");

    await page.goto("/salesman/tourism/tasks");

    await expectForbiddenPage(page);
  });
});
