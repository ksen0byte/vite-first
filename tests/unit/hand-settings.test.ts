// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {setupSettingsScreen} from '../../src/screens/settings-screen.ts';
import {setupResultsScreen} from '../../src/screens/results-screen.ts';
import {setupProfileScreen} from '../../src/screens/user-profile-screen.ts';
import AppContextManager from '../../src/config/AppContextManager.ts';
import {defaultAppContext} from '../../src/config/settings.ts';
import {db, TestRecord} from '../../src/db/db.ts';
import {getTestsForUser, saveTestRecord, upsertUser} from '../../src/db/operations.ts';
import {TestSettings, TrialResult} from '../../src/config/domain.ts';

describe('Hand choice feature', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    AppContextManager.setContext(defaultAppContext);
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    container.remove();
    db.close();
    await db.delete();
  });

  describe('Settings Screen Hand Selection', () => {
    it('defaults to right hand on initial render', () => {
      setupSettingsScreen(container);
      const handSelect = container.querySelector('#hand-select') as HTMLSelectElement;
      expect(handSelect).not.toBeNull();
      expect(handSelect.value).toBe('right');
      expect(handSelect.disabled).toBe(false);
    });

    it('enables hand select for SVMR and CRT1-3, but disables it for CRT2-3', () => {
      setupSettingsScreen(container);
      const testTypeSelect = container.querySelector('#test-type-select') as HTMLSelectElement;
      const handSelect = container.querySelector('#hand-select') as HTMLSelectElement;
      const handLabel = container.querySelector('#hand-select-label') as HTMLElement;

      // Initial: svmr -> enabled
      expect(handSelect.disabled).toBe(false);
      expect(handSelect.classList.contains('cursor-not-allowed')).toBe(false);

      // Switch to crt1-3 -> enabled
      testTypeSelect.value = 'crt1-3';
      testTypeSelect.dispatchEvent(new Event('change'));
      expect(handSelect.disabled).toBe(false);
      expect(handSelect.classList.contains('cursor-not-allowed')).toBe(false);

      // Switch to crt2-3 -> disabled with visual indicator classes
      testTypeSelect.value = 'crt2-3';
      testTypeSelect.dispatchEvent(new Event('change'));
      expect(handSelect.disabled).toBe(true);
      expect(handSelect.classList.contains('cursor-not-allowed')).toBe(true);
      expect(handSelect.classList.contains('opacity-60')).toBe(true);
      expect(handLabel.classList.contains('opacity-40')).toBe(true);
      expect(handLabel.classList.contains('cursor-not-allowed')).toBe(true);
      expect(handLabel.classList.contains('pointer-events-none')).toBe(false);

      // Switch back to svmr -> enabled again
      testTypeSelect.value = 'svmr';
      testTypeSelect.dispatchEvent(new Event('change'));
      expect(handSelect.disabled).toBe(false);
      expect(handSelect.classList.contains('cursor-not-allowed')).toBe(false);
      expect(handLabel.classList.contains('opacity-40')).toBe(false);
    });

    it('propagates chosen hand (e.g. left) to AppContext on start', () => {
      setupSettingsScreen(container);

      // Fill personal data
      const surname = container.querySelector('#surname-input') as HTMLInputElement;
      const name = container.querySelector('#name-input') as HTMLInputElement;
      const age = container.querySelector('#age-input') as HTMLInputElement;
      const gender = container.querySelector('#gender-select') as HTMLSelectElement;
      const handSelect = container.querySelector('#hand-select') as HTMLSelectElement;
      const startBtn = container.querySelector('#start-test-btn') as HTMLButtonElement;

      surname.value = 'Doe';
      name.value = 'John';
      age.value = '25';
      gender.value = 'male';

      // Select left hand
      handSelect.value = 'left';
      handSelect.dispatchEvent(new Event('change'));

      startBtn.click();

      const updatedContext = AppContextManager.getContext();
      expect(updatedContext.testSettings.hand).toBe('left');
    });

    it('restores default right hand when settings are reset', () => {
      setupSettingsScreen(container);
      const handSelect = container.querySelector('#hand-select') as HTMLSelectElement;
      const resetBtn = container.querySelector('#reset-settings-btn') as HTMLButtonElement;

      handSelect.value = 'left';
      handSelect.dispatchEvent(new Event('change'));

      resetBtn.click();

      const context = AppContextManager.getContext();
      expect(context.testSettings.hand).toBe('right');
    });
  });

  describe('Database Backfill and Migration', () => {
    it('backfills hand: "right" for test records that lack hand property', async () => {
      // Simulate an unmigrated test record
      const testRecordRaw: Record<string, unknown> = {
        userKey: 'Alice|Smith',
        testSettings: {
          protocolMode: 'optimal',
          testMode: 'shapes',
          stimulusSize: 50,
          exposureTime: 700,
          exposureDelay: [500, 1900],
          stimulusCount: 30,
          testType: 'svmr',
          usePregenerated: {exposureDelay: true, stimuli: true},
        },
        trials: [],
        date: new Date().toISOString(),
      };

      const id = await db.tests.add(testRecordRaw as unknown as TestRecord);
      const recordBefore = await db.tests.get(id);
      expect(recordBefore?.testSettings.hand).toBeUndefined();

      // Trigger the version 6 upgrade explicitly on the collection
      await db.table('tests').toCollection().modify((test: Record<string, unknown>) => {
        if (typeof test.testSettings === 'object' && test.testSettings !== null) {
          const ts = test.testSettings as Record<string, unknown>;
          if (ts.hand === undefined) {
            test.testSettings = {...ts, hand: 'right'};
          }
        }
      });

      const recordAfter = await db.tests.get(id);
      expect(recordAfter?.testSettings.hand).toBe('right');
    });

    it('persists and retrieves hand: "left" correctly', async () => {
      const user = {firstName: 'Bob', lastName: 'Builder', gender: 'male' as const, age: 30};
      await upsertUser(user);

      const customSettings: TestSettings = {
        protocolMode: 'optimal',
        testMode: 'colors',
        stimulusSize: 50,
        exposureTime: 700,
        exposureDelay: [500, 1900],
        stimulusCount: 30,
        testType: 'crt1-3',
        hand: 'left',
        usePregenerated: {exposureDelay: true, stimuli: true},
      };

      await saveTestRecord(user, customSettings, []);
      const testsResult = await getTestsForUser(user.firstName, user.lastName);
      expect(testsResult._tag).toBe('Success');
      if (testsResult._tag === 'Success') {
        expect(testsResult.value[0].testSettings.hand).toBe('left');
      }
    });
  });

  describe('Results and Profile Display', () => {
    it('displays the tested hand badge on Results screen for SVMR and CRT1-3', () => {
      AppContextManager.setContext({
        ...defaultAppContext,
        testSettings: {
          ...defaultAppContext.testSettings,
          testType: 'svmr',
          hand: 'left',
        },
      });

      const trialResult: TrialResult = {
        trialIndex: 0,
        stimulus: 'circle',
        reactionTime: 320,
        outcome: 'Success',
        expectedAction: 'DEFAULT',
        actualAction: 'DEFAULT',
      };

      const resultsMap = new Map<number, TrialResult>([[0, trialResult]]);
      setupResultsScreen(container, resultsMap);

      const handBadge = container.querySelector('#results-hand-badge');
      expect(handBadge).not.toBeNull();
      expect(handBadge?.innerHTML).toContain('data-localize="leftHand"');
    });

    it('does not display the tested hand badge on Results screen for CRT2-3', () => {
      AppContextManager.setContext({
        ...defaultAppContext,
        testSettings: {
          ...defaultAppContext.testSettings,
          testType: 'crt2-3',
          hand: 'right',
        },
      });

      const trialResult: TrialResult = {
        trialIndex: 0,
        stimulus: 'circle',
        reactionTime: 320,
        outcome: 'Success',
        expectedAction: 'DEFAULT',
        actualAction: 'DEFAULT',
      };

      const resultsMap = new Map<number, TrialResult>([[0, trialResult]]);
      setupResultsScreen(container, resultsMap);

      const handBadge = container.querySelector('#results-hand-badge');
      expect(handBadge).toBeNull();
    });

    it('displays the tested hand row in the Test Settings table on Profile screen for SVMR and CRT1-3', () => {
      const user = {firstName: 'Carol', lastName: 'Danvers', gender: 'female' as const, age: 29};
      const testSettings: TestSettings = {
        protocolMode: 'optimal',
        testMode: 'shapes',
        stimulusSize: 50,
        exposureTime: 700,
        exposureDelay: [500, 1900],
        stimulusCount: 30,
        testType: 'svmr',
        hand: 'left',
        usePregenerated: {exposureDelay: true, stimuli: true},
      };

      const testRecord = {
        id: 1,
        userKey: 'Carol|Danvers',
        testSettings,
        trials: [],
        date: new Date().toISOString(),
      };

      setupProfileScreen(container, user, [testRecord]);

      const handElement = container.querySelector('[data-localize="leftHand"]');
      expect(handElement).not.toBeNull();
      const handLabelElement = container.querySelector('[data-localize="handLabel"]');
      expect(handLabelElement).not.toBeNull();
    });

    it('does not display the tested hand row in the Test Settings table on Profile screen for CRT2-3', () => {
      const user = {firstName: 'Carol', lastName: 'Danvers', gender: 'female' as const, age: 29};
      const testSettings: TestSettings = {
        protocolMode: 'optimal',
        testMode: 'shapes',
        stimulusSize: 50,
        exposureTime: 700,
        exposureDelay: [500, 1900],
        stimulusCount: 30,
        testType: 'crt2-3',
        hand: 'right',
        usePregenerated: {exposureDelay: true, stimuli: true},
      };

      const testRecord = {
        id: 1,
        userKey: 'Carol|Danvers',
        testSettings,
        trials: [],
        date: new Date().toISOString(),
      };

      setupProfileScreen(container, user, [testRecord]);

      const handLabelElement = container.querySelector('[data-localize="handLabel"]');
      expect(handLabelElement).toBeNull();
    });
  });
});
