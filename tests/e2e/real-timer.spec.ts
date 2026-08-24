import {expect, test, type Page} from '@playwright/test';

async function startSession(page: Page, testType: string, protocol = 'optimal') {
  await page.goto('./');
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#protocol-select').selectOption(protocol);
  await page.locator('#test-type-select').selectOption(testType);
  await page.locator('#compact-stimulus-count').fill('30');
  if (protocol === 'optimal') {
    await page.locator('#compact-exposure-time').fill('500');
    await page.locator('#compact-delay-min').fill('250');
    await page.locator('#compact-delay-max').fill('250');
  } else {
    await page.locator('#compact-initial-exposure').fill('100');
    await page.locator('#compact-exposure-min').fill('100');
    await page.locator('#compact-exposure-max').fill('100');
  }
  await page.locator('#start-test-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();
}

test('runs a short optimal CRT1-3 session with the current settings flow', async ({page}) => {
  test.setTimeout(90_000);
  await startSession(page, 'crt1-3');
  await expect(page.locator('#stimuli-counter')).toContainText('/30');
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 75_000});
});

test('runs a short feedback CRT2-3 session with the current settings flow', async ({page}) => {
  test.setTimeout(45_000);
  await startSession(page, 'crt2-3', 'feedback');
  await expect(page.locator('#stimuli-counter')).toContainText('/30');
  await page.waitForTimeout(5_000);
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 30_000});
});
