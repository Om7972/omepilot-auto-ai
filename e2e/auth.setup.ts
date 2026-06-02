import { test as setup, expect } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    setup.skip(true, "E2E_USER_EMAIL / E2E_USER_PASSWORD not set");
  }

  if (!existsSync(dirname(authFile))) mkdirSync(dirname(authFile), { recursive: true });

  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();

  // Land on the app shell (sidebar visible).
  await expect(page.locator('[data-testid="sidebar"], aside, nav').first()).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
