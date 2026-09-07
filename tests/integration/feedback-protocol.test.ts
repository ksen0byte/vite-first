// @vitest-environment happy-dom
//
// FEEDBACK-PROTOCOL RULES (doc §2.1/§2.2):
//  - A press during the window AFTER stimulus N expires (pause phase) is a
//    late answer TO N: classified against N, replaces its provisional
//    outcome. NOT a FalseStart on N+1.
//  - Exception: a pause-press before ANY stimulus was shown, or after a
//    trial that was already ANSWERED (during or after exposure), remains a
//    FalseStart on the upcoming trial.
//  - Adaptation happens EXACTLY ONCE per trial, when its window closes:
//    final correct (Success/CorrectRejection, incl. late) -> -step,
//    incorrect (Miss/FalseAlarm/MixUp/FalseStart) -> +step,
//    clamped to [minExposure, maxExposure]. (Adapting at expiry instead
//    would double-step when a late answer flips Miss->Success.)
//  - Mobility submode ends after stimulusCount trials (count-driven).
//  - Strength submode ends at the first closed window after `duration` seconds.
//  - Every trial records the exposure in force when its stimulus was shown
//    (exposureMs).
//
// Feedback timeline here (pause=200, exposure=300, window=200):
//   show#N at 4200+700*N, expiry +300, window close +200, next show +200.
//   Pregenerated shapes: #0 triangle(ignore) #1 circle(LEFT) #2 circle(LEFT)
//   #3 square(RIGHT) #4 square(RIGHT) #5 triangle(ignore).

import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {AppContext} from '../../src/config/domain.ts';
import AppContextManager from '../../src/config/AppContextManager.ts';
import Router from '../../src/routing/router.ts';
import {TestScreen} from '../../src/screens/test-screen.ts';
import {DeterministicScheduler} from '../support/deterministic-scheduler.ts';

const FEEDBACK = {
  initialExposure: 300,
  adjustmentStep: 20,
  minExposure: 260,
  maxExposure: 340,
  pause: 200,
  duration: 1800,
};

const createContext = (overrides: Partial<AppContext['testSettings']> = {}): AppContext => {
  const base = {
    personalData: {firstName: 'Ada', lastName: 'Example', age: 34, gender: 'female' as const},
    debugMode: 'debug' as const,
  };
  // Default to a feedback-mobility arm; callers override toward strength via `overrides`.
  const mobility: AppContext = {
    ...base,
    testSettings: {
      protocolMode: 'feedback-mobility',
      testMode: 'shapes',
      stimulusSize: 50,
      stimulusCount: 6,
      testType: 'crt2-3',
      usePregenerated: {stimuli: true},
      feedback: {...FEEDBACK},
    },
  };
  if (overrides.protocolMode === 'feedback-strength' || (overrides as {feedbackSubmode?: string}).feedbackSubmode === 'strength') {
    return {
      ...base,
      testSettings: {
        protocolMode: 'feedback-strength',
        testMode: 'shapes',
        stimulusSize: 50,
        testType: 'crt2-3',
        usePregenerated: {stimuli: true},
        feedback: {...FEEDBACK, ...('feedback' in overrides && overrides.feedback ? overrides.feedback : {})},
      },
    };
  }
  return {
    ...mobility,
    testSettings: {...mobility.testSettings, ...overrides} as AppContext['testSettings'],
  };
};

const press = (code: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', {code}));

const trialByIndex = (screen: TestScreen, index: number) =>
  screen.getTrials().find((t) => t.trialIndex === index);

describe('FEEDBACK protocol state machine rules', () => {
  let scheduler: DeterministicScheduler;
  let appContainer: HTMLElement;
  let screen: TestScreen;
  let navigateCalls: string[];

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    appContainer = document.getElementById('app')!;
    navigateCalls = [];
    (Router as unknown as {navigate: (path: string) => void}).navigate =
      (path: string) => {
        navigateCalls.push(path);
      };
    AppContextManager.setContext(createContext());
  });

  afterEach(() => {
    screen?.destroy();
    document.body.innerHTML = '';
  });

  const boot = (): void => {
    scheduler = new DeterministicScheduler();
    screen = new TestScreen(appContainer, scheduler);
    screen.setupScreen();
  };

  it('LATE HIT: unanswered LEFT-target answered in the window converts Miss->Success, one single -step', () => {
    boot();

    // #0 triangle (ignore): silence -> CorrectRejection; window closes 4700 -> -step (280).
    scheduler.advanceBy(4750);
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'CorrectRejection', stimulus: 'triangle'});
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure - FEEDBACK.adjustmentStep);

    // Unified cadence: #1 circle shown at 4700 with exposure 280 -> expiry 4980,
    // provisional Miss, late-answer window open until 5180.
    scheduler.advanceBy(350); // t=5100
    expect(trialByIndex(screen, 1)).toMatchObject({outcome: 'Miss', stimulus: 'circle'});
    // Adaptation is deferred to window close: still 280.
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure - FEEDBACK.adjustmentStep);

    // Late LEFT answer inside the window converts the trial to Success.
    press('ArrowLeft');
    expect(trialByIndex(screen, 1)).toMatchObject({
      outcome: 'Success',
      stimulus: 'circle',
      reactionTime: 400, // true elapsed since stimulus onset (4700)
    });

    // Window closes at 5180: exactly ONE -step total (no double-step for the Miss).
    scheduler.advanceBy(150); // t=5250
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure - 2 * FEEDBACK.adjustmentStep);
  });

  it('LATE MISS: silence through exposure AND window keeps Miss and applies +step', () => {
    boot();

    // #0 triangle: silence -> CorrectRejection (-step).
    scheduler.advanceBy(4750);
    // #1 circle: silence through show (4900), expiry (5200) AND window (5400).
    scheduler.advanceBy(700); // t=5450

    expect(trialByIndex(screen, 1)).toMatchObject({outcome: 'Miss', stimulus: 'circle'});
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure); // -step +step net
  });

  it('FIRST pause-press before any stimulus is still a FalseStart (+step)', () => {
    boot();
    scheduler.advanceBy(4050); // Delayed(#0)

    press('Space');
    expect(trialByIndex(screen, 0)?.outcome).toBe('FalseStart');

    scheduler.advanceBy(650); // expiry#0 4500 + window close 4700 passed
    expect(trialByIndex(screen, 0)?.outcome).toBe('FalseStart'); // not overwritten
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure + FEEDBACK.adjustmentStep);
  });

  it('window press after silent-ignore reclassifies CR->FalseAlarm (+step); further duplicates are ignored', () => {
    boot();

    // #0 triangle: silence -> provisional CorrectRejection at expiry 4500.
    scheduler.advanceBy(4550);
    expect(trialByIndex(screen, 0)?.outcome).toBe('CorrectRejection');

    // Late press on the ignore-stimulus inside the window: classified against
    // #0 -> FalseAlarm (pressing on "do not react" IS an error even late).
    scheduler.advanceBy(100); // t=4650
    press('Space');
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'FalseAlarm', stimulus: 'triangle'});

    // Duplicate press in the same window: trial already answered - ignored.
    press('Space');
    expect(screen.getTrials().filter((t) => t.trialIndex === 0)).toHaveLength(1);

    // Window closes at 4700 -> +step (error).
    scheduler.advanceBy(100); // t=4750
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure + FEEDBACK.adjustmentStep);
  });

  it('LATE MixUp: wrong-hand answer in the window counts as incorrect (+step)', () => {
    boot();

    // #0 triangle: silence -> CorrectRejection (-step at window close 4700).
    scheduler.advanceBy(4750);

    // #1 circle (LEFT target) shown at 4700, exposure 280: silent through
    // expiry 4980 -> provisional Miss; then WRONG hand inside the window.
    scheduler.advanceBy(350); // t=5100
    press('ControlRight'); // expected LEFT

    expect(trialByIndex(screen, 1)).toMatchObject({outcome: 'MixUp', stimulus: 'circle'});
    scheduler.advanceBy(150); // window close 5180 -> -step (#0) then +step (#1)
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure);
  });

  it('exposureMs records the exposure in force per trial and clamps to [min,max]', () => {
    AppContextManager.setContext(createContext({
      stimulusCount: 8,
      feedback: {...FEEDBACK, adjustmentStep: 500}, // brutal steps force clamping
    }));
    boot();

    // All-silent session over shapes [tri, cir, cir, sq, sq, tri, cir, cir]:
    // silence on ignore-targets = CorrectRejection (-step), on real targets =
    // Miss (+step); every step clamps. Expected exposures, derived by hand:
    //   #0 300 -> CR: 300-500 -> 260
    //   #1 260 -> Miss: +500 -> 340 | #2..#4 stay 340 (misses)
    //   #5 340 -> CR: -500 -> 260 | #6 260 -> Miss: -> 340 | #7 340
    scheduler.advanceBy(12_000);

    const trials = screen.getTrials();
    expect(trials).toHaveLength(8);
    expect(trials.map((t) => t.exposureMs)).toEqual([300, 260, 340, 340, 340, 340, 260, 340]);
    for (const trial of trials) {
      expect(trial.exposureMs).toBeGreaterThanOrEqual(FEEDBACK.minExposure);
      expect(trial.exposureMs).toBeLessThanOrEqual(FEEDBACK.maxExposure);
    }
  });

  it('MOBILITY ends after stimulusCount trials', () => {
    boot(); // stimulusCount=6
    scheduler.advanceBy(12_000);

    expect(screen.getTrials()).toHaveLength(6);
    expect(document.body.innerHTML).toContain('data-localize="testScreenTestCompleteMessage"');
  });

  it('STRENGTH ends at the first closed window past the configured duration', () => {
    AppContextManager.setContext(createContext({
      protocolMode: 'feedback-strength',
      feedback: {...FEEDBACK, duration: 3}, // seconds; start 4000 -> deadline 7000
    }));
    boot();

    scheduler.advanceBy(12_000); // way past duration

    const trials = screen.getTrials();
    // All-silent adaptive cadence over [tri,cir,cir,sq,sq,tri]: windows close at
    // 4700/5180/5460/5940/6220/6700 (exposures 280/260/340/340/340/280) - the
    // first close at/after the 7000 deadline would be next (#6), so 6 trials ran.
    expect(trials.length).toBe(6);
    expect(trials.every((t) => t.exposureMs !== undefined)).toBe(true);
    expect(document.body.innerHTML).toContain('data-localize="testScreenTestCompleteMessage"');
  });

  it('spam protection still routes to /spam-warning in feedback mode', () => {
    boot();
    scheduler.advanceBy(4350);
    press('Space');
    press('Space');
    press('Space');
    press('Space');
    expect(navigateCalls).toEqual(['/spam-warning']);
  });

  it('CRT1-3 under feedback: CorrectRejection adapts down, non-target press adapts up', () => {
    AppContextManager.setContext(createContext({
      testType: 'crt1-3',
      stimulusCount: 4,
      // Shapes: #0 triangle(ignore) #1 circle(non-target) ...
    }));
    boot();

    // #0 triangle ignored -> CorrectRejection, window closes 4700 -> -step (280).
    scheduler.advanceBy(4750);
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure - FEEDBACK.adjustmentStep);

    // #1 circle shown at 4700 with exposure 280: Space press during exposure
    // (t=5050) -> FalseAlarm under crt1-3.
    scheduler.advanceBy(300); // t=5050
    press('Space');
    expect(trialByIndex(screen, 1)).toMatchObject({outcome: 'FalseAlarm'});

    // Window closes 5180 -> +step: back to initial.
    scheduler.advanceBy(200); // t=5250
    expect(screen.getCurrentExposureMs()).toBe(FEEDBACK.initialExposure);
  });
});
