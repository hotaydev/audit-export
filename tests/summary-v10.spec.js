// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("npm-audit-v10.html");
});

test("has the expected title", async ({ page }) => {
  await expect(page).toHaveTitle(/playwright-test/);
});

test("reports the total number of vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Vulnerabilities Found: 54")).toBeVisible();
});

test("displays the number of vulnerable dependencies", async ({ page }) => {
  await expect(page.getByText("Vulnerable Dependencies: 36")).toBeVisible();
});

test("displays the date when the report was last updated", async ({ page }) => {
  await expect(page.getByText(/Last Updated:\s+.*April, 2024/)).toBeVisible();
});

test("displays the number of critical vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Critical: 4")).toBeVisible();
});

test("displays the number of high vulnerabilities", async ({ page }) => {
  await expect(page.getByText("High: 30")).toBeVisible();
});

test("displays the number of moderate vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Moderate: 17")).toBeVisible();
});

test("displays the number of low vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Low: 3")).toBeVisible();
});

test("displays the number of informative vulnerabilities", async ({ page }) => {
  await expect(page.getByText("Informative: 0")).toBeVisible();
});