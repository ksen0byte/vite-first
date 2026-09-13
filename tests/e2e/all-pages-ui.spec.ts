import {expect, test, type Page} from '@playwright/test';

const snapshotOptions = {fullPage: true, animations: 'disabled' as const};
const reactionSamples = [242, 251, 259, 266, 274, 281, 287, 294, 302, 309, 317, 328];

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('CnsTestDatabase');
      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => reject(request.error));
    });
  });
  await page.reload();
  await page.locator('#language-toggle').check();
});

async function openRoute(page: Page, route: string): Promise<void> {
  await page.evaluate((nextRoute) => {
    const destination = new URL(`.${nextRoute}`, new URL('.', window.location.href));
    history.pushState({}, '', destination.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
}

async function importExampleUser(page: Page): Promise<void> {
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#service-profiles').click();
  await expect(page.locator('#users-screen')).toBeVisible();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#import-data-btn').click();
  const chooser = await chooserPromise;
  const tests = [
    {id: 101, testMode: 'shapes', testType: 'svmr', stimulus: 'circle', expectedAction: 'DEFAULT'},
    {id: 102, testMode: 'colors', testType: 'crt1-3', stimulus: 'red', expectedAction: 'DEFAULT'},
    {id: 103, testMode: 'words', testType: 'crt2-3', stimulus: 'cat', expectedAction: 'RIGHT'},
  ].map((definition, testIndex) => ({
    id: definition.id,
    userKey: 'Ada|Example',
    testSettings: {
      protocolMode: 'optimal',
      testMode: definition.testMode,
      stimulusSize: 25,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: reactionSamples.length,
      testType: definition.testType,
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    },
    trials: reactionSamples.map((reactionTime, trialIndex) => ({
      trialIndex,
      stimulus: definition.stimulus,
      reactionTime: reactionTime + testIndex * 18,
      outcome: 'Success',
      expectedAction: definition.expectedAction,
      actualAction: definition.expectedAction,
      exposureMs: 700,
      motorComponent: 82 + (trialIndex % 5) * 4,
    })),
    date: `2026-01-${15 + testIndex}T10:00:00.000Z`,
  }));
  await chooser.setFiles({
    name: 'visual-test-data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{user: {
      firstName: 'Ada', lastName: 'Example', gender: 'female', age: 34,
    }, tests}])),
  });
  await expect(page.locator('.card-title')).toContainText('Ada Example');
}

async function fillPersonalData(page: Page): Promise<void> {
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
}

test('dashboard page', async ({page}) => {
  await expect(page.locator('#dashboard-content')).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', snapshotOptions);
});

const activeStimulusCases = [
  {mode: 'shapes', stimulusSelector: ':scope > svg'},
  {mode: 'words', stimulusSelector: ':scope > span'},
  {mode: 'colors', stimulusSelector: ':scope > div'},
] as const;

for (const {mode, stimulusSelector} of activeStimulusCases) {
  test(`active test renders a real ${mode} stimulus`, async ({page}) => {
    await page.locator('#service-reaction').click();
    await fillPersonalData(page);
    await page.locator('#test-type-select').selectOption('svmr');
    await page.locator('#stimulus-select').selectOption(mode);
    await page.locator('#compact-use-pregenerated-delay').uncheck();
    await page.locator('#compact-use-pregenerated-stimuli').check();
    await page.locator('#compact-delay-min').fill('250');
    await page.locator('#compact-delay-max').fill('250');
    await page.locator('#compact-exposure-time').fill('1500');
    await page.locator('#start-test-btn').click();

    const stimulusContainer = page.locator('#test-stimulus-container');
    await expect(page.locator('#test-screen')).toBeVisible();
    await expect(stimulusContainer.locator(stimulusSelector)).toBeVisible({timeout: 7_000});
    await expect(page.locator('#stimuli-counter')).toHaveText('1/50');
    await expect(page).toHaveScreenshot(`active-test-${mode}.png`, snapshotOptions);
  });
}

test('spam warning page', async ({page}) => {
  await openRoute(page, '/spam-warning');
  await expect(page.locator('#spam-warning-screen')).toBeVisible();
  await expect(page).toHaveScreenshot('spam-warning.png', snapshotOptions);
});

test('users page with saved data', async ({page}) => {
  await importExampleUser(page);
  await expect(page).toHaveScreenshot('users.png', snapshotOptions);
});

test('user profile page with saved test history', async ({page}) => {
  await importExampleUser(page);
  await page.locator('.view-profile-btn').click();
  await expect(page.locator('#user-profile-screen')).toBeVisible();
  await expect(page.locator('#user-profile-screen canvas')).toHaveCount(3);
  await expect(page).toHaveScreenshot('user-profile.png', snapshotOptions);
});

test('results page with completed trials', async ({page}) => {
  await page.locator('#service-reaction').click();
  await fillPersonalData(page);
  await page.locator('#start-test-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();

  await page.evaluate((samples) => {
    const destination = new URL('./results', new URL('.', window.location.href));
    const stimuli = ['circle', 'square', 'triangle'];
    const reactionTimes = new Map(samples.map((reactionTime, trialIndex) => [trialIndex, {
      trialIndex,
      stimulus: stimuli[trialIndex % stimuli.length],
      reactionTime,
      outcome: 'Success',
      expectedAction: 'DEFAULT',
      actualAction: 'DEFAULT',
      exposureMs: 700,
      motorComponent: 80 + (trialIndex % 5) * 5,
    }]));
    history.pushState({reactionTimes}, '', destination.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, reactionSamples);

  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#frequencyChart')).toBeVisible();
  await expect(page).toHaveScreenshot('results.png', snapshotOptions);
});

test('biological age calculator page', async ({page}) => {
  await openRoute(page, '/bio-age-calculator');
  await expect(page.locator('#ba-calculate-btn')).toBeVisible();
  await page.locator('#ba-age').fill('12');
  await page.locator('#ba-gender').selectOption('female');
  await page.locator('#ba-time').fill('250');
  await page.locator('#ba-calculate-btn').click();
  await expect(page.locator('#ba-result')).toBeVisible();
  await expect(page).toHaveScreenshot('biological-age-calculator.png', snapshotOptions);
});
