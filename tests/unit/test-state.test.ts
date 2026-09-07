import { describe, expect, it } from 'vitest';
import { TestSettings } from '../../src/config/domain.ts';
import { EXPOSITION_DELAY_SEQUENCE } from '../../src/domain/stimulus-sequences.ts';
import { getNextDelayForRandom } from '../../src/domain/test-state.ts';

const randomDelaySettings: TestSettings = {
  protocolMode: 'optimal',
  testMode: 'shapes',
  stimulusSize: 25,
  exposureTime: 700,
  exposureDelay: [500, 1900],
  stimulusCount: 3,
  testType: 'svmr',
  usePregenerated: {
    exposureDelay: false,
    stimuli: true,
  },
};

const pregeneratedDelaySettings: TestSettings = {
  ...randomDelaySettings,
  usePregenerated: {
    ...randomDelaySettings.usePregenerated,
    exposureDelay: true,
  },
};

describe('getNextDelayForRandom', () => {
  it('uses the pregenerated value at index zero', () => {
    expect(getNextDelayForRandom(pregeneratedDelaySettings, 0, 0.99))
      .toBe(EXPOSITION_DELAY_SEQUENCE[0]);
  });

  it('wraps pregenerated delays at the end of the sequence', () => {
    const wrappedIndex = EXPOSITION_DELAY_SEQUENCE.length;

    expect(getNextDelayForRandom(pregeneratedDelaySettings, wrappedIndex, 0.99))
      .toBe(EXPOSITION_DELAY_SEQUENCE[0]);
  });

  it('returns the inclusive minimum when the random source is zero', () => {
    expect(getNextDelayForRandom(randomDelaySettings, 0, 0)).toBe(500);
  });

  it('returns the inclusive maximum when the random source is near one', () => {
    expect(getNextDelayForRandom(randomDelaySettings, 0, 0.999999)).toBe(1900);
  });

  it('preserves inclusive integer boundaries for a short range', () => {
    const settings: TestSettings = {
      ...randomDelaySettings,
      exposureDelay: [10, 12],
    };

    expect(getNextDelayForRandom(settings, 0, 0)).toBe(10);
    expect(getNextDelayForRandom(settings, 0, 0.34)).toBe(11);
    expect(getNextDelayForRandom(settings, 0, 0.999999)).toBe(12);
  });
});
