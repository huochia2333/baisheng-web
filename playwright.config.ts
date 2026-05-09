import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "1";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "output/playwright-results",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "output/playwright-report" }],
  ],
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: shouldStartWebServer
    ? {
        command: "npm run dev -- --hostname 127.0.0.1",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        url: baseURL,
      }
    : undefined,
});
