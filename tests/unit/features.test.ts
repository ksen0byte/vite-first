// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {featureDefaults, resolveFeatureProfile} from '../../src/config/feature-profiles.ts';
import {defaultAppContext, settings} from '../../src/config/settings.ts';
import type {FeedbackMobilitySettings, FeedbackStrengthSettings, TrialResult} from '../../src/config/domain.ts';

const {testFlags} = vi.hoisted(() => ({testFlags: {
  languageSwitching: true, feedbackModes: true, biologicalAge: true,
  advancedAnalysis: true, dataTools: true,
}}));
vi.mock('../../src/config/features.ts', () => ({features: testFlags}));

const mobility: FeedbackMobilitySettings = {
  protocolMode: 'feedback-mobility', testMode: 'words', testType: 'crt2-3',
  hand: 'left', stimulusSize: 30, usePregenerated: {stimuli: false},
  stimulusCount: 120, feedback: settings.default.feedback,
};
const strength: FeedbackStrengthSettings = {
  protocolMode: 'feedback-strength', testMode: 'colors', testType: 'crt2-3',
  hand: 'right', stimulusSize: 40, usePregenerated: {stimuli: true},
  feedback: {...settings.default.feedback, duration: 300},
};
const user = {firstName: 'Ada', lastName: 'Example', age: 25, gender: 'female' as const};
const trial: TrialResult = {
  trialIndex: 0, stimulus: 'cat', outcome: 'Success', reactionTime: 300,
  expectedAction: 'RIGHT', actualAction: 'RIGHT', exposureMs: 900,
};

describe('build feature profiles', () => {
  it('has exactly five flags and enables all of them in full builds', () => {
    expect(Object.keys(resolveFeatureProfile('full'))).toHaveLength(5);
    expect(Object.values(resolveFeatureProfile('full'))).toEqual([true, true, true, true, true]);
  });

  it('disables only feedback and biological age in desktop builds', () => {
    expect(resolveFeatureProfile('desktop')).toEqual({...featureDefaults, feedbackModes: false, biologicalAge: false, languageSwitching: false});
    expect(resolveFeatureProfile('web')).toEqual({...featureDefaults, biologicalAge: false});
  });

  it.each(['missing', 'constructor', '__proto__'])('rejects unknown profile %s', (profile) => {
    expect(() => resolveFeatureProfile(profile)).toThrow('Unknown feature mode');
  });

  it.each(['development', 'production', 'test'])('uses web flags for the default Vite %s mode', (mode) => {
    expect(resolveFeatureProfile(mode)).toEqual(resolveFeatureProfile('web'));
  });
});

describe('feature availability in screens', () => {
  let container: HTMLDivElement;
  let cleanup: (() => void) | undefined;
  let activeDb: typeof import('../../src/db/db.ts').db | undefined;

  beforeEach(() => {
    vi.resetModules();
    Object.assign(testFlags, featureDefaults);
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(async () => {
    cleanup?.();
    cleanup = undefined;
    if (activeDb) await activeDb.delete();
    activeDb = undefined;
    container.remove();
    vi.restoreAllMocks();
  });

  it('forces Ukrainian and hides the selector without erasing saved English', async () => {
    testFlags.languageSwitching = false;
    localStorage.setItem('selectedLanguage', 'en');
    const {LanguageManager} = await import('../../src/localization/LanguageManager.ts');
    const {setupHeader} = await import('../../src/components/header.ts');
    setupHeader(container);
    LanguageManager.setCurrentLanguage('en');
    expect(LanguageManager.getCurrentLanguage()).toBe('uk');
    expect(container.querySelector('#language-toggle')).toBeNull();
    expect(localStorage.getItem('selectedLanguage')).toBe('en');
    expect(document.documentElement.lang).toBe('uk');
  });

  it('retains language selection when enabled', async () => {
    const {LanguageManager} = await import('../../src/localization/LanguageManager.ts');
    const {setupHeader} = await import('../../src/components/header.ts');
    setupHeader(container);
    const toggle = container.querySelector<HTMLInputElement>('#language-toggle')!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(LanguageManager.getCurrentLanguage()).toBe('en');
  });

  it.each([mobility, strength])('offers optimal settings when $protocolMode is disabled and blocks direct test start', async (testSettings) => {
    Object.assign(testFlags, resolveFeatureProfile('desktop'));
    const {default: context} = await import('../../src/config/AppContextManager.ts');
    const {default: router} = await import('../../src/routing/router.ts');
    const navigate = vi.spyOn(router, 'navigate').mockImplementation(() => {});
    context.setContext({...defaultAppContext, personalData: user, testSettings});
    const {TestScreen} = await import('../../src/screens/test-screen.ts');
    const screen = new TestScreen(container);
    screen.setupScreen();
    expect(navigate).toHaveBeenCalledWith('/settings');
    expect(container.querySelector('#test-screen')).toBeNull();
    const {setupSettingsScreen} = await import('../../src/screens/settings-screen.ts');
    setupSettingsScreen(container);
    expect(container.querySelector('#protocol-select option[value="feedback"]')).toBeNull();
    expect(container.querySelector('#protocol-select')!.closest('label')!.hidden).toBe(true);
    expect(container.querySelector('#mode-select')!.closest('label')!.hidden).toBe(true);
    expect(container.querySelector('#compact-exposure-time')).not.toBeNull();
    expect(container.querySelector('#compact-initial-exposure')).toBeNull();
    expect(context.getContext().testSettings).toEqual(testSettings);
    // happy-dom resets some selected options when localization updates their text.
    container.querySelector<HTMLSelectElement>('#gender-select')!.value = user.gender;
    container.querySelector<HTMLSelectElement>('#stimulus-select')!.value = testSettings.testMode;
    container.querySelector<HTMLButtonElement>('#start-test-btn')!.click();
    expect(navigate).toHaveBeenLastCalledWith('/test');
    expect(context.getContext().testSettings.protocolMode).toBe('optimal');
    expect(context.getContext()).toMatchObject({
      personalData: user,
      testSettings: {testMode: testSettings.testMode, hand: testSettings.hand, stimulusSize: testSettings.stimulusSize},
    });
    expect(context.getContext().testSettings).not.toHaveProperty('feedback');
  });

  it('offers both feedback submodes in a full build', async () => {
    const {setupSettingsScreen} = await import('../../src/screens/settings-screen.ts');
    setupSettingsScreen(container);
    const protocol = container.querySelector<HTMLSelectElement>('#protocol-select')!;
    protocol.value = 'feedback';
    protocol.dispatchEvent(new Event('change'));
    expect([...container.querySelector<HTMLSelectElement>('#mode-select')!.options].map(option => option.value))
      .toEqual(['mobility', 'strength']);
  });

  it.each([false, true])('uses biologicalAge=%s for the dashboard card', async (biologicalAge) => {
    testFlags.biologicalAge = biologicalAge;
    const {setupDashboardScreen} = await import('../../src/features/dashboard/dashboard-screen.ts');
    setupDashboardScreen(container, {_tag: 'WebEdition'});
    expect(container.querySelector('#service-bio-age') !== null).toBe(biologicalAge);
    expect(container.querySelector('#service-reaction')).not.toBeNull();
    expect(container.querySelector('#service-profiles')).not.toBeNull();
  });

  it.each([false, true])('uses dataTools=%s for all import/export buttons', async (dataTools) => {
    testFlags.dataTools = dataTools;
    const {db} = await import('../../src/db/db.ts');
    activeDb = db;
    await db.users.put(user);
    const {UsersScreen} = await import('../../src/screens/user-profiles-screen.ts');
    const screen = new UsersScreen(container);
    cleanup = () => screen.destroy();
    await screen.setupScreen();
    expect(container.querySelector('#users-screen')).not.toBeNull();
    expect(container.querySelector('#import-data-btn') !== null).toBe(dataTools);
    expect(container.querySelector('#export-data-btn') !== null).toBe(dataTools);
    expect(container.querySelector('.export-user-btn') !== null).toBe(dataTools);
  });

  it('renders reduced results and historical feedback without optional controls', async () => {
    Object.assign(testFlags, {
      languageSwitching: false, feedbackModes: false, biologicalAge: false,
      advancedAnalysis: false, dataTools: false,
    });
    const {default: context} = await import('../../src/config/AppContextManager.ts');
    context.setContext({...defaultAppContext, personalData: user, testSettings: mobility});
    const {setupResultsScreen} = await import('../../src/screens/results-screen.ts');
    const resultsCleanup = setupResultsScreen(container, new Map([[0, trial]]));
    expect(container.querySelector('#exposureTimeChart')).not.toBeNull();
    expect(container.querySelector('[data-localize="motorComponentLabel"]')).toBeNull();
    expect(container.querySelector('[data-localize="sensoryComponentLabel"]')).toBeNull();
    expect(container.querySelector('#cpi-result-stat')).toBeNull();
    resultsCleanup?.();

    const {setupProfileScreen} = await import('../../src/screens/user-profile-screen.ts');
    cleanup = setupProfileScreen(container, user, [{
      id: 1, userKey: 'Ada|Example', testSettings: mobility, trials: [trial], date: new Date().toISOString(),
    }]);
    expect(container.querySelector('#exposure-1')).not.toBeNull();
    expect(container.querySelector('[data-localize="feedbackProtocol"]')).not.toBeNull();
    expect(container.querySelector('#print-btn')).toBeNull();
    expect(container.querySelector('#cpi-summary-card')).toBeNull();
    expect(container.querySelector('.cpi-card-value')).toBeNull();
    expect(container.querySelector('[data-localize="motorComponentLabel"]')).toBeNull();
    expect(container.querySelector('[data-localize="sensoryComponentLabel"]')).toBeNull();
    expect(context.getContext().testSettings).toEqual(mobility);
  });
});
