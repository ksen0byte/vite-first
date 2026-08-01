import { expect, test } from '@playwright/test';
import {readFile} from 'node:fs/promises';

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

test('opens Settings from the keyboard-reachable reaction-test card', async ({ page }) => {
  await page.goto('./');
  const reactionCard = page.locator('#service-reaction');

  await reactionCard.focus();
  await expect(reactionCard).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('#personal-data-form')).toBeVisible();
});

test('retains the selected language across a Settings route round trip', async ({ page }) => {
  await page.goto('./');
  const heading = page.locator('#dashboard-content h1');
  await expect(heading).toHaveText('Інструменти та сервіси');

  await page.locator('#language-toggle').check();
  await expect(heading).toHaveText('Tools and Services');

  await page.locator('#service-reaction').click();
  await expect(page.locator('#personal-data-form')).toBeVisible();
  await page.goBack();
  await expect(heading).toHaveText('Tools and Services');
});

test('gives localized settings inputs accessible names', async ({ page }) => {
  await page.goto('./');
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();

  await expect(page.getByLabel('Last Name')).toHaveAttribute('id', 'surname-input');
  await expect(page.getByLabel('Name', {exact: true})).toHaveAttribute('id', 'name-input');
  await expect(page.getByLabel('Age', {exact: true})).toHaveAttribute('id', 'age-input');
  await expect(page.getByLabel('Gender')).toHaveAttribute('id', 'gender-select');
});

test('exposes the language selector name and checked state to keyboard users', async ({ page }) => {
  await page.goto('./');
  const languageToggle = page.getByLabel('Language');

  await languageToggle.focus();
  await expect(languageToggle).toBeFocused();
  await expect(languageToggle).not.toBeChecked();
  await languageToggle.check();
  await expect(languageToggle).toBeChecked();
});

test('selects CRT1-3 and starts the configured test flow', async ({ page }) => {
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();

  const crt13 = page.locator('#rv1-3-button');
  await crt13.click();
  await expect(crt13).toHaveClass(/btn-active/);
  await expect(page.locator('#pzmr-button')).not.toHaveClass(/btn-active/);
  await expect(page.locator('#test-instruction-text')).not.toBeEmpty();
  await page.locator('#test-next-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();
});

test('selects CRT2-3 and starts the configured test flow', async ({ page }) => {
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();

  const crt23 = page.locator('#rv2-3-button');
  await crt23.click();
  await expect(crt23).toHaveClass(/btn-active/);
  await expect(page.locator('#pzmr-button')).not.toHaveClass(/btn-active/);
  await expect(page.locator('#test-instruction-text')).not.toBeEmpty();
  await page.locator('#test-next-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();
});

test('completes an SVMR session through the real timer sequence', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();
  await page.locator('#pzmr-button').click();
  await page.locator('#test-next-btn').click();

  await page.clock.fastForward(100_000);
  await expect(page.locator('#end-finish-btn')).toBeVisible();
  await page.locator('#end-finish-btn').click();
  await expect(page.locator('#results-screen')).toBeVisible();
});

test('Browser Back abandons an active test without a delayed route mutation', async ({ page }) => {
  await page.goto('./');
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#gender-select').selectOption('female');
  await page.locator('#start-test-btn').click();
  await page.locator('#pzmr-button').click();
  await page.locator('#test-next-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();

  await page.goBack();
  await expect(page.locator('#pzmr-button')).toBeVisible();
  await page.waitForTimeout(4_500);
  await expect(page.locator('#pzmr-button')).toBeVisible();
  await expect(page.locator('#test-screen')).toHaveCount(0);
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

test('routes accepted input spam to the warning screen and recovers to test selection', async ({ page }) => {
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

  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');

  await expect(page.locator('#spam-warning-screen')).toBeVisible();
  await page.locator('#spam-warning-retry-btn').click();
  await expect(page.locator('#pzmr-button')).toBeVisible();
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

test('exports imported user data as a versioned v1 envelope', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('./');
  await page.locator('#service-profiles').click();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#import-data-btn').click();
  const chooser = await chooserPromise;
  await chooser.setFiles('tests/fixtures/import/current-export.json');
  await expect(page.locator('.card-title')).toContainText('Ada Example');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-data-btn').click();
  const download = await downloadPromise;
  const path = await download.path();
  if (path === null) throw new Error('Expected export download path');
  const exported: unknown = JSON.parse(await readFile(path, 'utf8'));

  expect(exported).toMatchObject({
    schemaVersion: 1,
    users: [{user: {firstName: 'Ada', lastName: 'Example'}}],
  });
});
