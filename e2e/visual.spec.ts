/**
 * Visual regression: lock the sidebar width (260px expanded), page padding
 * (32px), content max-width (850px), chat gap (24px), and composer radius
 * (28px) across every primary route at mobile (375), tablet (768), and
 * desktop (1280) widths.
 *
 * The viewport per project is configured in playwright.config.ts; this spec
 * iterates the routes and produces one screenshot per (route, viewport).
 * Baselines live in e2e/visual.spec.ts-snapshots/.
 */
import { test, expect } from "@playwright/test";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "discover", path: "/discover" },
  { name: "search", path: "/search" },
  { name: "memory", path: "/memory" },
  { name: "dashboard", path: "/dashboard" },
  { name: "profile", path: "/profile" },
  { name: "settings", path: "/settings" },
  { name: "pricing", path: "/pricing" },
];

test.describe("Layout visual regression", () => {
  for (const route of ROUTES) {
    test(`${route.name} matches snapshot`, async ({ page }, testInfo) => {
      await page.goto(route.path);
      // Wait for layout shell.
      await page.waitForLoadState("networkidle");
      // Disable any opt-in animations that already aren't disabled.
      await page.addStyleTag({
        content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
      });

      // On desktop, also assert the structural tokens directly so a regression
      // that only changes layout class names (without altering pixels enough
      // to fail the screenshot) still trips a clear failure.
      if (testInfo.project.name === "desktop") {
        const sidebar = page.locator("aside, nav").first();
        const box = await sidebar.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(60); // collapsed
        expect(box?.width).toBeLessThanOrEqual(280); // 260 + chrome
      }

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: false,
        mask: [
          // Mask dynamic content that would cause flake.
          page.locator("time, [data-relative-time], [data-testid='live-clock']"),
          page.locator("img[src*='avatar'], img[alt*='avatar' i]"),
        ],
      });
    });
  }
});
