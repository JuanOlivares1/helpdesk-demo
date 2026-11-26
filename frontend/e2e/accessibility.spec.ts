import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("keeps a logical keyboard focus order", async ({ page }) => {
  await page.goto("/login");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "HelpDesk" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /^Theme:/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Register" })).toBeFocused();
  await page.keyboard.press("Tab");

  const email = page.getByLabel("Email");
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS("outline-style", "solid");
});

test("moves focus into the main landmark with the skip link", async ({ page }) => {
  await page.goto("/login");

  const skip = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skip).toBeVisible();
  await expect(skip).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
});

test("opens links with Enter and closes the dialog with Escape", async ({
  page,
}) => {
  await signIn(page, "admin.demo@helpdesk.test");

  const firstTicket = page.locator("tbody tr").first().getByRole("link");
  await firstTicket.focus();
  await expect(firstTicket).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ticket\/\d+/);

  await page.goto("/");
  await page.getByRole("button", { name: "New ticket" }).first().focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/new=1/);
});

test("follows the system theme until a choice overrides it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");

  const toggle = page.getByRole("button", { name: /^Theme:/ });
  const themeColor = page.locator('meta[name="theme-color"]');

  await expect(toggle).toHaveAttribute("aria-label", /^Theme: System\./);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(themeColor).toHaveAttribute("content", "#0e1518");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await expect(themeColor).toHaveAttribute("content", "#f6f8f7");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Theme: Light\./);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Theme: Dark\./);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});

test("honors prefers-reduced-motion", async ({ page }) => {
  const scrollBehavior = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await expect.poll(scrollBehavior).toBe("auto");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(scrollBehavior).toBe("smooth");
});
