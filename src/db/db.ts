// src/db/db.ts
import Dexie, {Table} from 'dexie';
import {TestSettings} from "../config/domain.ts";

// User profile interface
export interface User {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | null;
  age: number | null;
}

// Each test record for a user
export interface TestRecord {
  id?: number;
  userKey: string; // e.g. "John|Doe"
  testSettings: TestSettings;
  reactionTimes: number[];
  date: string; // ISO string for test date
}

export class CnsTestDatabase extends Dexie {
  // Define the users table with a compound primary key.
  // Dexie compound keys are defined with a bracketed expression.
  users!: Table<User, [string, string]>;
  tests!: Table<TestRecord, number>;

  constructor() {
    super('CnsTestDatabase');
    this.version(1).stores({
      // The primary key is the compound [firstName+lastName].
      users: '[firstName+lastName], gender, age',
      // Tests table uses an auto-incremented id and an indexed userKey.
      tests: '++id, userKey, date'
    });
  }
}

export const db = new CnsTestDatabase();
