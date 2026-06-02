/**
 * E2E: Conversation Rename / Pin / Archive / Delete persist across a full
 * page refresh for Omepilot.
 *
 * Each test creates its own conversation via the "New chat" affordance, then
 * acts on it through the conversation row's dropdown, reloads the page, and
 * re-asserts the post-state. This avoids depending on pre-seeded data.
 */
import { test, expect, type Page } from "@playwright/test";

async function createConversation(page: Page, seedMessage: string): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: /new chat/i }).first().click();

  // Send a message so the conversation is persisted with an auto-title.
  const composer = page.getByPlaceholder("Message Omepilot");
  await composer.fill(seedMessage);
  await composer.press("Enter");

  // Wait for navigation to /chat/<id>
  await page.waitForURL(/\/chat\/[0-9a-f-]{36}/, { timeout: 20_000 });
  const id = page.url().split("/chat/")[1];
  // Wait for the row to appear in the sidebar.
  await expect(page.locator(`[data-conversation-id="${id}"], a[href="/chat/${id}"]`).first()).toBeVisible();
  return id;
}

async function openRowMenu(page: Page, id: string) {
  const row = page.locator(`[data-conversation-id="${id}"], a[href="/chat/${id}"]`).first();
  await row.hover();
  await row.locator("button").last().click();
}

test.describe("Conversation actions persist after refresh", () => {
  test("rename persists", async ({ page }) => {
    const id = await createConversation(page, "rename target");
    await openRowMenu(page, id);
    await page.getByRole("menuitem", { name: /rename/i }).click();

    const newTitle = `Renamed ${Date.now()}`;
    const input = page.locator('input[value], input').filter({ hasText: "" }).first();
    await input.fill(newTitle);
    await input.press("Enter");

    await expect(page.getByText("Title updated")).toBeVisible();

    await page.reload();
    await expect(page.getByText(newTitle).first()).toBeVisible();
  });

  test("pin persists", async ({ page }) => {
    const id = await createConversation(page, "pin target");
    await openRowMenu(page, id);
    await page.getByRole("menuitem", { name: /pin chat/i }).click();
    await expect(page.getByText("Pinned")).toBeVisible();

    await page.reload();
    // Pinned items render with a Pin badge inside the row.
    const row = page.locator(`[data-conversation-id="${id}"], a[href="/chat/${id}"]`).first();
    await expect(row.locator("svg.lucide-pin, [data-pinned='true']").first()).toBeVisible();
  });

  test("archive persists", async ({ page }) => {
    const id = await createConversation(page, "archive target");
    await openRowMenu(page, id);
    await page.getByRole("menuitem", { name: /^archive$/i }).click();
    await expect(page.getByText("Conversation archived")).toBeVisible();

    await page.reload();
    // Archived rows do not appear in the active list.
    await expect(
      page.locator(`a[href="/chat/${id}"]`).filter({ hasNot: page.locator("[data-archived]") })
    ).toHaveCount(0);
  });

  test("delete persists", async ({ page }) => {
    const id = await createConversation(page, "delete target");
    await openRowMenu(page, id);
    await page.getByRole("menuitem", { name: /^delete$/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page.getByText("Conversation deleted")).toBeVisible();

    await page.reload();
    await expect(page.locator(`a[href="/chat/${id}"]`)).toHaveCount(0);
  });
});
