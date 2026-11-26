import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("creates a user and changes access from the directory", async ({
  page,
}) => {
  await signIn(page, "admin.demo@helpdesk.test");
  await page.getByRole("link", { name: "Users" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const email = `e2e.user.${Date.now()}@helpdesk.test`;
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByLabel("Temporary password").fill("E2EPass123");
  await dialog.getByLabel("Access role").selectOption("agent");
  await dialog.getByRole("button", { name: "Create user" }).click();

  await expect(dialog).toBeHidden();
  const row = page.locator("tbody tr").filter({ hasText: email });
  await expect(row).toBeVisible();

  await row.getByLabel(`Role for ${email}`).selectOption("client");
  await row.getByRole("button", { name: "Save" }).click();

  await expect(row.getByText("Access updated.")).toBeVisible();
  await expect(row.getByLabel(`Role for ${email}`)).toHaveValue("client");
  await expect(row.locator("span.badge")).toHaveText("Client");
});

test("shows inline field errors from a 422 response", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");
  await page.goto("/users");

  await page.route("**/api/users/", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ errors: { email: ["Email is invalid"] } }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill("invalid@example.com");
  await dialog.getByLabel("Temporary password").fill("E2EPass123");
  await dialog.getByRole("button", { name: "Create user" }).click();

  await expect(dialog.getByText("Email is invalid")).toBeVisible();
  await expect(dialog.getByLabel("Email")).toBeFocused();
});

test("keeps the current admin read-only", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");
  await page.goto("/users");

  const row = page
    .locator("tbody tr")
    .filter({ hasText: "admin.demo@helpdesk.test" });

  await expect(row.getByText("You")).toBeVisible();
  await expect(
    row.getByLabel("Role for admin.demo@helpdesk.test"),
  ).toBeDisabled();
  await expect(row.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("redirects non-admins away from the directory", async ({ page }) => {
  await signIn(page, "client.demo@helpdesk.test");
  await page.goto("/users");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
});

test("fits the user directory in a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "admin.demo@helpdesk.test");
  await page.goto("/users");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
