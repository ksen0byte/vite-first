// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {calculateMotorComponentStats} from '../../src/stats/ReactionTimeStats.ts';
import {setupProfileScreen} from '../../src/screens/user-profile-screen.ts';
import {setupResultsScreen} from '../../src/screens/results-screen.ts';
import {TestScreen} from '../../src/screens/test-screen.ts';
import AppContextManager from '../../src/config/AppContextManager.ts';
import {defaultAppContext} from '../../src/config/settings.ts';
import {DeterministicScheduler} from '../support/deterministic-scheduler.ts';
import {TrialResult, TestSettings} from '../../src/config/domain.ts';
import {parseImportedJson} from '../../src/util/import-json.ts';
import {LanguageManager} from '../../src/localization/LanguageManager.ts';
import {updateLanguageUI} from '../../src/localization/localization.ts';
import {User} from "../../src/db/db";

const createTrial = (
  trialIndex: number,
  reactionTime: number,
  outcome: TrialResult['outcome'] = 'Success',
  expectedAction: TrialResult['expectedAction'] = 'DEFAULT',
  actualAction: TrialResult['actualAction'] = expectedAction,
  motorComponent: number | null = null,
): TrialResult => ({
  trialIndex,
  stimulus: 'circle',
  reactionTime,
  outcome,
  expectedAction,
  actualAction,
  motorComponent,
});

describe('Motor Component Calculation and Stats', () => {
  it('returns NotRecorded when no trials have motorComponent', () => {
    const trials = [createTrial(0, 200), createTrial(1, 250)];
    const result = calculateMotorComponentStats(trials);
    expect(result).toEqual({kind: 'NotRecorded'});
  });

  it('calculates mean for successful trials within [10, 150]ms', () => {
    const trials = [
      createTrial(0, 200, 'Success', 'DEFAULT', 'DEFAULT', 50),
      createTrial(1, 250, 'Success', 'DEFAULT', 'DEFAULT', 70),
      createTrial(2, 300, 'Success', 'DEFAULT', 'DEFAULT', 90),
    ];
    const result = calculateMotorComponentStats(trials);
    expect(result).toMatchObject({kind: 'Available', meanMs: 70, validCount: 3, totalRecorded: 3});
  });

  it('filters out values strictly less than 10ms or greater than 150ms', () => {
    const trials = [
      createTrial(0, 200, 'Success', 'DEFAULT', 'DEFAULT', 9),   // excluded (< 10)
      createTrial(1, 250, 'Success', 'DEFAULT', 'DEFAULT', 10),  // included (boundary min)
      createTrial(2, 300, 'Success', 'DEFAULT', 'DEFAULT', 150), // included (boundary max)
      createTrial(3, 350, 'Success', 'DEFAULT', 'DEFAULT', 151), // excluded (> 150)
    ];
    const result = calculateMotorComponentStats(trials);
    expect(result).toMatchObject({kind: 'Available', meanMs: 80, validCount: 2, totalRecorded: 4});
  });

  it('returns NoValidSamples if all motorComponent values are outside [10, 150]ms', () => {
    const trials = [
      createTrial(0, 200, 'Success', 'DEFAULT', 'DEFAULT', 5),
      createTrial(1, 250, 'Success', 'DEFAULT', 'DEFAULT', 200),
    ];
    const result = calculateMotorComponentStats(trials);
    expect(result).toEqual({kind: 'NoValidSamples', totalRecorded: 2, successfulRecorded: 2});
  });

  it('only calculates motorComponent on successful trials', () => {
    const trials = [
      createTrial(0, 200, 'Success', 'DEFAULT', 'DEFAULT', 60),
      createTrial(1, 250, 'Miss', 'DEFAULT', 'NONE', 50),
      createTrial(2, 280, 'FalseAlarm', 'NONE', 'DEFAULT', 40),
      createTrial(3, 300, 'FalseStart', 'NONE', 'DEFAULT', 30),
      createTrial(4, 320, 'MixUp', 'LEFT', 'RIGHT', 70),
    ];
    const result = calculateMotorComponentStats(trials);
    expect(result).toMatchObject({kind: 'Available', meanMs: 60, validCount: 1, totalRecorded: 5});
  });
});

describe('User Profile and Results Screen Rendering', () => {
  let container: HTMLElement;
  const dummyUser: User = {firstName: 'Jane', lastName: 'Doe', gender: 'female', age: 28};

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('shows "Not recorded" in user profile for legacy tests without motorComponent', () => {
    const testSettings: TestSettings = {
      protocolMode: 'optimal',
      testMode: 'shapes',
      stimulusSize: 50,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: 3,
      testType: 'svmr',
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    };

    const legacyTest = {
      id: 1,
      userKey: 'Jane|Doe',
      testSettings,
      trials: [createTrial(0, 250), createTrial(1, 300)],
      date: new Date().toISOString(),
    };

    setupProfileScreen(container, dummyUser, [legacyTest]);

    const notRecordedSpans = container.querySelectorAll('[data-localize="notRecorded"]');
    expect(notRecordedSpans.length).toBeGreaterThan(0);
    const motorLabel = container.querySelector('[data-localize="motorComponentLabel"]');
    expect(motorLabel).not.toBeNull();
  });

  it('shows formatted motor component value in user profile for tests with motorComponent', () => {
    const testSettings: TestSettings = {
      protocolMode: 'optimal',
      testMode: 'shapes',
      stimulusSize: 50,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: 2,
      testType: 'svmr',
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    };

    const testWithMotor = {
      id: 2,
      userKey: 'Jane|Doe',
      testSettings,
      trials: [
        createTrial(0, 250, 'Success', 'DEFAULT', 'DEFAULT', 50),
        createTrial(1, 300, 'Success', 'DEFAULT', 'DEFAULT', 70),
      ],
      date: new Date().toISOString(),
    };

    setupProfileScreen(container, dummyUser, [testWithMotor]);

    expect(container.textContent).toContain('60.00');
  });

  it('shows left and right hand motor component breakdown in user profile for CRT2-3', () => {
    const testSettings: TestSettings = {
      protocolMode: 'optimal',
      testMode: 'shapes',
      stimulusSize: 50,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: 2,
      testType: 'crt2-3',
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    };

    const testCrt = {
      id: 3,
      userKey: 'Jane|Doe',
      testSettings,
      trials: [
        createTrial(0, 250, 'Success', 'LEFT', 'LEFT', 40),
        createTrial(1, 300, 'Success', 'RIGHT', 'RIGHT', 80),
      ],
      date: new Date().toISOString(),
    };

    setupProfileScreen(container, dummyUser, [testCrt]);

    expect(container.textContent).toContain('60.00');
    expect(container.textContent).toContain('40.00');
    expect(container.textContent).toContain('80.00');
  });

  it('renders motor component stat card on Results screen', () => {
    AppContextManager.setContext(defaultAppContext);
    const resultsMap = new Map<number, TrialResult>([
      [0, createTrial(0, 220, 'Success', 'DEFAULT', 'DEFAULT', 55)],
      [1, createTrial(1, 240, 'Success', 'DEFAULT', 'DEFAULT', 65)],
    ]);

    setupResultsScreen(container, resultsMap);

    const motorTitle = container.querySelector('[data-localize="motorComponentLabel"]');
    expect(motorTitle).not.toBeNull();
    expect(container.textContent).toContain('60.00');

    const helpTooltip = container.querySelector('[data-localize-tip="motorComponentHelp"]');
    expect(helpTooltip).not.toBeNull();
    expect(helpTooltip?.getAttribute('data-tip')).toBeTruthy();
    expect(helpTooltip?.textContent).toContain('(?)');
  });

  it('renders localized (?) tooltip for motor component on Profile screen', () => {
    const testSettings: TestSettings = {
      protocolMode: 'optimal',
      testMode: 'shapes',
      stimulusSize: 50,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: 1,
      testType: 'svmr',
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    };

    const testItem = {
      id: 5,
      userKey: 'Jane|Doe',
      testSettings,
      trials: [createTrial(0, 250, 'Success', 'DEFAULT', 'DEFAULT', 50)],
      date: new Date().toISOString(),
    };

    LanguageManager.setCurrentLanguage('uk');
    setupProfileScreen(container, dummyUser, [testItem]);

    const helpTooltip = container.querySelector('[data-localize-tip="motorComponentHelp"]');
    expect(helpTooltip).not.toBeNull();
    expect(helpTooltip?.getAttribute('data-tip')).toContain('Час між натисканням');

    LanguageManager.setCurrentLanguage('en');
    updateLanguageUI(container);
    expect(helpTooltip?.getAttribute('data-tip')).toContain('Time between key press');
  });

  it('renders "no valid data" in user profile when all motor components are filtered out', () => {
    const testSettings: TestSettings = {
      protocolMode: 'optimal',
      testMode: 'shapes',
      stimulusSize: 50,
      exposureTime: 700,
      exposureDelay: [500, 1900],
      stimulusCount: 2,
      testType: 'svmr',
      hand: 'right',
      usePregenerated: {exposureDelay: true, stimuli: true},
    };

    const testFilteredOut = {
      id: 4,
      userKey: 'Jane|Doe',
      testSettings,
      trials: [
        createTrial(0, 250, 'Success', 'DEFAULT', 'DEFAULT', 5), // < 10
        createTrial(1, 300, 'Success', 'DEFAULT', 'DEFAULT', 200), // > 150
      ],
      date: new Date().toISOString(),
    };

    setupProfileScreen(container, dummyUser, [testFilteredOut]);

    const noValidSpans = container.querySelectorAll('[data-localize="noValidMotorData"]');
    expect(noValidSpans.length).toBeGreaterThan(0);
  });
});

describe('TestScreen Motor Component Measurement', () => {
  let appContainer: HTMLElement;
  let scheduler: DeterministicScheduler;
  let screen: TestScreen;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    appContainer = document.getElementById('app')!;
    scheduler = new DeterministicScheduler();
    AppContextManager.setContext({
      ...defaultAppContext,
      testSettings: {
        ...defaultAppContext.testSettings,
        protocolMode: 'optimal',
        testType: 'svmr',
        exposureTime: 500,
        exposureDelay: [250, 250],
        stimulusCount: 2,
        usePregenerated: {exposureDelay: false, stimuli: true},
      },
    });
    screen = new TestScreen(appContainer, scheduler);
    screen.setupScreen();
  });

  afterEach(() => {
    screen.destroy();
    document.body.innerHTML = '';
  });

  it('measures motor component duration between keydown and keyup', () => {
    // Countdown finishes at 4000ms, pause is 250ms -> stimulus #0 shown at 4250ms
    // Advance to 4400ms (RT = 150ms)
    scheduler.advanceBy(4400);
    document.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'}));

    // User releases key 65ms later at 4465ms
    scheduler.advanceBy(65);
    document.dispatchEvent(new KeyboardEvent('keyup', {code: 'Space'}));

    const trials = screen.getTrials();
    expect(trials.length).toBe(1);
    expect(trials[0].outcome).toBe('Success');
    expect(trials[0].reactionTime).toBe(150);
    expect(trials[0].motorComponent).toBe(65);
  });
});

describe('JSON Import with Motor Component', () => {
  it('parses motorComponent when present in imported trials', () => {
    const json = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      users: [
        {
          user: {firstName: 'Alice', lastName: 'Smith', gender: 'female', age: 25},
          tests: [
            {
              date: new Date().toISOString(),
              testSettings: {
                protocolMode: 'optimal',
                testMode: 'shapes',
                stimulusSize: 50,
                exposureTime: 700,
                exposureDelay: [500, 1900],
                stimulusCount: 1,
                testType: 'svmr',
                usePregenerated: {exposureDelay: true, stimuli: true},
              },
              trials: [
                {
                  trialIndex: 0,
                  stimulus: 'circle',
                  reactionTime: 250,
                  outcome: 'Success',
                  expectedAction: 'DEFAULT',
                  actualAction: 'DEFAULT',
                  motorComponent: 55,
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = parseImportedJson(json);
    expect(parsed._tag).toBe('Success');
    if (parsed._tag === 'Success') {
      const trial = parsed.value[0].tests[0].trials[0];
      expect(trial.motorComponent).toBe(55);
    }
  });
});
