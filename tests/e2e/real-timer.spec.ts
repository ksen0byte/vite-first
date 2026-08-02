import {expect, test, type Page} from '@playwright/test';

async function configureSettings(page: Page, exposureTime: '500' | '1000' = '500'): Promise<void> {
  await page.locator('#shapes-exposure-time-slider').evaluate((element, value) => {
    const slider = (element as HTMLElement & {readonly noUiSlider?: {set: (value: string) => void}}).noUiSlider;
    if (!slider) throw new Error('Exposure-time slider is unavailable.');
    slider.set(value);
  }, exposureTime);
  await page.locator('#shapes-exposure-delay-slider').evaluate((element) => {
    const slider = (element as HTMLElement & {readonly noUiSlider?: {set: (value: readonly string[]) => void}}).noUiSlider;
    if (!slider) throw new Error('Exposure-delay slider is unavailable.');
    slider.set(['250', '250']);
  });
  await page.locator('#shapes-stimulus-count-slider').evaluate((element) => {
    const slider = (element as HTMLElement & {readonly noUiSlider?: {set: (value: string) => void}}).noUiSlider;
    if (!slider) throw new Error('Stimulus-count slider is unavailable.');
    slider.set('30');
  });

  await expect(page.locator('#shapes-exposure-time-label')).toHaveText(`Stimulus Exposure: ${exposureTime} ms`);
  await expect(page.locator('#shapes-exposure-delay-label')).toHaveText('Stimulus Exposure Delay: 250-250 ms');
  await expect(page.locator('#shapes-stimulus-count-label')).toHaveText('Number of Stimuli: 30');
  await page.locator('#shapes-use-pregenerated-delay').uncheck();
  await expect(page.locator('#shapes-use-pregenerated-delay')).not.toBeChecked();
}

async function startSession(page: Page, testTypeId: string, exposureTime: '500' | '1000' = '500'): Promise<void> {
  await page.goto('./');
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();
  await configureSettings(page, exposureTime);
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();
  await page.locator(testTypeId).click();
  await page.locator('#test-next-btn').click();
}

async function finishAndExpectOneSuccess(page: Page, timeout = 35_000): Promise<void> {
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout});
  await page.locator('#end-finish-btn').click();
  await expect(page.locator('#results-screen')).toBeVisible();
  const successfulResponseCount = page.locator('#results-screen .stat')
    .filter({has: page.locator('[data-localize="statCount"]')})
    .first()
    .locator('.stat-value');
  await expect(successfulResponseCount).toHaveText('1');
}

test.beforeEach(async ({page}) => {
  await page.goto('./');
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('CnsTestDatabase');
      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => reject(request.error));
    });
  });
});

for (const [name, testTypeId] of [
  ['CRT1-3', '#rv1-3-button'],
  ['CRT2-3', '#rv2-3-button'],
] as const) {
  test(`completes a ${name} session with real timers`, async ({page}) => {
    test.setTimeout(45_000);
    await startSession(page, testTypeId);
    await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 35_000});
    await page.locator('#end-finish-btn').click();
    await expect(page.locator('#results-screen')).toBeVisible();
  });
}

test('records a successful SVMR response with real timers', async ({page}) => {
  test.setTimeout(65_000);
  await startSession(page, '#pzmr-button', '1000');
  await expect(page.locator('#stimuli-counter')).toHaveText('1/30', {timeout: 8_000});
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await finishAndExpectOneSuccess(page, 50_000);
});

test('records a successful CRT1-3 response with real timers', async ({page}) => {
  test.setTimeout(65_000);
  await startSession(page, '#rv1-3-button', '1000');
  await expect(page.locator('#stimuli-counter')).toHaveText('4/30', {timeout: 12_000});
  await expect(page.locator('#test-stimulus-container rect')).toBeVisible();
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await finishAndExpectOneSuccess(page, 50_000);
});

test('records a successful CRT2-3 response with real timers', async ({page}) => {
  test.setTimeout(65_000);
  await startSession(page, '#rv2-3-button', '1000');
  await expect(page.locator('#stimuli-counter')).toHaveText('2/30', {timeout: 10_000});
  await expect(page.locator('#test-stimulus-container circle')).toBeVisible();
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowLeft');
  await finishAndExpectOneSuccess(page, 50_000);
});

test('saves a completed SVMR session and retains its profile after reload with real timers', async ({page}) => {
  test.setTimeout(50_000);
  await startSession(page, '#pzmr-button');
  await expect(page.locator('#end-finish-btn')).toBeVisible({timeout: 35_000});
  await page.locator('#end-finish-btn').click();
  await expect(page.locator('#results-screen')).toBeVisible();

  await page.locator('#save-results-btn').click();
  await expect(page.locator('#user-profile-screen')).toBeVisible();
  await page.goto('./');
  await page.locator('#service-profiles').click();
  await expect(page.locator('.card-title')).toContainText('Ada Example');
});
