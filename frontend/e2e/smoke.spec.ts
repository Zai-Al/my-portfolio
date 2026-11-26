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

test("each project has its own page, linked from the home page", async ({ page }) => {
  await page.goto("/");
  // The card title links to the page; so does the popup.
  await page.getByRole("link", { name: "Sample Shop" }).click();
  await expect(page).toHaveURL(/\/projects\/sample-shop$/);
  await expect(page).toHaveTitle("Sample Shop · Test Person");
  await expect(page.getByRole("heading", { level: 1, name: "Sample Shop" })).toBeVisible();
  await expect(page.getByText("Built the sample.")).toBeVisible(); // My role, from ProjectDetails
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/projects\/sample-shop$/
  );

  // Next project (with two projects, previous and next are the same one), then back.
  await page.getByRole("navigation", { name: "More projects" }).getByRole("link").last().click();
  await expect(page).toHaveURL(/\/projects\/demo-tracker$/);
  await page.getByRole("link", { name: /all projects/ }).click();
  await expect(page).toHaveURL(/\/#projects$/);
});

test("project page works in Arabic, and an unknown project is a 404", async ({ page }) => {
  await page.goto("/ar/projects/sample-shop");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: "Sample Shop" })).toBeVisible();

  const response = await page.goto("/projects/no-such-project");
  expect(response?.status()).toBe(404);
});

test("project page has its own preview image", async ({ request }) => {
  const response = await request.get("/projects/sample-shop/opengraph-image");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});

test("sitemap lists every project page in both languages", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of [
    "/projects/sample-shop",
    "/ar/projects/sample-shop",
    "/projects/demo-tracker",
  ])
    expect(sitemap).toContain(`${path}</loc>`);
});

test("project page has structured data with a breadcrumb", async ({ page }) => {
  await page.goto("/projects/sample-shop");
  const graphs = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? "{}")));
  const project = graphs.find((g) => g["@graph"]);
  expect(project["@graph"][0]).toMatchObject({ "@type": "CreativeWork", name: "Sample Shop" });
  expect(project["@graph"][1]["@type"]).toBe("BreadcrumbList");
});

test("home page has no serious accessibility problems", async ({ page }) => {
  // Reduced motion: sections appear at once instead of fading in, so axe checks the final
  // colours, not text caught half-transparent mid-animation (a false contrast failure).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );
  expect(
    serious.flatMap((v) => [
      `${v.id}: ${v.help}`,
      ...v.nodes.map((n) => `  ${n.target.join(" ")}: ${n.failureSummary?.split("\n").at(-1)}`),
    ]),
    "serious or critical axe violations"
  ).toEqual([]);
});
