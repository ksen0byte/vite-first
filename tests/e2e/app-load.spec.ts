import {expect, test} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
});

test('loads dashboard and opens the compact settings screen without page errors', async ({page}) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  await expect(page.locator('#service-reaction')).toBeVisible();
  await page.locator('#service-reaction').click();
  await expect(page.locator('#personal-data-form')).toBeVisible();
  await expect(page.locator('#protocol-select')).toBeVisible();
  expect(errors).toEqual([]);
});

test('settings has accessible personal-data labels and aligned controls', async ({page}) => {
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();
  await expect(page.getByLabel('Last Name')).toHaveAttribute('id', 'surname-input');
  await expect(page.getByLabel('Name', {exact: true})).toHaveAttribute('id', 'name-input');
  await expect(page.getByLabel('Age', {exact: true})).toHaveAttribute('id', 'age-input');
  await expect(page.getByLabel('Gender')).toHaveAttribute('id', 'gender-select');
  const boxes = await Promise.all(['surname-input', 'name-input', 'age-input', 'gender-select'].map(id => page.locator(`#${id}`).boundingBox()));
  expect(boxes.every(Boolean)).toBe(true);
  expect(Math.max(...boxes.map(box => box!.height)) - Math.min(...boxes.map(box => box!.height))).toBeLessThanOrEqual(2);
});

test('selected settings start the test directly', async ({page}) => {
  await page.locator('#service-reaction').click();
  await page.locator('#surname-input').fill('Example');
  await page.locator('#name-input').fill('Ada');
  await page.locator('#age-input').fill('34');
  await page.locator('#protocol-select').selectOption('feedback');
  await page.locator('#mode-select').selectOption('strength');
  await page.locator('#test-type-select').selectOption('crt2-3');
  await page.locator('#stimulus-select').selectOption('words');
  await page.locator('#start-test-btn').click();
  await expect(page.locator('#test-screen')).toBeVisible();
});

test('language switch preserves the compact settings controls', async ({page}) => {
  await page.locator('#language-toggle').check();
  await page.locator('#service-reaction').click();
  await expect(page.locator('#protocol-select')).toBeVisible();
  await expect(page.locator('#start-test-btn')).toHaveText('Start Test');
  await expect(page.locator('#compact-preview')).toBeVisible();
});
