import {describe, expect, it} from 'vitest';
import currentExport from '../fixtures/import/current-export.json';
import invalidAction from '../fixtures/import/malformed/invalid-action.json';
import invalidDate from '../fixtures/import/malformed/invalid-date.json';
import invalidGender from '../fixtures/import/malformed/invalid-gender.json';
import invalidOutcome from '../fixtures/import/malformed/invalid-outcome.json';
import invalidTestType from '../fixtures/import/malformed/invalid-test-type.json';
import malformedDelayTuple from '../fixtures/import/malformed/malformed-delay-tuple.json';
import missingUser from '../fixtures/import/malformed/missing-user.json';
import nonFiniteAge from '../fixtures/import/malformed/non-finite-age.json';
import {parseImportedJson} from '../../src/util/import-json.ts';

describe('parseImportedJson', () => {
  it('accepts the current exporter fixture and ignores untrusted record identity', () => {
    const result = parseImportedJson(currentExport);

    expect(result._tag).toBe('Success');
    if (result._tag === 'Success') {
      expect(result.value[0].tests[0]).toMatchObject({
        sourceId: 101,
        date: '2026-01-15T10:00:00.000Z',
      });
      expect(result.value[0].tests[0].trials[0]).toMatchObject({
        expectedAction: 'DEFAULT',
        actualAction: 'DEFAULT',
      });
    }
  });

  it('accepts the versioned v1 export envelope while retaining the current array format', () => {
    const result = parseImportedJson({
      schemaVersion: 1,
      exportedAt: '2026-08-01T12:00:00.000Z',
      users: currentExport,
    });

    expect(result).toMatchObject({_tag: 'Success', value: [{user: {firstName: 'Ada'}}]});
  });

  it('accepts the legacy single-bundle export shape', () => {
    const result = parseImportedJson(currentExport[0]);

    expect(result).toMatchObject({_tag: 'Success', value: [{user: {firstName: 'Ada'}}]});
  });

  it.each([
    ['invalid action', invalidAction],
    ['invalid date', invalidDate],
    ['invalid gender', invalidGender],
    ['invalid outcome', invalidOutcome],
    ['invalid test type', invalidTestType],
    ['malformed delay tuple', malformedDelayTuple],
    ['missing user', missingUser],
    ['non-finite age', nonFiniteAge],
  ])('rejects the %s fixture', (_label, fixture) => {
    expect(parseImportedJson(fixture)._tag).toBe('Failure');
  });

  it('normalizes the legacy reaction-times format with default actions', () => {
    const legacy = structuredClone(currentExport);
    const test = legacy[0].tests[0] as Record<string, unknown>;
    delete test.trials;
    test.reactionTimes = [250, 300];

    const result = parseImportedJson(legacy);

    expect(result._tag).toBe('Success');
    if (result._tag === 'Success') {
      expect(result.value[0].tests[0].trials).toMatchObject([
        {trialIndex: 0, expectedAction: 'DEFAULT', actualAction: 'DEFAULT'},
        {trialIndex: 1, expectedAction: 'DEFAULT', actualAction: 'DEFAULT'},
      ]);
    }
  });
});
