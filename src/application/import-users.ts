import {db, TestRecord} from '../db/db.ts';
import {DbError, upsertUser} from '../db/operations.ts';
import {NormalizedImport} from '../util/import-json.ts';
import {Result, failure, success} from '../util/result.ts';

export interface ImportOutcome {
  readonly importedUsers: number;
  readonly existingUsers: number;
  readonly importedTests: number;
  readonly duplicateTests: number;
  readonly rejectedRecords: number;
}

type TestSignatureRecord = Pick<TestRecord, 'userKey' | 'date' | 'testSettings' | 'trials'>;

const testSignature = (record: TestSignatureRecord): string => JSON.stringify({
  userKey: record.userKey,
  date: record.date,
  testSettings: record.testSettings,
  trials: record.trials,
});

export async function importUsers(items: NormalizedImport): Promise<Result<ImportOutcome, DbError>> {
  const outcome = {
    importedUsers: 0,
    existingUsers: 0,
    importedTests: 0,
    duplicateTests: 0,
    rejectedRecords: 0,
  };

  try {
    await db.transaction('rw', db.users, db.tests, async () => {
      for (const item of items) {
        const user = item.user;
        const existed = await db.users.get([user.firstName, user.lastName]);
        const upsertResult = await upsertUser(user);
        if (upsertResult._tag === 'Failure') throw upsertResult.error;
        if (existed === undefined) outcome.importedUsers += 1;
        else outcome.existingUsers += 1;

        const userKey = `${user.firstName}|${user.lastName}`;
        const existing = await db.tests.where('userKey').equals(userKey).toArray();
        const signatures = new Set(existing.map(testSignature));
        const testsToAdd: Omit<TestRecord, 'id'>[] = [];
        for (const test of item.tests) {
          const record: Omit<TestRecord, 'id'> = {
            userKey,
            testSettings: test.testSettings,
            trials: [...test.trials],
            date: test.date,
          };
          const signature = testSignature(record);
          if (signatures.has(signature)) {
            outcome.duplicateTests += 1;
          } else {
            signatures.add(signature);
            testsToAdd.push(record);
          }
        }
        if (testsToAdd.length > 0) {
          await db.tests.bulkAdd(testsToAdd);
          outcome.importedTests += testsToAdd.length;
        }
      }
    });
    return success(outcome);
  } catch (error) {
    return failure({_tag: 'DatabaseWriteError', error});
  }
}
