// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("npm-audit-v10.html");
});

test("has the expected title", async ({ page }) => {
  await expect(page).toHaveTitle(/playwright-test/);
});

test("reports the total number of vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Vulnerabilities Found: 6")).toBeVisible();
});

test("displays the number of vulnerable dependencies", async ({ page }) => {
  await expect(page.getByText("Vulnerable Dependencies: 4")).toBeVisible();
});

test("displays the date when the report was last updated", async ({ page }) => {
  await expect(page.getByText(/Generated at:/)).toBeVisible();
});

test("displays the number of critical vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Critical: 0")).toBeVisible();
});

test("displays the number of high vulnerabilities", async ({ page }) => {
  await expect(page.getByText("High: 2")).toBeVisible();
});

test("displays the number of moderate vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Moderate: 4")).toBeVisible();
});

test("displays the number of low vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Low: 0")).toBeVisible();
});

test("displays the number of informative vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Informative: 0")).toBeVisible();
});