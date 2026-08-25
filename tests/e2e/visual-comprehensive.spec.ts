import {expect, test, type Page} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
});

async function openSettings(page: Page) {
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await expect(page.locator('#personal-data-form')).toBeVisible();
}

async function fillPersonalData(page: Page) {
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
}

test('settings matrix: every protocol, regime, submode and stimulus combination is usable', async ({page}, testInfo) => {
  await openSettings(page);
  await fillPersonalData(page);

  const protocols = ['optimal', 'feedback'];
  const testTypes = ['svmr', 'crt1-3', 'crt2-3'];
  const stimuli = ['shapes', 'words', 'colors', 'combined'];
  let screenshotIndex = 0;

  for (const protocol of protocols) {
    await page.locator('#protocol-select').selectOption(protocol);
    const regimes = protocol === 'feedback' ? ['mobility', 'strength'] : ['standard'];
    for (const regime of regimes) {
      await page.locator('#mode-select').selectOption(regime);
      for (const testType of testTypes) {
        await page.locator('#test-type-select').selectOption(testType);
        for (const stimulus of stimuli) {
          await page.locator('#stimulus-select').selectOption(stimulus);
          await expect(page.locator('#compact-preview')).toBeVisible();
          await expect(page.locator('#compact-instruction')).not.toBeEmpty();
          await expect(page.locator('#start-test-btn')).not.toBeEmpty();
          // Parameter inputs per shape: optimal = size, count, exposure +
          // delay-min/max (5) + 2 checkboxes = 7; both feedback submodes =
          // size + 5 or 6 feedback fields + 2 checkboxes = 9.
          await expect(page.locator('#compact-parameters input')).toHaveCount(protocol === 'feedback' ? 9 : 7);

          if (screenshotIndex < 8 || testType === 'crt2-3') {
            const snapshotName = `matrix-${protocol}-${regime}-${testType}-${stimulus}.png`;
            await expect(page).toHaveScreenshot(snapshotName, {fullPage: true});
            await page.screenshot({path: testInfo.outputPath(snapshotName), fullPage: true});
            screenshotIndex++;
          }
        }
      }
    }
  }
});

test('settings matrix: all checkbox combinations remain visible and selectable', async ({page}) => {
  await openSettings(page);
  await fillPersonalData(page);

  for (const protocol of ['optimal', 'feedback']) {
    await page.locator('#protocol-select').selectOption(protocol);
    for (const delay of [false, true]) {
      for (const stimuli of [false, true]) {
        const delayBox = page.locator('#compact-use-pregenerated-delay');
        const stimuliBox = page.locator('#compact-use-pregenerated-stimuli');
        if ((await delayBox.isChecked()) !== delay) await delayBox.click();
        if ((await stimuliBox.isChecked()) !== stimuli) await stimuliBox.click();
        await expect(delayBox).toBeChecked({checked: delay});
        await expect(stimuliBox).toBeChecked({checked: stimuli});
      }
    }
  }
});

test('preview stays fixed while combined stimulus contains shape, colour and word', async ({page}) => {
  await openSettings(page);
  await page.locator('#stimulus-select').selectOption('combined');
  await page.locator('#test-type-select').selectOption('crt2-3');
  await expect(page.locator('#compact-preview svg')).toHaveCount(3);
  await expect(page.locator('#compact-preview .grid-cols-3')).toBeVisible();

  const before = await page.locator('#compact-preview svg').first().boundingBox();
  await page.locator('#compact-stimulus-size').fill('70');
  await page.locator('#compact-stimulus-size').dispatchEvent('input');
  const after = await page.locator('#compact-preview svg').first().boundingBox();
  expect(after?.width).toBeCloseTo(before?.width ?? 0, 1);
});

test('compact parameters keep the delay range aligned at a narrow viewport', async ({page}) => {
  await page.setViewportSize({width: 700, height: 900});
  await openSettings(page);
  await page.locator('#protocol-select').selectOption('optimal');

  const minInput = page.locator('#compact-delay-min');
  const maxInput = page.locator('#compact-delay-max');
  const minBox = await minInput.boundingBox();
  const maxBox = await maxInput.boundingBox();
  expect(minBox).not.toBeNull();
  expect(maxBox).not.toBeNull();
  expect(Math.abs((minBox?.y ?? 0) - (maxBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect((minBox?.x ?? 0) + (minBox?.width ?? 0)).toBeLessThanOrEqual(maxBox?.x ?? 0);
  expect(await page.locator('#compact-preview > div').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
