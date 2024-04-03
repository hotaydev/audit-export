// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("npm-audit-v10.html");
});

test("displays the rows for critical vulnerabilities", async ({ page }) => {
  const criticalRows = page.locator("tbody > tr > td > .badge.critical");
  await expect(criticalRows).toHaveCount(4);
});

test("displays the rows for high vulnerabilities", async ({ page }) => {
  const highRows = page.locator("tbody > tr > td > .badge.high");
  await expect(highRows).toHaveCount(30);
});

test("displays the rows for moderate vulnerabilities", async ({ page }) => {
  const moderateRows = page.locator("tbody > tr > td > .badge.moderate");
  await expect(moderateRows).toHaveCount(17);
});

test("displays the rows for low vulnerabilities", async ({ page }) => {
  const lowRows = page.locator("tbody > tr > td > .badge.low");
  await expect(lowRows).toHaveCount(3);
});
