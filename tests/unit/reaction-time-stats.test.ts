import {describe, expect, it} from 'vitest';
import {ReactionTimeStats as NodeStats} from '../../src/stats/ReactionTimeStats.node.ts';
import {TrialOutcome, TrialResult} from '../../src/config/domain.ts';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}},
});

const {ReactionTimeStats: BrowserStats, MultiHandReactionTimeStats} = await import('../../src/stats/ReactionTimeStats.ts');

const trial = (reactionTime: number, outcome: TrialOutcome = 'Success', expectedAction: TrialResult['expectedAction'] = 'DEFAULT'): TrialResult => ({
  trialIndex: reactionTime,
  stimulus: 'circle',
  reactionTime,
  outcome,
  expectedAction,
  actualAction: expectedAction,
});

const implementations = [
  ['browser', BrowserStats],
  ['node', NodeStats],
] as const;

describe.each(implementations)('%s ReactionTimeStats characterization', (_name, Stats) => {
  it('handles an empty result set', () => {
    const stats = new Stats([]);
    expect(stats).toMatchObject({count: 0, meanVal: 0, stdevVal: 0, entropyVal: 0});
  });

  it('retains a single successful value inside the hard bounds', () => {
    const stats = new Stats([trial(250)]);
    expect(stats).toMatchObject({count: 1, meanVal: 250, stdevVal: 0, entropyVal: 0});
  });

  it('retains two successful values', () => {
    const stats = new Stats([trial(200), trial(400)]);
    expect(stats).toMatchObject({count: 2, meanVal: 300});
  });

  it('characterizes an ordinary varied sample', () => {
    const stats = new Stats([trial(100), trial(200), trial(300), trial(400), trial(500)]);
    expect(stats.count).toBe(5);
    expect(stats.meanVal).toBe(300);
    expect(Number.isFinite(stats.entropyVal)).toBe(true);
  });

  it('includes values exactly at the hard bounds and excludes outside values', () => {
    const stats = new Stats([trial(99), trial(100), trial(700), trial(701)], 700, 100);
    expect(stats).toMatchObject({count: 2, meanVal: 400});
  });

  it('counts every error outcome without treating it as a successful reaction', () => {
    const stats = new Stats([
      trial(250),
      trial(260, 'Miss'),
      trial(270, 'FalseAlarm'),
      trial(280, 'FalseStart'),
      trial(290, 'MixUp'),
      trial(300, 'CorrectRejection'),
    ]);
    expect(stats.count).toBe(1);
    expect(stats.errorCount).toBe(4);
    expect(stats.outcomeCountsByOutcome).toEqual({
      Miss: 1, FalseAlarm: 1, FalseStart: 1, MixUp: 1, CorrectRejection: 1,
    });
  });

  it('handles multiple identical successful values with a deterministic bin', () => {
    const stats = new Stats([trial(250), trial(250), trial(250)]);
    expect(stats).toMatchObject({count: 3, meanVal: 250, stdevVal: 0, entropyVal: 0, modeVal: null});
  });
  it('represents Loskutova values as unavailable when standard deviation is zero', () => {
    const stats = new Stats([trial(250), trial(250), trial(250)]);
    expect(stats.calculateFunctionalLevel()).toBeNull();
    expect(stats.calculateReactionStability()).toBeNull();
    expect(stats.calculateFunctionalCapabilities()).toBeNull();
  });
});

describe('multi-hand CRT2-3 characterization', () => {
  it('splits successful trials by their expected left and right actions', () => {
    const stats = new MultiHandReactionTimeStats([
      trial(220, 'Success', 'LEFT'),
      trial(240, 'Success', 'RIGHT'),
      trial(260, 'Success', 'DEFAULT'),
    ]);
    expect(stats.total.count).toBe(3);
    expect(stats.left).toMatchObject({count: 1, meanVal: 220});
    expect(stats.right).toMatchObject({count: 1, meanVal: 240});
  });
});

describe('browser and node drift', () => {
  it.skip('keeps independent hard bounds because the one-off CLI is deprecated', () => {});
  it.skip('keeps its independent coefficient scale because the one-off CLI is deprecated', () => {});
});
