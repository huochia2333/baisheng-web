import { expect, test, type Page } from "@playwright/test";

import {
  expectForbiddenPage,
  expectNotForbiddenPage,
  expectWorkspaceShell,
  loginAs,
} from "./helpers/auth";

test.describe("finance business access", () => {
  test("finance can open key wholesale sections", async ({ page }) => {
    await loginAs(page, "finance");

    for (const workspacePath of [
      "/finance/wholesale/orders",
      "/finance/wholesale/logistics",
      "/finance/wholesale/commission",
      "/finance/wholesale/incentives",
    ]) {
      await page.goto(workspacePath);
      await expectWorkspaceShell(page);
      await expectNotForbiddenPage(page);
    }
  });

  test("finance sees both business groups on desktop and mobile", async ({
    page,
  }) => {
    await loginAs(page, "finance");
    await page.goto("/finance/wholesale/orders");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    const desktopSidebar = page.locator("aside").first();
    await expect(
      desktopSidebar.getByRole("button", { name: "旅游业务" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("button", { name: "批发业务" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "批发订单" }),
    ).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/finance/wholesale/orders");

    const mobileHeader = page.locator("header").first();
    await expect(page.getByRole("heading", { name: "批发订单" })).toBeVisible();
    await mobileHeader
      .getByRole("button", { name: "批发业务 / 批发订单" })
      .click();

    const mobileNav = mobileHeader.locator("nav");
    await expect(
      mobileNav.getByText("旅游业务", { exact: true }),
    ).toBeVisible();
    await expect(
      mobileNav.getByText("批发业务", { exact: true }),
    ).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page);
  });

  test("finance cannot open hidden wholesale management pages", async ({
    page,
  }) => {
    await loginAs(page, "finance");

    await page.goto("/finance/wholesale/customers");

    await expectForbiddenPage(page);
  });
});

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const overflowPixels = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );

  expect(overflowPixels).toBeLessThanOrEqual(2);
}
