import {expect, test, type Page} from '@playwright/test';

async function startSession(page: Page, testType: string, protocol = 'optimal', submode = 'mobility') {
  await page.goto('./');
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#protocol-select').selectOption(protocol);
  if (protocol === 'feedback') {
    await page.locator('#mode-select').selectOption(submode);
  }
  await page.locator('#test-type-select').selectOption(testType);
  if (protocol === 'feedback' && submode === 'strength') {
    // Time-driven: shorten the series so the session ends quickly.
    await page.locator('#compact-duration').fill('30');
    await page.locator('#compact-initial-exposure').fill('100');
    await page.locator('#compact-exposure-min').fill('100');
    await page.locator('#compact-exposure-max').fill('100');
  } else {
    await page.locator(protocol === 'feedback' ? '#compact-stimulus-count-fb' : '#compact-stimulus-count').fill('30');
  }
  if (protocol === 'optimal') {
    await page.locator('#compact-exposure-time').fill('500');
    // Uncheck pregenerated delay to allow setting custom min/max
    await page.locator('#compact-use-pregenerated-delay').uncheck();
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

test('runs a short feedback mobility CRT2-3 session (count-driven)', async ({page}) => {
  test.setTimeout(60_000);
  await startSession(page, 'crt2-3', 'feedback', 'mobility');
  // Mobility shows the count target from its own field.
  await expect(page.locator('#stimuli-counter')).toContainText('/30');
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 45_000});
});

test('runs a short feedback strength CRT2-3 session (time-driven, ends on duration)', async ({page}) => {
  test.setTimeout(90_000);
  await startSession(page, 'crt2-3', 'feedback', 'strength');
  await page.waitForTimeout(5_000); // let a few trials pass
  // Strength has no fixed total; the counter never shows /30.
  await expect(page.locator('#stimuli-counter')).not.toContainText('/30');
  // Duration (30 s) expires -> end screen appears without any count target.
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 75_000});
});