import { expect, test } from '@playwright/test';

/**
 * Comprehensive visual regression tests covering:
 * - Settings/personal data screen
 * - Test selection screen with different stimulus modes
 * - Begin test summary screen
 */

test.beforeEach(async ({ page }) => {
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

async function navigateToSettings(page: any, language: 'en' | 'uk' = 'en') {
  await page.goto('./');
  if (language === 'en') {
    await page.locator('#language-toggle').check();
  }
  await page.locator('#service-reaction').click();
  await expect(page.locator('#personal-data-form')).toBeVisible();
}

async function fillPersonalData(page: any) {
  await page.locator('#surname-input').fill('Тестовий');
  await page.locator('#name-input').fill('Користувач');
  await page.locator('#age-input').fill('25');
  await page.locator('#gender-select').selectOption('male');
}

async function selectTestMode(page: any, mode: 'shapes' | 'colors' | 'words' | 'combined') {
  const radioSelector = `input[type="radio"][data-subsection="${mode}"]`;
  await page.locator(radioSelector).check();
  await page.waitForTimeout(200);
}

test.describe('Settings Screen - Personal Data Form', () => {
  test('Settings screen - Empty form (English)', async ({ page }) => {
    await navigateToSettings(page, 'en');
    await expect(page).toHaveScreenshot('settings-empty-en.png');
  });

  test('Settings screen - Empty form (Ukrainian)', async ({ page }) => {
    await navigateToSettings(page, 'uk');
    await expect(page).toHaveScreenshot('settings-empty-uk.png');
  });

  test('Settings screen - Filled form with shapes mode selected', async ({ page }) => {
    await navigateToSettings(page, 'en');
    await fillPersonalData(page);
    await selectTestMode(page, 'shapes');
    await expect(page).toHaveScreenshot('settings-filled-shapes-en.png');
  });

  test('Settings screen - Filled form with colors mode selected', async ({ page }) => {
    await navigateToSettings(page, 'en');
    await fillPersonalData(page);
    await selectTestMode(page, 'colors');
    await expect(page).toHaveScreenshot('settings-filled-colors-en.png');
  });

  test('Settings screen - Filled form with words mode selected', async ({ page }) => {
    await navigateToSettings(page, 'en');
    await fillPersonalData(page);
    await selectTestMode(page, 'words');
    await expect(page).toHaveScreenshot('settings-filled-words-en.png');
  });

  test('Settings screen - Filled form with combined mode selected', async ({ page }) => {
    await navigateToSettings(page, 'en');
    await fillPersonalData(page);
    await selectTestMode(page, 'combined');
    await expect(page).toHaveScreenshot('settings-filled-combined-en.png');
  });
});

test.describe('Test Selection Screen - Different Modes', () => {
  async function navigateToTestSelectionWithMode(page: any, mode: 'shapes' | 'colors' | 'words' | 'combined', language: 'en' | 'uk' = 'en') {
    await navigateToSettings(page, language);
    await fillPersonalData(page);
    await selectTestMode(page, mode);
    await page.locator('#start-test-btn').click();
    await expect(page.locator('#test-type-selection-screen')).toBeVisible();
  }

  test('Test selection - SVMR with shapes mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'shapes', 'en');
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-svmr-shapes.png');
  });

  test('Test selection - SVMR with colors mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'colors', 'en');
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-svmr-colors.png');
  });

  test('Test selection - SVMR with words mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'words', 'en');
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-svmr-words.png');
  });

  test('Test selection - SVMR with combined mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'combined', 'en');
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-svmr-combined.png');
  });

  test('Test selection - CRT1-3 with colors mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'colors', 'en');
    await page.locator('#rv1-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt13-colors.png');
  });

  test('Test selection - CRT1-3 with words mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'words', 'en');
    await page.locator('#rv1-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt13-words.png');
  });

  test('Test selection - CRT1-3 with combined mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'combined', 'en');
    await page.locator('#rv1-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt13-combined.png');
  });

  test('Test selection - CRT2-3 with colors mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'colors', 'en');
    await page.locator('#rv2-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt23-colors.png');
  });

  test('Test selection - CRT2-3 with words mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'words', 'en');
    await page.locator('#rv2-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt23-words.png');
  });

  test('Test selection - CRT2-3 with combined mode', async ({ page }) => {
    await navigateToTestSelectionWithMode(page, 'combined', 'en');
    await page.locator('#rv2-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt23-combined.png');
  });
});

test.describe('Test Selection Screen - Language Coverage', () => {
  async function navigateToTestSelectionDefaultMode(page: any, language: 'en' | 'uk' = 'en') {
    await navigateToSettings(page, language);
    await fillPersonalData(page);
    // Default mode is shapes
    await page.locator('#start-test-btn').click();
    await expect(page.locator('#test-type-selection-screen')).toBeVisible();
  }

  test('SVMR - Ukrainian with default shapes mode', async ({ page }) => {
    await navigateToTestSelectionDefaultMode(page, 'uk');
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-svmr-uk.png');
  });

  test('CRT1-3 - Ukrainian with default shapes mode', async ({ page }) => {
    await navigateToTestSelectionDefaultMode(page, 'uk');
    await page.locator('#rv1-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt13-uk.png');
  });

  test('CRT2-3 - Ukrainian with default shapes mode', async ({ page }) => {
    await navigateToTestSelectionDefaultMode(page, 'uk');
    await page.locator('#rv2-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-crt23-uk.png');
  });

  test('Switching flow - User switches from SVMR to CRT1-3 to CRT2-3', async ({ page }) => {
    await navigateToTestSelectionDefaultMode(page, 'en');

    // Start with SVMR
    await page.locator('#pzmr-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();

    // Switch to CRT1-3
    await page.locator('#rv1-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-switch-to-crt13.png');

    // Switch to CRT2-3
    await page.locator('#rv2-3-button').click();
    await expect(page.locator('#test-instruction-preview')).toBeVisible();
    await expect(page).toHaveScreenshot('test-selection-switch-to-crt23.png');
  });
});
