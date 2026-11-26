import { expect, type Page } from "@playwright/test";

export const PASSWORD = "DemoPass123";
export const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:5001/api";

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
}
