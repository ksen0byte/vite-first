// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { localize } from '../../src/localization/localization.ts';
import { TestMode, TestType } from '../../src/config/domain.ts';

describe('Instructions and Preview Consistency', () => {
  const testTypes: readonly TestType[] = ['svmr', 'crt1-3', 'crt2-3'];
  const testModes: readonly TestMode[] = ['shapes', 'words', 'colors', 'combined'];

  it('provides non-empty instructions in both languages for all testType and testMode combinations', () => {
    for (const testType of testTypes) {
      for (const testMode of testModes) {
        const taskKey = testType === 'svmr'
          ? 'instructionSvmr'
          : testType === 'crt1-3'
            ? `instructionCRT13_${testMode}`
            : `instructionCRT23_${testMode}`;

        const text = localize(taskKey);
        expect(text).toBeTruthy();
        expect(text).not.toBe(taskKey);
      }
    }
  });

  it('provides protocol instruction texts', () => {
    expect(localize('instructionOptimal')).toBeTruthy();
    expect(localize('instructionFeedback')).toBeTruthy();
  });

  it('provides preview ignore and space label keys', () => {
    expect(localize('previewIgnore')).toBe('ігнорувати');
    expect(localize('testScreenTestPZMRActionButtonName')).toBe('Пробіл');
  });
});
