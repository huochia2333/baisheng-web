import { expect, test, type Page } from "@playwright/test";

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
      "/admin/accounts",
      "/admin/announcements",
      "/admin/feedback",
      "/admin/settings",
      "/admin/tourism/orders",
      "/admin/tourism/reviews",
      "/admin/tourism/people",
      "/admin/tourism/records",
      "/admin/wholesale/orders",
    ],
    role: "administrator",
  },
  {
    paths: [
      "/salesman/wholesale/orders",
      "/salesman/wholesale/order-claims",
      "/salesman/wholesale/logistics",
      "/salesman/wholesale/people",
      "/salesman/wholesale/incentives",
    ],
    role: "salesman",
  },
  {
    paths: [
      "/promoter/tourism/orders",
      "/promoter/tourism/tasks",
      "/promoter/tourism/commission",
      "/promoter/tourism/people",
    ],
    role: "promoter",
  },
  {
    paths: ["/client/tourism/orders", "/client/tourism/referrals"],
    role: "client",
  },
  {
    paths: [
      "/finance/tourism/referrals",
      "/finance/tourism/team",
      "/finance/tourism/commission",
    ],
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

  test("desktop business group can collapse while the current section is active", async ({
    page,
  }) => {
    await loginAs(page, "administrator");
    await page.goto("/admin/wholesale/orders");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    const sidebar = page.locator("aside").first();
    const wholesaleGroupButton = sidebar.getByRole("button", {
      name: "批发业务",
    });
    const wholesaleOrdersLink = sidebar.getByRole("link", {
      name: "批发订单",
    });

    await expect(wholesaleGroupButton).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(wholesaleOrdersLink).toBeVisible();

    await wholesaleGroupButton.click();

    await expect(wholesaleGroupButton).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(wholesaleOrdersLink).toBeHidden();

    await wholesaleGroupButton.click();

    await expect(wholesaleGroupButton).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(wholesaleOrdersLink).toBeVisible();
  });

  for (const entry of [
    {
      copyButtonTestId: "home-invite-copy-link-wholesale",
      role: "salesman" as const,
    },
    {
      copyButtonTestId: "home-invite-copy-link-tourism",
      role: "promoter" as const,
    },
  ]) {
    test(`${entry.role} registration link uses the single invite code`, async ({
      page,
    }) => {
      await mockClipboard(page);
      await loginAs(page, entry.role);

      const inviteCode = (
        await page.getByTestId("home-invite-code").innerText()
      )
        .trim()
        .toUpperCase();

      await page.getByTestId(entry.copyButtonTestId).click();

      const copiedLink = await page.evaluate(() =>
        window.localStorage.getItem("__lastCopiedInviteLink") ?? "",
      );
      const copiedUrl = new URL(copiedLink);

      expect(copiedUrl.pathname).toBe("/register");
      expect(copiedUrl.searchParams.get("ref")).toBe(inviteCode);
      expect(copiedUrl.searchParams.has("board")).toBe(false);
      expect(copiedUrl.searchParams.get("ref")).not.toMatch(/-[TD]$/);
    });
  }

  test("wholesale order list can filter by ordered date range", async ({
    page,
  }) => {
    await loginAs(page, "administrator");
    await page.goto("/admin/wholesale/orders");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    const orderedFromInput = page.getByLabel("下单日期从");
    const orderedToInput = page.getByLabel("下单日期到");
    const clearFiltersButton = page.getByRole("button", { name: "清空筛选" });
    const assessmentButton = page.getByRole("button", {
      name: "生成当前范围评估",
    });

    await expect(orderedFromInput).toBeVisible();
    await expect(orderedToInput).toBeVisible();
    await expect(page.getByText("AI订单评估")).toBeVisible();
    await expect(assessmentButton).toBeVisible();

    await orderedFromInput.fill("2099-01-01");
    await orderedToInput.fill("2099-01-31");

    await expect(orderedFromInput).toHaveValue("2099-01-01");
    await expect(orderedToInput).toHaveValue("2099-01-31");
    await expect(clearFiltersButton).toBeEnabled();
    await expect(assessmentButton).toBeDisabled();
    await expect(
      page.getByText("当前筛选条件下没有订单，调整日期或筛选条件后再生成评估。"),
    ).toBeVisible();

    await clearFiltersButton.click();

    await expect(orderedFromInput).toHaveValue("");
    await expect(orderedToInput).toHaveValue("");

    await page.route("**/api/wholesale/order-assessment", async (route) => {
      await route.fulfill({
        body: "**订单概况**\n* 当前范围共 2 笔订单。\n* 状态分布正常。",
        contentType: "text/plain; charset=utf-8",
      });
    });

    await expect(assessmentButton).toBeEnabled();
    await assessmentButton.click();

    const assessmentOutput = page.getByTestId(
      "wholesale-order-assessment-output",
    );

    await expect(assessmentOutput).toContainText("订单概况");
    await expect(assessmentOutput).toContainText("当前范围共 2 笔订单。");
    await expect(assessmentOutput).not.toContainText("**");
    await expect(assessmentOutput).not.toContainText("*");
  });

  test("wholesale claim page separates assisted, hall, and claimed orders", async ({
    page,
  }) => {
    await loginAs(page, "administrator");
    await page.goto("/admin/wholesale/order-claims");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    await expect(page.getByRole("button", { name: /待分类/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /认领大厅/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /已认领/ })).toBeVisible();
    await expect(page.getByText("1688-LOCAL-003")).toBeVisible();
    await expect(page.getByText("Wholesale Beta").first()).toBeVisible();

    await page.getByRole("button", { name: /认领大厅/ }).click();
    await expect(page.getByText("1688-LOCAL-004")).toBeVisible();
    await expect(page.getByText("Unknown Buyer")).toBeVisible();

    await page.getByRole("button", { name: /已认领/ }).click();
    await expect(page.getByText("1688-LOCAL-001")).toBeVisible();
    await expect(page.getByText("1688-LOCAL-002")).toBeVisible();

    await page.getByRole("button", { name: /待分类/ }).click();
    await page.getByRole("button", { name: "确认归属" }).click();
    await expect(
      page.getByText("请确认要关联的批发订单。"),
    ).toBeVisible();
    await expect(page.getByLabel("客户")).toHaveValue(
      "c1000000-0000-4000-8000-000000000002",
    );
    await expect(page.getByLabel("关联批发订单")).toBeEnabled();
  });

  test("salesman wholesale people only shows scoped customers", async ({
    page,
  }) => {
    await loginAs(page, "salesman");
    await page.goto("/salesman/wholesale/people");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    await expect(page.getByText("Wholesale Alpha").first()).toBeVisible();
    await expect(page.getByText("Wholesale Beta").first()).toBeVisible();
    await expect(page.getByText("Promoter Wholesale Shop")).toHaveCount(0);

    await page.getByRole("button", { name: /业务员账户/ }).click();

    await expect(page.getByText("本地业务员").first()).toBeVisible();
    await expect(page.getByText("本地地推")).toHaveCount(0);
  });

  test("tourism order list can filter by ordered date range", async ({
    page,
  }) => {
    await loginAs(page, "administrator");
    await page.goto("/admin/tourism/orders");
    await expectWorkspaceShell(page);
    await expectNotForbiddenPage(page);

    const createdFromInput = page.getByLabel("下单日期从");
    const createdToInput = page.getByLabel("下单日期到");
    const clearFiltersButton = page.getByRole("button", { name: "清空筛选" });

    await expect(createdFromInput).toBeVisible();
    await expect(createdToInput).toBeVisible();
    await page.waitForTimeout(1000);

    await createdFromInput.fill("2099-01-01");
    await createdToInput.fill("2099-01-31");

    await expect(createdFromInput).toHaveValue("2099-01-01");
    await expect(createdToInput).toHaveValue("2099-01-31");
    await expect(page.getByText("没有匹配结果")).toBeVisible();
    await expect(clearFiltersButton).toBeEnabled();

    await clearFiltersButton.click();

    await expect(createdFromInput).toHaveValue("");
    await expect(createdToInput).toHaveValue("");
  });
});

async function mockClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          window.localStorage.setItem("__lastCopiedInviteLink", value);
        },
      },
    });
  });
}
