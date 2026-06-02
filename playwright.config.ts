import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Omepilot e2e + visual regression.
 *
 * Required env (set in .env.e2e or your shell):
 *   E2E_BASE_URL          - URL of a running app (defaults to http://localhost:8080)
 *   E2E_USER_EMAIL        - test account email
 *   E2E_USER_PASSWORD     - test account password
 *
 * Run locally:
 *   npx playwright install --with-deps
 *   npm run e2e
 *   npm run e2e:update-snapshots  # refresh visual baselines
 */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: {
      // tolerate sub-pixel AA + font-rendering jitter across machines
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    storageState: "e2e/.auth/user.json",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "tablet",
      dependencies: ["setup"],
      testMatch: /visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      testMatch: /visual\.spec\.ts/,
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
