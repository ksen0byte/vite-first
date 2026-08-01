import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {db} from '../../src/db/db.ts';
import {getTestsForUser, saveTestRecord, upsertUser} from '../../src/db/operations.ts';
import {TestSettings, TrialResult} from '../../src/config/domain.ts';

const settings: TestSettings = {
  testMode: 'shapes',
  stimulusSize: 25,
  exposureTime: 700,
  exposureDelay: [500, 1900],
  stimulusCount: 3,
  testType: 'svmr',
  usePregenerated: {exposureDelay: true, stimuli: true},
};

const trial: TrialResult = {
  trialIndex: 0,
  stimulus: 'circle',
  reactionTime: 250,
  outcome: 'Success',
  expectedAction: 'DEFAULT',
  actualAction: 'DEFAULT',
};

describe('upsertUser', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('updates demographics for an existing name while retaining associated tests', async () => {
    await upsertUser({firstName: 'Ada', lastName: 'Example', gender: 'female', age: 34});
    await saveTestRecord(
      {firstName: 'Ada', lastName: 'Example', gender: 'female', age: 34},
      settings,
      [trial],
    );

    const result = await upsertUser({firstName: 'Ada', lastName: 'Example', gender: 'male', age: 35});
    const testsResult = await getTestsForUser('Ada', 'Example');

    expect(result).toEqual({
      _tag: 'Success',
      value: {firstName: 'Ada', lastName: 'Example', gender: 'male', age: 35},
    });
    expect(testsResult).toMatchObject({
      _tag: 'Success',
      value: [{userKey: 'Ada|Example', trials: [trial]}],
    });
  });
});
