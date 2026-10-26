import {expect, test} from '@playwright/test';

test('default web build offers language switching and both feedback modes', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#dashboard-content')).toBeVisible();
  await expect(page.locator('#service-bio-age')).toHaveCount(0);
  await expect(page.locator('#language-toggle')).toHaveCount(1);
  await page.locator('#service-reaction').click();
  await expect(page.locator('#protocol-select')).toBeVisible();
  await page.locator('#protocol-select').selectOption('feedback');
  await expect(page.locator('#mode-select option')).toHaveCount(2);
  await page.locator('#mode-select').selectOption('strength');
  await expect(page.locator('#compact-duration')).toBeVisible();
  await page.locator('#mode-select').selectOption('mobility');
  await expect(page.locator('#compact-stimulus-count-fb')).toBeVisible();
  await page.screenshot({path: 'test-results/features.png', fullPage: true});
  expect(errors).toEqual([]);
});

test('unregistered calculator route does not trap Browser Back', async ({page}) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await page.locator('#service-reaction').click();
  await page.evaluate(() => {
    const destination = new URL('./bio-age-calculator', new URL('.', window.location.href));
    history.pushState({}, '', destination.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('#personal-data-form')).toBeVisible();
  await expect(page.locator('#ba-calculate-btn')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(page.locator('#dashboard-content')).toBeVisible();
  await expect(page).toHaveURL(/\/vite-first\/$/);
});
