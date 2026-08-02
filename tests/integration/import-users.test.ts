import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import currentExport from '../fixtures/import/current-export.json';
import {importUsers} from '../../src/application/import-users.ts';
import {db} from '../../src/db/db.ts';
import {parseImportedJson} from '../../src/util/import-json.ts';

describe('importUsers', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('imports a validated export once and reports its duplicates on repeat', async () => {
    const parsed = parseImportedJson(currentExport);
    if (parsed._tag === 'Failure') throw new Error('Current export fixture must be valid');

    const first = await importUsers(parsed.value);
    const second = await importUsers(parsed.value);

    expect(first).toEqual({
      _tag: 'Success',
      value: {importedUsers: 1, existingUsers: 0, importedTests: 3, duplicateTests: 0, rejectedRecords: 0},
    });
    expect(second).toEqual({
      _tag: 'Success',
      value: {importedUsers: 0, existingUsers: 1, importedTests: 0, duplicateTests: 3, rejectedRecords: 0},
    });
    expect(await db.users.count()).toBe(1);
    expect(await db.tests.count()).toBe(3);
  });
});
