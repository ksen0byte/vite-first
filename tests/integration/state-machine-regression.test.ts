// @vitest-environment happy-dom
//
// REGRESSION SUITE — pins the CURRENT state-machine behavior of TestScreen.
// These tests must pass BEFORE and AFTER the feedback-protocol changes:
// optimal-mode semantics are frozen here. Feedback-specific rules get their
// own suite; this file may only be touched to keep pins intact, not to
// redefine behavior.
//
// Timeline mechanics discovered while pinning (do not "fix" casually):
//  - Countdown displays labels at t=0/1000/2000/3000 and calls runTest() on
//    the NEXT tick: t=4000. First stimulus shows at 4000 + pause.
//  - With pause=250/exposure=500: show#N at 4250+750*N, expiry at +500.
//    Timeout N fires at the same instant show N+1 is scheduled (zero gap),
//    so advancing past an expiry lands either in the new Delayed or, one
//    tick later, directly inside the next stimulus window.
//  - Spam counter increments BEFORE the reaction-threshold guard, so even
//    sub-threshold presses count toward the 3-inputs-per-cycle limit; the
//    4th input routes to /spam-warning. A press at RT exactly 100 ms IS
//    accepted (guard is strict less-than).
//  - Pregenerated SHAPE_SEQUENCE: [#0 triangle, #1 circle, #2 circle,
//    #3 square]. CRT1-3 targets: square; CRT2-3 mapping: square->RIGHT,
//    circle->LEFT, triangle->ignore.
//  - classifyResponse: svmr/crt1-3 any press on target = Success, on
//    ignore-target = FalseAlarm (hand codes are filtered before the machine
//    for these types); crt2-3 wrong hand = MixUp; silent ignore =
//    CorrectRejection.

import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {AppContext, TrialResult} from '../../src/config/domain.ts';
import AppContextManager from '../../src/config/AppContextManager.ts';
import {defaultAppContext} from '../../src/config/settings.ts';
import Router from '../../src/routing/router.ts';
import {TestScreen} from '../../src/screens/test-screen.ts';
import {DeterministicScheduler} from '../support/deterministic-scheduler.ts';

const createContext = (overrides: Partial<AppContext['testSettings']> = {}): AppContext => ({
  ...defaultAppContext,
  personalData: {firstName: 'Ada', lastName: 'Example', age: 34, gender: 'female'},
  debugMode: 'debug',
  testSettings: {
    ...defaultAppContext.testSettings,
    testMode: 'shapes',
    stimulusSize: 50,
    exposureTime: 500,
    // 250/250 keeps getNextDelayForRandom deterministic (rand*(0)+250).
    exposureDelay: [250, 250],
    stimulusCount: 4,
    testType: 'svmr',
    usePregenerated: {exposureDelay: false, stimuli: true},
    ...overrides,
  },
});

const press = (code: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', {code}));

const trialByIndex = (screen: TestScreen, index: number): TrialResult | undefined =>
  screen.getTrials().find((t) => t.trialIndex === index);

describe('REGRESSION: optimal-mode state machine (pinned behavior)', () => {
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

  it('clean SVMR run: every hit is a Success with its true reaction time', () => {
    boot();
    scheduler.advanceBy(4400); // stimulus #0 (triangle) visible since t=4250

    press('Space'); // RT = 150 ms
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'Success', reactionTime: 150});

    scheduler.advanceBy(750); // t=5150: stimulus #1 (circle) visible since 5000
    press('Space');
    expect(trialByIndex(screen, 1)).toMatchObject({outcome: 'Success', reactionTime: 150});

    scheduler.advanceBy(750); // t=5900: #2 (circle) since 5750
    press('Space');
    expect(trialByIndex(screen, 2)).toMatchObject({outcome: 'Success', reactionTime: 150});

    scheduler.advanceBy(750); // t=6650: #3 (square) since 6500
    press('Space');
    expect(trialByIndex(screen, 3)).toMatchObject({outcome: 'Success', reactionTime: 150});

    scheduler.advanceBy(400); // expiry of #3 at 7000 -> end screen
    expect(screen.getTrials()).toHaveLength(4);
    expect(screen.getTrials().every((t) => t.outcome === 'Success')).toBe(true);
    expect(document.body.innerHTML).toContain('data-localize="testScreenTestCompleteMessage"');
    expect(navigateCalls).toEqual([]);
  });

  it('records a Miss (-1 ms) when no key is pressed during exposure', () => {
    boot();
    scheduler.advanceBy(4751); // expiry of #0 fires at 4750

    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'Miss', reactionTime: -1});
  });

  it('a FalseStart POISONS its trial index: neither later presses nor expiry change the record', () => {
    boot(); // runTest at t=4000, first show at 4250
    scheduler.advanceBy(4050); // inside Delayed(#0)

    press('Space');
    expect(trialByIndex(screen, 0)).toMatchObject({
      outcome: 'FalseStart',
      stimulus: 'none',
      reactionTime: -1,
      expectedAction: 'NONE',
    });

    scheduler.advanceBy(350); // t=4400: stimulus #0 visible since 4250
    press('Space');           // REJECTED: index already has a record
    expect(trialByIndex(screen, 0)?.outcome).toBe('FalseStart');

    scheduler.advanceBy(450); // t=4850: expiry of #0 fired at 4750 -> now Delayed(#1)
    press('Space');
    expect(trialByIndex(screen, 1)?.outcome).toBe('FalseStart');
    expect(trialByIndex(screen, 1)?.stimulus).toBe('none');

    scheduler.advanceBy(300); // t=5150: #1 visible since 5000
    press('Space');           // rejected: index 1 already poisoned
    expect(trialByIndex(screen, 1)?.outcome).toBe('FalseStart');
  });

  it('ignores presses below the 100 ms reaction threshold but accepts from 100 ms onward', () => {
    boot();
    scheduler.advanceBy(4349); // stimulus #0 visible, would-be RT = 99 ms

    press('Space');
    expect(trialByIndex(screen, 0)).toBeUndefined();

    scheduler.advanceBy(101); // t=4450 -> RT 200 ms
    press('Space');
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'Success', reactionTime: 200});
  });

  it('routes the 4th input in one cycle to /spam-warning (threshold-ignored presses still count)', () => {
    boot();
    scheduler.advanceBy(4349);

    press('Space'); // ignored (<100ms) but counted
    press('Space');
    press('Space');
    press('Space'); // 4th -> spam

    expect(navigateCalls).toEqual(['/spam-warning']);
    expect(screen.getTrials()).toHaveLength(0);
  });

  it('completes automatically after stimulusCount trials even with zero participation', () => {
    boot();
    scheduler.advanceBy(7100); // expiries at 4750/5500/6250/7000

    expect(screen.getTrials()).toHaveLength(4);
    expect(screen.getTrials().every((t) => t.outcome === 'Miss')).toBe(true);
    expect(document.body.innerHTML).toContain('data-localize="testScreenTestCompleteMessage"');
  });

  it('CRT1-3: hand keys are filtered out; Space on ignore-target is FalseAlarm, on target Success', () => {
    AppContextManager.setContext(createContext({testType: 'crt1-3'}));
    boot();
    scheduler.advanceBy(4050); // Delayed(#0)

    press('ControlRight');
    press('ArrowLeft');
    expect(screen.getTrials()).toHaveLength(0); // filtered before the state machine

    scheduler.advanceBy(350); // t=4400: triangle (#0) = ignore target
    press('Space');
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'FalseAlarm', stimulus: 'triangle'});

    scheduler.advanceBy(2250); // t=6650: square (#3) visible since 6500
    press('Space');            // any press on a CRT1-3 target counts as Success
    expect(trialByIndex(screen, 3)).toMatchObject({outcome: 'Success', stimulus: 'square'});
  });

  it('CRT2-3: all six outcomes in one session (FA, FalseStart, MixUp, Success, Miss, CorrectRejection)', () => {
    AppContextManager.setContext(createContext({testType: 'crt2-3', stimulusCount: 6}));
    boot();

    // #0 triangle (ignore): press -> FalseAlarm
    scheduler.advanceBy(4400);
    press('Space');
    expect(trialByIndex(screen, 0)).toMatchObject({outcome: 'FalseAlarm', stimulus: 'triangle'});

    // Delayed(#1): press -> FalseStart (poisons index 1)
    scheduler.advanceBy(450); // t=4850
    press('Space');
    expect(trialByIndex(screen, 1)?.outcome).toBe('FalseStart');

    // #1 circle shown at 5000: press rejected (index already recorded)
    scheduler.advanceBy(300); // t=5150
    press('ArrowLeft');
    expect(trialByIndex(screen, 1)?.outcome).toBe('FalseStart');

    // #2 circle shown at 5750: wrong hand -> MixUp
    scheduler.advanceBy(900); // t=6050
    press('ControlRight');    // expected LEFT
    expect(trialByIndex(screen, 2)).toMatchObject({outcome: 'MixUp', stimulus: 'circle'});

    // #3 square shown at 6500: correct hand -> Success
    scheduler.advanceBy(650); // t=6700
    press('ShiftRight');
    expect(trialByIndex(screen, 3)).toMatchObject({outcome: 'Success', stimulus: 'square'});

    // #4 square shown at 7250: silence on a TARGET -> Miss
    scheduler.advanceBy(1050); // t=7750: expiry fires
    expect(trialByIndex(screen, 4)).toMatchObject({outcome: 'Miss', stimulus: 'square'});

    // #5 triangle shown at 8000: silence on IGNORE -> CorrectRejection
    scheduler.advanceBy(750); // t=8500: expiry fires
    expect(trialByIndex(screen, 5)).toMatchObject({outcome: 'CorrectRejection', stimulus: 'triangle'});

    expect(screen.getTrials()).toHaveLength(6);
    expect(navigateCalls).toEqual([]);
  });

  it('optimal mode never adapts exposure regardless of outcomes', () => {
    boot();
    scheduler.advanceBy(4400);
    const initial = screen.getCurrentExposureMs();
    expect(initial).toBe(500); // pinned: createContext() overrides exposureTime to 500

    scheduler.advanceBy(360); // expiry of #0 at 4750 (no press) -> Miss
    expect(screen.getCurrentExposureMs()).toBe(initial);

    scheduler.advanceBy(390); // t=5150: circle (#1) visible since 5000
    press('Space');           // SVMR expects DEFAULT for every shape
    expect(trialByIndex(screen, 1)?.outcome).toBe('Success');
    expect(screen.getCurrentExposureMs()).toBe(initial);
  });
});
