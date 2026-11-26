import { expect, test } from "@playwright/test";
import { PASSWORD, signIn } from "./helpers";

test("signs in and shows the ticket worklist", async ({ page }) => {
  await signIn(page, "client.demo@helpdesk.test");

  await expect(page.getByText(/requests? in view/)).toBeVisible();
  await expect(page.getByRole("button", { name: "New ticket" })).toBeVisible();
});

test("shows a server error when the password is wrong", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("client.demo@helpdesk.test");
  await page.getByLabel("Password").fill(`${PASSWORD}-wrong`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText(/invalid credentials/i);
  await expect(page).toHaveURL(/\/login$/);
});
