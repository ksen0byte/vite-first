// src/db/db.ts
import Dexie, {Table} from 'dexie';
import {TestSettings, TrialResult} from "../config/domain.ts";

// User profile interface
export interface User {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  age: number;
}

// Each test record for a user
export interface TestRecord {
  id?: number;
  userKey: string; // e.g. "John|Doe"
  testSettings: TestSettings;
  trials: TrialResult[];
  date: string; // ISO string for test date
}

export class CnsTestDatabase extends Dexie {
  users!: Table<User, [string, string]>;
  tests!: Table<TestRecord, number>;

  constructor() {
    super('CnsTestDatabase');

    // Version 1: The original state
    this.version(1).stores({
      // The primary key is the compound [firstName+lastName].
      users: '[firstName+lastName], gender, age',
      // Tests table uses an auto-incremented id and an indexed userKey.
      tests: '++id, userKey, date'
    });

    // Version 2: The migrated state
    this.version(2).stores({
      users: '[firstName+lastName], gender, age', // Re-declare to preserve
      tests: '++id, userKey, date'
    }).upgrade(async tx => {
      console.log("Migration to version 2 started...");
      // Use 'any' here because the record actually contains 'reactionTimes'
      // which is no longer in your TestRecord interface.
      await tx.table("tests").toCollection().modify((test: any) => {
        if (Array.isArray(test.reactionTimes)) {
          test.trials = test.reactionTimes.map((rt: number, index: number) => ({
            trialIndex: index,
            stimulus: 'circle',
            reactionTime: rt,
            outcome: "Success",
            expectedAction: 'DEFAULT',
            actualAction: 'DEFAULT'
          }));
          delete test.reactionTimes;
        }
      });
    });

    // Version 3: The migrated state to include expectedAction and actualAction
    this.version(3).stores({
      users: '[firstName+lastName], gender, age', // Re-declare to preserve
      tests: '++id, userKey, date'
    }).upgrade(async tx => {
      console.log("Migration to version 3 started...");
      await tx.table("tests").toCollection().modify((test: any) => {
        if (Array.isArray(test.trials)) {
          test.trials = test.trials.map((trial: any) => ({
            ...trial,
            expectedAction: trial.expectedAction || 'DEFAULT',
            actualAction: trial.actualAction || 'DEFAULT'
          }));
        }
      });
    });
  }
}
export const db = new CnsTestDatabase();
