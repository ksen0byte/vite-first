import {describe, expect, it} from 'vitest';
import {ReactionTimeStats as NodeStats} from '../../src/stats/ReactionTimeStats.node.ts';
import {TrialOutcome, TrialResult} from '../../src/config/domain.ts';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}},
});

const {ReactionTimeStats: BrowserStats, MultiHandReactionTimeStats} = await import('../../src/stats/ReactionTimeStats.ts');

const trial = (
  reactionTime: number,
  outcome: TrialOutcome = 'Success',
  expectedAction: TrialResult['expectedAction'] = 'DEFAULT',
  motorComponent: number | null = null,
  actualAction: TrialResult['actualAction'] = expectedAction,
): TrialResult => ({
  trialIndex: reactionTime,
  stimulus: 'circle',
  reactionTime,
  outcome,
  expectedAction,
  actualAction,
  motorComponent,
});

const implementations = [
  ['browser', BrowserStats],
  ['node', NodeStats],
] as const;

describe('MultiHandReactionTimeStats hand attribution', () => {
  it('uses expected hand first, then actual hand, and leaves correct rejections unassigned', () => {
    const stats = new MultiHandReactionTimeStats([
      trial(250, 'Miss', 'LEFT', null, 'NONE'),
      trial(260, 'MixUp', 'RIGHT', null, 'LEFT'),
      trial(270, 'FalseAlarm', 'NONE', null, 'LEFT'),
      trial(280, 'FalseStart', 'NONE', null, 'RIGHT'),
      trial(290, 'CorrectRejection', 'NONE', null, 'NONE'),
    ]);

    expect(stats.total.errorCount).toBe(4);
    expect(stats.left.errorCount).toBe(2);
    expect(stats.right.errorCount).toBe(2);
    expect(stats.left.outcomeCountsByOutcome.CorrectRejection).toBe(0);
    expect(stats.right.outcomeCountsByOutcome.CorrectRejection).toBe(0);
  });
});

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
    expect(stats).toMatchObject({count: 2, filteredCount: 2, meanVal: 400});
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

  it('marks motor component as not recorded when trials have no motor data', () => {
    const stats = new Stats([trial(250), trial(300)]);
    expect(stats.hasMotorComponentData).toBe(false);
    expect(stats.motorComponentVal).toBeNull();
    expect(stats.motorComponent).toEqual({kind: 'NotRecorded'});
  });

  it('calculates average motor component for successful trials within 10-150ms filter', () => {
    const stats = new Stats([
      trial(250, 'Success', 'DEFAULT', 50),
      trial(300, 'Success', 'DEFAULT', 70),
    ]);
    expect(stats.hasMotorComponentData).toBe(true);
    expect(stats.motorComponentVal).toBe(60);
    expect(stats.motorComponent).toMatchObject({kind: 'Available', meanMs: 60, validCount: 2});
  });

  it('filters out motor component values strictly outside 10-150ms and includes boundary values', () => {
    const stats = new Stats([
      trial(200, 'Success', 'DEFAULT', 9),    // below 10 -> excluded
      trial(220, 'Success', 'DEFAULT', 10),   // exact min -> included
      trial(240, 'Success', 'DEFAULT', 150),  // exact max -> included
      trial(260, 'Success', 'DEFAULT', 151),  // above 150 -> excluded
    ]);
    expect(stats.hasMotorComponentData).toBe(true);
    expect(stats.motorComponentVal).toBe(80); // (10 + 150) / 2
    expect(stats.motorComponent).toMatchObject({kind: 'Available', meanMs: 80, validCount: 2});
  });

  it('ignores motor component on non-successful trials', () => {
    const stats = new Stats([
      trial(250, 'Success', 'DEFAULT', 50),
      trial(260, 'Miss', 'DEFAULT', 40),
      trial(270, 'FalseAlarm', 'DEFAULT', 45),
      trial(280, 'FalseStart', 'DEFAULT', 30),
    ]);
    expect(stats.hasMotorComponentData).toBe(true);
    expect(stats.motorComponentVal).toBe(50);
    expect(stats.motorComponent).toMatchObject({kind: 'Available', meanMs: 50, validCount: 1});
  });

  it('returns NoValidSamples if all motor values are filtered out', () => {
    const stats = new Stats([
      trial(250, 'Success', 'DEFAULT', 5),
      trial(300, 'Success', 'DEFAULT', 200),
    ]);
    expect(stats.hasMotorComponentData).toBe(true);
    expect(stats.motorComponentVal).toBeNull();
    expect(stats.motorComponent).toMatchObject({kind: 'NoValidSamples', totalRecorded: 2, successfulRecorded: 2});
  });

  it('calculates sensory component as mean minus motor component for svmr', () => {
    const stats = new Stats([
      trial(250, 'Success', 'DEFAULT', 50),
      trial(350, 'Success', 'DEFAULT', 70),
    ]);
    // Mean RT = 300ms, Motor Component = 60ms -> Sensory Component = 240ms
    expect(stats.meanVal).toBe(300);
    expect(stats.motorComponentVal).toBe(60);
    expect(stats.sensoryComponentVal).toBe(240);
    expect(stats.sensoryComponent).toEqual({kind: 'Available', valueMs: 240});
  });

  it('marks sensory component as NotRecorded when motor component is NotRecorded', () => {
    const stats = new Stats([trial(250), trial(350)]);
    expect(stats.sensoryComponentVal).toBeNull();
    expect(stats.sensoryComponent).toEqual({kind: 'NotRecorded'});
  });

  it('marks sensory component as NoValidMotorData when motor component is NoValidSamples', () => {
    const stats = new Stats([
      trial(250, 'Success', 'DEFAULT', 5),
      trial(350, 'Success', 'DEFAULT', 200),
    ]);
    expect(stats.sensoryComponentVal).toBeNull();
    expect(stats.sensoryComponent).toEqual({kind: 'NoValidMotorData'});
  });

  it('marks sensory component as NotApplicable when testType is not svmr', () => {
    const statsCrt1 = new Stats([
      trial(250, 'Success', 'DEFAULT', 50),
      trial(350, 'Success', 'DEFAULT', 70),
    ], 700, 100, 'crt1-3', undefined);
    expect(statsCrt1.sensoryComponentVal).toBeNull();
    expect(statsCrt1.sensoryComponent).toEqual({kind: 'NotApplicable'});

    const statsCrt2 = new Stats([
      trial(250, 'Success', 'DEFAULT', 50),
      trial(350, 'Success', 'DEFAULT', 70),
    ], 700, 100, 'crt2-3', undefined);
    expect(statsCrt2.sensoryComponentVal).toBeNull();
    expect(statsCrt2.sensoryComponent).toEqual({kind: 'NotApplicable'});
  });
});

describe('multi-hand CRT2-3 characterization', () => {
  it('splits successful trials by their expected left and right actions', () => {
    const stats = new MultiHandReactionTimeStats([
      trial(220, 'Success', 'LEFT', 40),
      trial(240, 'Success', 'RIGHT', 60),
      trial(260, 'Success', 'DEFAULT', 80),
    ]);
    expect(stats.total.count).toBe(3);
    expect(stats.total.motorComponentVal).toBe(60); // (40 + 60 + 80) / 3
    expect(stats.total.sensoryComponent).toEqual({kind: 'NotApplicable'});
    expect(stats.total.sensoryComponentVal).toBeNull();
    expect(stats.left).toMatchObject({count: 1, meanVal: 220, motorComponentVal: 40});
    expect(stats.left.sensoryComponent).toEqual({kind: 'NotApplicable'});
    expect(stats.right).toMatchObject({count: 1, meanVal: 240, motorComponentVal: 60});
    expect(stats.right.sensoryComponent).toEqual({kind: 'NotApplicable'});
  });
});

describe('browser and node drift', () => {
  it.skip('keeps independent hard bounds because the one-off CLI is deprecated', () => {});
  it.skip('keeps its independent coefficient scale because the one-off CLI is deprecated', () => {});
});
