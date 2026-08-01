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

test('rejects repeated non-Space SVMR keys without recording input or detecting spam', async ({ page }) => {
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();
  await page.locator('#pzmr-button').click();
  await page.locator('#test-next-btn').click();

  await page.waitForTimeout(5_000);
  await page.keyboard.press('ControlRight');
  await page.keyboard.press('ShiftRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ControlRight');

  await expect(page.locator('#test-screen')).toBeVisible();
  await expect(page).not.toHaveURL(/spam-warning/);
});

test('renders imported hostile names as literal text without injected markup', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('./');
  await page.locator('#service-profiles').click();
  await expect(page.locator('#import-data-btn')).toBeVisible();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('#import-data-btn').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('tests/fixtures/import/malformed/html-bearing-names.json');

  await expect(page.locator('.card-title')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.users-list img')).toHaveCount(0);
  await expect(page.locator('.users-list svg[onload]')).toHaveCount(0);
});
