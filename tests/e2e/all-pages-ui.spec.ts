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
    trials: reactionSamples.map((reactionTime, trialIndex) => {
      const action = definition.testType === 'crt2-3'
        ? (trialIndex % 2 === 0 ? 'LEFT' : 'RIGHT')
        : definition.expectedAction;

      return {
        trialIndex,
        stimulus: definition.stimulus,
        reactionTime: reactionTime + testIndex * 18,
        outcome: 'Success',
        expectedAction: action,
        actualAction: action,
        exposureMs: 700,
        motorComponent: 82 + (trialIndex % 5) * 4,
      };
    }),
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

for (const language of ['en', 'uk'] as const) {
  test(`user profile page with saved test history in ${language}`, async ({page}) => {
    await importExampleUser(page);
    if (language === 'uk') {
      await page.locator('#language-toggle').uncheck();
      await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    }
    await page.locator('.view-profile-btn').click();
    await expect(page.locator('#user-profile-screen')).toBeVisible();
    await expect(page.locator('#user-profile-screen canvas')).toHaveCount(3);
    await expect(page).toHaveScreenshot(
      language === 'en' ? 'user-profile.png' : 'user-profile-uk.png',
      snapshotOptions,
    );
  });
}

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
  await expect(page.locator('#secondary-stats-grid > div')).toHaveCount(3);
  await expect(page).toHaveScreenshot('results.png', snapshotOptions);
});

const crtResultCases = [
  {testType: 'crt1-3', language: 'en'},
  {testType: 'crt2-3', language: 'en'},
  {testType: 'crt2-3', language: 'uk'},
] as const;

for (const {testType, language} of crtResultCases) {
  test(`results page for ${testType} with CPI in ${language}`, async ({page}) => {
    // Importing the example user supplies the SVMR baseline used to calculate CPI.
    await importExampleUser(page);
    if (language === 'uk') {
      await page.locator('#language-toggle').uncheck();
      await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    }
    await openRoute(page, '/settings');
    await fillPersonalData(page);
    await page.locator('#test-type-select').selectOption(testType);
    await page.locator('#start-test-btn').click();
    await expect(page.locator('#test-screen')).toBeVisible();

    await page.evaluate(({samples, selectedTestType}) => {
      const destination = new URL('./results', new URL('.', window.location.href));
      const stimuli = selectedTestType === 'crt1-3'
        ? ['red', 'green', 'yellow']
        : ['cat', 'dog', 'bird'];
      const reactionTimes = new Map(samples.map((reactionTime, trialIndex) => {
        const action = selectedTestType === 'crt2-3'
          ? (trialIndex % 2 === 0 ? 'LEFT' : 'RIGHT')
          : 'DEFAULT';
        return [trialIndex, {
          trialIndex,
          stimulus: stimuli[trialIndex % stimuli.length],
          reactionTime: reactionTime + (selectedTestType === 'crt2-3' ? 45 : 25),
          outcome: 'Success',
          expectedAction: action,
          actualAction: action,
          exposureMs: 700,
          motorComponent: 84 + (trialIndex % 5) * 4,
        }];
      }));
      history.pushState({reactionTimes}, '', destination.pathname);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, {samples: reactionSamples, selectedTestType: testType});

    await expect(page.locator('#results-screen')).toBeVisible();
    await expect(page.locator('#frequencyChart')).toBeVisible();
    await expect(page.locator('#secondary-stats-grid > div')).toHaveCount(3);
    await expect(page.locator('#cpi-result-value .loading')).toHaveCount(0);
    await expect(page.locator('#cpi-result-value')).not.toBeEmpty();
    expect(await page.locator('#cpi-result-desc').evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    )).toBe(true);
    expect(await page.locator('#error-stats-group .stat-title, #primary-stats-grid .stat-desc, #secondary-stats-grid .stat-desc').evaluateAll(
      (elements) => elements
        .filter((element) => element.scrollWidth > element.clientWidth)
        .map((element) => element.textContent?.trim()),
    )).toEqual([]);
    expect(await page.locator('#results-screen .stat-value, #results-screen .stat-desc').allTextContents())
      .not.toEqual(expect.arrayContaining([
        expect.stringMatching(/\d(?:ms|мс|bits|біти|arb\. u\.|ум\. од\.)/),
      ]));
    const languageSuffix = language === 'uk' ? '-uk' : '';
    await expect(page).toHaveScreenshot(`results-${testType}${languageSuffix}.png`, snapshotOptions);
  });
}

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
