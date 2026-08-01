import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('CnsTestDatabase');
  });
});

test('loads the dashboard without page errors and returns from settings', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('./');

  await expect(page.locator('#service-reaction')).toBeVisible();
  await expect(page.locator('#service-profiles')).toBeVisible();

  await page.locator('#service-reaction').click();
  await expect(page.locator('#personal-data-form')).toBeVisible();

  await page.goBack();
  await expect(page.locator('#service-reaction')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
