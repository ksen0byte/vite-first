import { describe, expect, it } from 'vitest';
import { TestType } from '../../src/config/domain.ts';
import {
  classifyResponse,
  getExpectedAction,
  isAcceptedTrialInput,
  mapInputCode,
} from '../../src/domain/test-response.ts';

const responseCodes = [
  'Space',
  'ControlRight',
  'ShiftRight',
  'ArrowRight',
  'ControlLeft',
  'ShiftLeft',
  'ArrowLeft',
] as const;

describe('trial input policy', () => {
  it.each(['svmr', 'crt1-3'] as const)('accepts only Space for %s', (testType) => {
    expect(isAcceptedTrialInput(testType, 'Space')).toBe(true);

    for (const code of responseCodes.filter((code) => code !== 'Space')) {
      expect(isAcceptedTrialInput(testType, code)).toBe(false);
    }
  });

  it('retains all documented CRT2-3 response keys', () => {
    for (const code of responseCodes) {
      expect(isAcceptedTrialInput('crt2-3', code)).toBe(true);
    }
    expect(isAcceptedTrialInput('crt2-3', 'KeyA')).toBe(false);
  });

  it('maps accepted keys to their actions', () => {
    expect(mapInputCode('Space')).toBe('DEFAULT');
    expect(mapInputCode('ControlRight')).toBe('RIGHT');
    expect(mapInputCode('ShiftRight')).toBe('RIGHT');
    expect(mapInputCode('ArrowRight')).toBe('RIGHT');
    expect(mapInputCode('ControlLeft')).toBe('LEFT');
    expect(mapInputCode('ShiftLeft')).toBe('LEFT');
    expect(mapInputCode('ArrowLeft')).toBe('LEFT');
  });
});

describe('expected actions', () => {
  it('keeps SVMR responses as DEFAULT for every stimulus', () => {
    expect(getExpectedAction('circle', 'svmr')).toBe('DEFAULT');
  });

  it.each([
    ['red', 'DEFAULT'],
    ['square', 'DEFAULT'],
    ['cat', 'DEFAULT'],
    ['green', 'NONE'],
  ] as const)('classifies CRT1-3 stimulus %s as %s', (stimulus, expectedAction) => {
    expect(getExpectedAction(stimulus, 'crt1-3')).toBe(expectedAction);
  });

  it.each([
    ['red', 'RIGHT'],
    ['square', 'RIGHT'],
    ['cat', 'RIGHT'],
    ['green', 'LEFT'],
    ['circle', 'LEFT'],
    ['pine', 'LEFT'],
    ['yellow', 'NONE'],
  ] as const)('classifies CRT2-3 stimulus %s as %s', (stimulus, expectedAction) => {
    expect(getExpectedAction(stimulus, 'crt2-3')).toBe(expectedAction);
  });
});

describe('response outcomes', () => {
  const testTypes: readonly TestType[] = ['svmr', 'crt1-3'];

  it.each(testTypes)('keeps %s target and distractor outcomes', (testType) => {
    expect(classifyResponse(testType, 'DEFAULT', 'DEFAULT')).toBe('Success');
    expect(classifyResponse(testType, 'NONE', 'DEFAULT')).toBe('FalseAlarm');
  });

  it('classifies every CRT2-3 response outcome', () => {
    expect(classifyResponse('crt2-3', 'RIGHT', 'RIGHT')).toBe('Success');
    expect(classifyResponse('crt2-3', 'LEFT', 'LEFT')).toBe('Success');
    expect(classifyResponse('crt2-3', 'RIGHT', 'LEFT')).toBe('MixUp');
    expect(classifyResponse('crt2-3', 'LEFT', 'RIGHT')).toBe('MixUp');
    expect(classifyResponse('crt2-3', 'NONE', 'RIGHT')).toBe('FalseAlarm');
  });
});
