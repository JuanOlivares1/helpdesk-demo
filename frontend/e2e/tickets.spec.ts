import { expect, test } from "@playwright/test";
import { API_URL, signIn } from "./helpers";

test("filters and paginates through the URL", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");

  const next = page.getByRole("link", { name: "Next", exact: true });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/page=2/);

  await page.getByRole("link", { name: "Closed", exact: true }).click();
  await expect(page).toHaveURL(/status=closed/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(
    page.getByRole("link", { name: "Closed", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await page.locator("tbody tr").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/ticket\/\d+/);
});

test("creates a ticket from the dialog", async ({ page }) => {
  await signIn(page, "client.demo@helpdesk.test");

  await page.getByRole("button", { name: "New ticket" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const title = `E2E request ${Date.now()}`;
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Description").fill("Created during the E2E run.");
  await dialog.getByLabel("Priority").selectOption("high");
  await dialog.getByRole("button", { name: "Create ticket" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("shows inline field errors from a 422 response", async ({ page }) => {
  await signIn(page, "client.demo@helpdesk.test");

  await page.route("**/api/tickets/", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ errors: { title: ["Title is invalid"] } }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "New ticket" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Invalid request");
  await dialog.getByLabel("Description").fill("Trigger an inline error.");
  await dialog.getByRole("button", { name: "Create ticket" }).click();

  await expect(dialog.getByText("Title is invalid")).toBeVisible();
  await expect(dialog.getByLabel("Title")).toBeFocused();
});

test("updates triage fields and adds a comment", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");

  await page.locator("tbody tr").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/ticket\/\d+/);

  const status = page.getByLabel("Status");
  const currentStatus = await status.inputValue();
  await status.selectOption(currentStatus === "open" ? "in_progress" : "open");

  const priority = page.getByLabel("Priority");
  const currentPriority = await priority.inputValue();
  await priority.selectOption(currentPriority === "high" ? "low" : "high");

  await page.getByLabel("Assignee").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Ticket updated.")).toBeVisible();

  await page.getByLabel("Add a comment").fill("E2E progress note");
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.getByText("E2E progress note")).toBeVisible();
});

test("clears an assignment from the ticket detail", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");

  const token = await page.evaluate(() => localStorage.getItem("token"));
  const headers = { Authorization: `Bearer ${token}` };
  const created = await page.request.post(`${API_URL}/tickets/`, {
    headers,
    data: {
      title: `E2E assignment ${Date.now()}`,
      description: "Created to verify clearing an assignment.",
      priority: "medium",
    },
  });
  expect(created.ok()).toBeTruthy();

  const ticketId = (await created.json()).ticket.id as number;
  await page.goto(`/ticket/${ticketId}`);

  const assignee = page.getByLabel("Assignee");
  const saveChanges = async () => {
    const response = page.waitForResponse(
      (candidate) =>
        candidate.url().includes(`/api/tickets/${ticketId}`) &&
        candidate.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    return (await response).status();
  };

  await assignee.selectOption({ index: 1 });
  expect(await saveChanges()).toBe(200);
  await expect(assignee).not.toHaveValue("");

  await assignee.selectOption("");
  expect(await saveChanges()).toBe(200);
  await expect(page.getByText("Ticket updated.")).toBeVisible();

  const response = await page.request.get(`${API_URL}/tickets/${ticketId}`, {
    headers,
  });

  expect(response.ok()).toBeTruthy();
  expect((await response.json()).ticket.assignee_id).toBeNull();
});

test("fits the viewport without horizontal overflow", async ({ page }) => {
  await signIn(page, "client.demo@helpdesk.test");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("exposes UTC timestamps through the API", async ({ page }) => {
  await signIn(page, "admin.demo@helpdesk.test");

  const token = await page.evaluate(() => localStorage.getItem("token"));
  const response = await page.request.get(`${API_URL}/tickets/?per_page=3`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.tickets.length).toBeGreaterThan(0);
  for (const ticket of data.tickets) {
    expect(ticket.created_at).toMatch(/\+00:00$/);
  }
});
