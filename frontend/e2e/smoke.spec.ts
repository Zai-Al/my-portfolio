// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Smoke tests: the main things a visitor does still work after a change. The content is
// the fake sample data in e2e/mock-api.mjs.

import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const terminal = (page: Page) =>
  page.getByRole("textbox", { name: "Terminal: type a command or ask a question" });

/** Types a command in the home page terminal and presses Enter. */
async function run(page: Page, command: string) {
  await terminal(page).fill(command);
  await terminal(page).press("Enter");
}

const chatPanel = (page: Page) => page.getByRole("dialog", { name: "Ask about Test" });

test("home page shows the content from the API", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Test Person/);
  await expect(page.getByRole("heading", { level: 1, name: "Test Person" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Sample Shop").first()).toBeVisible();
});

test("terminal runs commands, completes with Tab and keeps history", async ({ page }) => {
  await page.goto("/");

  await run(page, "help");
  await expect(page.getByText("Available commands:")).toBeVisible();

  await run(page, "ls projects");
  await expect(
    page.getByText("Sample Shop (2025) - Sample Shop is a sample project.")
  ).toBeVisible();

  // Free-text dates ("Jun 2024", "Present") come out as years.
  await run(page, "cat experience");
  await expect(page.getByText("2024 – present  Test Engineer @ Example Co")).toBeVisible();
  await run(page, "cat certs");
  await expect(page.getByText("Certified Tester - Example Board (2025)")).toBeVisible();

  await terminal(page).fill("wh");
  await terminal(page).press("Tab");
  await expect(terminal(page)).toHaveValue("whoami");

  await terminal(page).fill("");
  await terminal(page).press("ArrowUp");
  await expect(terminal(page)).toHaveValue("cat certs");
});

test("a half-typed command stays in the terminal instead of asking the AI", async ({ page }) => {
  await page.goto("/");
  // The quotes around {cmd} etc. need ICU escaping (''); a plain ' hides the value.
  await run(page, "c");
  await expect(page.getByText("'c' could be:")).toBeVisible();
  await run(page, "cl");
  await expect(page.getByText("Did you mean 'clear'?")).toBeVisible();
  await expect(terminal(page)).toHaveValue("clear");
  await run(page, "open xyz");
  await expect(page.getByText("No project called 'xyz'.")).toBeVisible();
  await expect(chatPanel(page)).toBeHidden();
});

test("Arabic page is right to left", async ({ page }) => {
  await page.goto("/ar");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "ar");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: "شخص تجريبي" })).toBeVisible();
});

test("AI guide opens, answers and closes with Esc", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ask about Test" }).click();
  await expect(chatPanel(page)).toBeVisible();

  await page.getByRole("textbox", { name: "Your question" }).fill("What is this site?");
  await page.getByRole("textbox", { name: "Your question" }).press("Enter");
  await expect(chatPanel(page).getByText("Sample answer.")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(chatPanel(page)).toBeHidden();
});

test("project popup hands a question to the AI guide", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "View details" }).first().click();
  const popup = page.getByRole("dialog", { name: "Sample Shop" });
  await expect(popup).toBeVisible();

  await popup.getByRole("button", { name: "ask the AI guide about this project" }).click();
  await expect(popup).toBeHidden();
  await expect(
    chatPanel(page).getByText(/Tell me more about the Sample Shop project/)
  ).toBeVisible();
});

test("home page has no serious accessibility problems", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} elements)`),
    "serious or critical axe violations"
  ).toEqual([]);
});
