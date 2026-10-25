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

async function importExampleUser(page: Page, mixedProfile = false): Promise<void> {
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#service-profiles').click();
  await expect(page.locator('#users-screen')).toBeVisible();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#import-data-btn').click();
  const chooser = await chooserPromise;
  const definitions = [
    {id: 101, testMode: 'shapes', testType: 'svmr', stimulus: 'circle', expectedAction: 'DEFAULT'},
    {id: 102, testMode: 'colors', testType: 'crt1-3', stimulus: 'red', expectedAction: 'DEFAULT'},
    {id: 103, testMode: 'words', testType: 'crt2-3', stimulus: 'cat', expectedAction: 'RIGHT'},
  ];
  if (mixedProfile) definitions.push(
    {id: 104, testMode: 'shapes', testType: 'crt2-3', stimulus: 'circle', expectedAction: 'RIGHT'},
    {id: 105, testMode: 'shapes', testType: 'svmr', stimulus: 'circle', expectedAction: 'DEFAULT'},
    {id: 106, testMode: 'shapes', testType: 'crt2-3', stimulus: 'circle', expectedAction: 'RIGHT'},
    {id: 107, testMode: 'colors', testType: 'svmr', stimulus: 'red', expectedAction: 'DEFAULT'},
  );
  const tests = definitions.map((definition, testIndex) => ({
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

async function expectStandardBackButton(page: Page, selector: string): Promise<void> {
  const button = page.locator(selector);
  await expect(button).toHaveClass(/btn-outline/);
  await expect(button).toHaveClass(/btn-success/);
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeLessThanOrEqual(20);
  expect(box!.y).toBeGreaterThan(page.viewportSize()!.height / 2);
}

test('dashboard page', async ({page}) => {
  await expect(page.locator('#dashboard-content')).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', snapshotOptions);

  await page.locator('#service-reaction').click();
  await expect(page.locator('#back-btn')).toBeVisible();
  await page.locator('#back-btn').click();
  await expect(page.locator('#dashboard-content')).toBeVisible();
});

test('settings page', async ({page}) => {
  await page.locator('#service-reaction').click();
  await expectStandardBackButton(page, '#back-btn');
  await expect(page).toHaveScreenshot('settings.png', snapshotOptions);
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
  await expectStandardBackButton(page, '#spam-warning-home-btn');
  await expect(page).toHaveScreenshot('spam-warning.png', snapshotOptions);
});

test('users page with saved data', async ({page}) => {
  await importExampleUser(page);
  await expectStandardBackButton(page, '#main-page-btn');
  await expect(page).toHaveScreenshot('users.png', snapshotOptions);
});

for (const language of ['en', 'uk'] as const) {
  test(`user profile page with saved test history in ${language}`, async ({page}) => {
    await importExampleUser(page, true);
    if (language === 'uk') {
      await page.locator('#language-toggle').uncheck();
      await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    }
    await page.locator('.view-profile-btn').click();
    await expect(page.locator('#user-profile-screen')).toBeVisible();
    await expect(page.locator('#user-profile-screen canvas')).toHaveCount(7);
    await expect(page.locator('[data-cpi-mode="shapes"] td').last()).toContainText('18.00');
    await expect(page.locator('.cpi-card-value .font-mono').filter({hasText: /^18\.00$/})).toHaveCount(1);
    await expect(page.locator('#cpi-shapes-pzmr-select option')).toHaveCount(2);
    await expect(page.locator('#cpi-shapes-crt23-select option')).toHaveCount(2);
    await expect(page.locator('[data-cpi-mode="words"] td').last().locator('[data-localize="cpiNoBaseline"]')).toBeVisible();
    await expect(page.locator('[data-cpi-mode="colors"] td').last().locator('[data-localize="cpiNoCrt23"]')).toBeVisible();
    await expect(page.locator('[data-cpi-mode="combined"] [data-localize="cpiNoBaseline"]')).toBeVisible();
    await expect(page.locator('#user-profile-screen')).not.toContainText(/🔴|🔤|🎨|🔀/);
    await expect(page.locator('#user-profile-screen [data-localize-tip="cpiBaselineHelp"]')).toHaveCount(0);
    await expect(page.locator('#cpi-summary-card [data-localize="cpiFormulaHint"]')).toHaveCount(0);
    await expect(page.locator('#cpi-summary-card')).toHaveScreenshot(`cpi-summary-mixed-${language}.png`, {animations: 'disabled'});
    await expectStandardBackButton(page, '#users-page-btn');
    await expect(page).toHaveScreenshot(
      language === 'en' ? 'user-profile.png' : 'user-profile-uk.png',
      snapshotOptions,
    );
    await page.locator('#users-page-btn').click();
    await expect(page.locator('#users-screen')).toBeVisible();
  });
}

test('CPI table matches baselines and selections independently for all four modes', async ({page}) => {
  await importExampleUser(page);
  await page.locator('.view-profile-btn').click();
  await expect(page.locator('#user-profile-screen')).toBeVisible();
  await page.evaluate(() => {
    const {user, tests} = history.state;
    const baseline = tests.find((record: {testSettings: {testType: string}}) => record.testSettings.testType === 'svmr');
    const records = ['shapes', 'words', 'colors', 'combined'].flatMap((testMode, index) =>
      ['svmr', 'crt2-3'].map((testType, offset) => ({
        ...baseline,
        id: index * 10 + offset + 1,
        testSettings: {...baseline.testSettings, testMode, testType},
        trials: baseline.trials.map((trial: {reactionTime: number}) => ({
          ...trial,
          reactionTime: 200 + index * 10 + offset * (100 + index * 20),
        })),
      })),
    );
    records.push({
      ...records[0], id: 99, date: '2025-01-01T10:00:00.000Z',
      trials: records[0].trials.map((trial: {reactionTime: number}) => ({...trial, reactionTime: 250})),
    });
    history.replaceState({user, tests: records}, '', location.href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  const table = page.locator('#cpi-summary-table');
  await expect(table.locator('tbody tr')).toHaveCount(4);
  for (const [index, mode] of ['shapes', 'words', 'colors', 'combined'].entries()) {
    await expect(table.locator(`[data-cpi-mode="${mode}"] td`).last()).toContainText(`${100 + index * 20}.00`);
    await expect(page.locator(`#cpi-${mode}-crt23-select option`)).toHaveCount(1);
  }
  await expect(page.locator('.cpi-card-value')).toHaveCount(4);
  await page.locator('#cpi-shapes-pzmr-select').selectOption('99');
  await expect(table.locator('[data-cpi-mode="shapes"] td').last()).toContainText('50.00');
  await expect(table.locator('[data-cpi-mode="words"] td').last()).toContainText('120.00');
  await expect(page.locator('.cpi-card-value[data-test-id="2"]')).toContainText('50.00');
  await page.locator('#cpi-shapes-pzmr-select').selectOption('1');
  await expect(table.locator('[data-cpi-mode="shapes"] td').last()).toContainText('100.00');
  await expect(page.locator('#cpi-summary-card')).toHaveScreenshot('cpi-summary-modes.png', {animations: 'disabled'});
  const dimensions = () => table.locator('tbody tr:first-child > *').evaluateAll(
    (cells) => cells.map((cell) => ({width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height})),
  );
  const before = await dimensions();
  for (const cell of before) expect(cell.width).toBeCloseTo(before[0].width, 0);
  await page.locator('#cpi-shapes-pzmr-select').selectOption('99');
  await page.locator('#language-toggle').uncheck();
  await expect(page.locator('#cpi-shapes-pzmr-select')).toHaveValue('99');
  for (const mode of ['shapes', 'words', 'colors', 'combined']) {
    for (const type of ['pzmr', 'crt23']) {
      const option = page.locator(`#cpi-${mode}-${type}-select option`).first();
      await expect(option).toContainText('Останній (Авто)');
      await expect(option).toContainText('15.01.2026');
      await expect(option).not.toContainText('Latest');
    }
  }
  expect(await dimensions()).toEqual(before);
  await expect(table.locator('[data-cpi-mode="shapes"] td').last()).toContainText('50.00');
  await expect(page.locator('#cpi-summary-card')).toHaveScreenshot('cpi-summary-modes-uk.png', {animations: 'disabled'});
  await page.locator('#language-toggle').check();
  await expect(page.locator('#cpi-shapes-pzmr-select option').first()).toContainText('Latest (Auto)');
  await expect(page.locator('#cpi-shapes-pzmr-select')).toHaveValue('99');
  expect(await dimensions()).toEqual(before);
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
  await expect(page.locator('#secondary-stats-grid > div')).toHaveCount(3);
  await expect(page).toHaveScreenshot('results.png', snapshotOptions);
});

for (const feedbackMode of ['mobility', 'strength'] as const) {
  test(`results page for feedback ${feedbackMode}`, async ({page}) => {
    await page.locator('#service-reaction').click();
    await fillPersonalData(page);
    await page.locator('#protocol-select').selectOption('feedback');
    await page.locator('#mode-select').selectOption(feedbackMode);
    await expect(page.locator('#test-type-select')).toHaveValue('crt2-3');
    await page.locator('#start-test-btn').click();
    await expect(page.locator('#test-screen')).toBeVisible();

    await page.evaluate((samples) => {
      const destination = new URL('./results', new URL('.', window.location.href));
      const exposureSteps = [340, 320, 340, 320, 300, 320, 300, 280, 300, 280, 260, 280];
      const reactionTimes = new Map(samples.map((reactionTime, trialIndex) => [trialIndex, {
        trialIndex,
        stimulus: 'circle',
        reactionTime,
        outcome: exposureSteps[trialIndex + 1] > exposureSteps[trialIndex] ? 'MixUp' : 'Success',
        expectedAction: 'DEFAULT',
        actualAction: 'DEFAULT',
        exposureMs: exposureSteps[Math.min(trialIndex, exposureSteps.length - 1)],
        motorComponent: 80 + (trialIndex % 5) * 5,
      }]));
      history.pushState({reactionTimes}, '', destination.pathname);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, reactionSamples);

    await expect(page.locator('#results-screen')).toBeVisible();
    await expect(page.locator('[data-localize="statMinExposure"]')).toBeVisible();
    await expect(page.locator('#frequencyChart')).toHaveCount(0);
    await expect(page.locator('#exposureTimeChart')).toBeVisible();
    await expect(page).toHaveScreenshot(`results-feedback-${feedbackMode}.png`, snapshotOptions);
    await page.clock.setFixedTime(new Date('2026-01-20T10:00:00.000Z'));
    await page.locator('#save-results-btn').click();
    await expect(page.locator('#user-profile-screen')).toBeVisible();
    await expect(page.locator('#user-profile-screen canvas[id^="histogram-"]')).toHaveCount(0);
    await expect(page.locator('#user-profile-screen canvas[id^="exposure-"]')).toBeVisible();
    await expect(page).toHaveScreenshot(`user-profile-feedback-${feedbackMode}.png`, snapshotOptions);
    await page.locator('#language-toggle').uncheck();
    await expect(page.locator('#user-profile-screen canvas[id^="exposure-"]'))
      .toHaveAttribute('aria-label', 'Час експозиції за спробами');
    await expect(page).toHaveScreenshot(`user-profile-feedback-${feedbackMode}-uk.png`, snapshotOptions);
    await page.evaluate(() => {
      const {user, tests} = history.state;
      const record = tests[0];
      record.trials = Array.from({length: 120}, (_, trialIndex) => ({
        ...record.trials[trialIndex % record.trials.length], trialIndex,
        exposureMs: 900 - Math.min(trialIndex, 68) * 10 + (trialIndex % 5) * 20,
      }));
      history.replaceState({user, tests}, '', location.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.locator('#user-profile-screen canvas[id^="exposure-"]')).toBeVisible();
    await expect(page.locator('#user-profile-screen canvas[id^="exposure-"]').locator('..'))
      .toHaveScreenshot(`exposure-long-${feedbackMode}.png`, {animations: 'disabled'});
  });
}

test('results page without route state shows its error state', async ({page}) => {
  await openRoute(page, '/results');
  await expect(page.getByText('Error loading results. Please try again.')).toBeVisible();
  await expect(page).toHaveScreenshot('results-error.png', snapshotOptions);
});

test('profile page without route state shows its error state', async ({page}) => {
  await openRoute(page, '/profile');
  await expect(page.getByText('Error loading profile. Please try again.')).toBeVisible();
  await expect(page).toHaveScreenshot('profile-error.png', snapshotOptions);
});

const crtResultCases = [
  {testType: 'crt1-3', language: 'en'},
  {testType: 'crt2-3', language: 'en'},
  {testType: 'crt2-3', language: 'uk'},
] as const;

for (const {testType, language} of crtResultCases) {
  test(`results page for ${testType} in ${language}`, async ({page}) => {
    // Importing the example user supplies the SVMR baseline used to calculate CPI.
    await importExampleUser(page);
    if (language === 'uk') {
      await page.locator('#language-toggle').uncheck();
      await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    }
    await openRoute(page, '/settings');
    await fillPersonalData(page);
    await page.locator('#test-type-select').selectOption(testType);
    await page.locator('#stimulus-select').selectOption('shapes');
    await page.locator('#start-test-btn').click();
    await expect(page.locator('#test-screen')).toBeVisible();

    await page.evaluate(({samples, selectedTestType}) => {
      const destination = new URL('./results', new URL('.', window.location.href));
      const stimuli = ['circle', 'square', 'triangle'];
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
    await expect(page.locator('#secondary-stats-grid > div')).toHaveCount(2);
    if (testType === 'crt2-3') {
      await expect(page.locator('#cpi-result-value .loading')).toHaveCount(0);
      await expect(page.locator('#cpi-result-value')).toContainText('45.00');
      await expect(page.locator('#cpi-result-value [data-localize="cpiNoBaseline"]')).toHaveCount(0);
      expect(await page.locator('#cpi-result-desc').evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      )).toBe(true);
    } else {
      await expect(page.locator('#cpi-result-stat')).toHaveCount(0);
    }
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
  await expectStandardBackButton(page, '#ba-back-btn');
  await expect(page).toHaveScreenshot('biological-age-calculator.png', snapshotOptions);
});
