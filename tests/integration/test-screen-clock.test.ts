// @vitest-environment happy-dom

import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {AppContext} from '../../src/config/domain.ts';
import AppContextManager from '../../src/config/AppContextManager.ts';
import Router from '../../src/routing/router.ts';
import {TestScreen} from '../../src/screens/test-screen.ts';
import {DeterministicScheduler} from '../support/deterministic-scheduler.ts';

const createContext = (exposureDelay: readonly [number, number] = [0, 0]): AppContext => ({
  personalData: {firstName: 'Ada', lastName: 'Example', age: 34, gender: 'female'},
  testSettings: {
    testMode: 'shapes',
    stimulusSize: 50,
    exposureTime: 500,
    exposureDelay,
    stimulusCount: 1,
    testType: 'svmr',
    usePregenerated: {exposureDelay: false, stimuli: true},
  },
  debugMode: 'debug',
});

const press = (code: string): void => document.dispatchEvent(new KeyboardEvent('keydown', {code}));

const startShowingFirstStimulus = (scheduler: DeterministicScheduler): void => scheduler.advanceBy(4_000);

describe('TestScreen with a deterministic scheduler', () => {
  let scheduler: DeterministicScheduler;
  let screen: TestScreen;
  let appContainer: HTMLDivElement;

  beforeEach(() => {
    document.open();
    document.write('<!doctype html><html><body><div id="app"></div></body></html>');
    document.close();
    appContainer = document.getElementById('app') as HTMLDivElement;
    Router.initialize(appContainer);
    Router.registerRoute('/results', () => {});
    Router.registerRoute('/spam-warning', () => {});
    AppContextManager.setContext(createContext());
    scheduler = new DeterministicScheduler();
    screen = new TestScreen(appContainer, scheduler);
    screen.setupScreen();
  });

  afterEach(() => screen.destroy());

  it('ignores an input before the 100 ms threshold and records the timeout outcome', () => {
    startShowingFirstStimulus(scheduler);
    press('Space');
    scheduler.advanceBy(500);

    expect(appContainer.querySelector('#end-finish-btn')).not.toBeNull();
    const reactionTimes = (screen as unknown as {reactionTimes: Map<number, {outcome: string}>}).reactionTimes;
    expect(reactionTimes.get(0)?.outcome).toBe('Miss');
  });

  it('records a successful response after the threshold with its deterministic reaction time', () => {
    startShowingFirstStimulus(scheduler);
    scheduler.advanceBy(100);
    press('Space');
    scheduler.advanceBy(400);

    const reactionTimes = (screen as unknown as {reactionTimes: Map<number, {outcome: string; reactionTime: number}>}).reactionTimes;
    expect(reactionTimes.get(0)).toMatchObject({outcome: 'Success', reactionTime: 100});
  });

  it('records a false start while delayed and still shows the scheduled stimulus', () => {
    screen.destroy();
    AppContextManager.setContext(createContext([50, 50]));
    screen = new TestScreen(appContainer, scheduler);
    screen.setupScreen();

    scheduler.advanceBy(4_000);
    press('Space');
    scheduler.advanceBy(50);

    const reactionTimes = (screen as unknown as {reactionTimes: Map<number, {outcome: string}>}).reactionTimes;
    expect(reactionTimes.get(0)?.outcome).toBe('FalseStart');
    expect(appContainer.querySelector('#stimuli-counter')?.textContent).toBe('1/1');
  });

  it('routes accepted input spam to the warning screen and cancels future session work', async () => {
    startShowingFirstStimulus(scheduler);
    scheduler.advanceBy(100);
    press('Space');
    press('Space');
    press('Space');
    press('Space');
    await Promise.resolve();

    expect(history.state.path).toContain('/spam-warning');
    scheduler.advanceBy(10_000);
    expect(appContainer.querySelector('#test-screen')).toBeNull();
  });

  it('cancels pending countdown work when destroyed', () => {
    screen.destroy();
    scheduler.advanceBy(10_000);

    expect(appContainer.querySelector('#stimuli-counter')?.textContent?.trim()).toBe('0/1');
  });
});
