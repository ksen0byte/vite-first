// src/db/operations.ts
import {db, User, TestRecord} from './db';
import {TestSettings, TrialResult} from "../config/domain.ts";
import { Result, success, failure } from "../util/result.ts";

export type DbError = 
  | { readonly _tag: 'UserNotFoundError'; readonly firstName: string; readonly lastName: string }
  | { readonly _tag: 'DatabaseWriteError'; readonly error: unknown }
  | { readonly _tag: 'DatabaseReadError'; readonly error: unknown };

export async function upsertUser(user: User): Promise<Result<User, DbError>> {
  try {
    // Check if the user already exists
    const existingUser = await db.users.get([user.firstName, user.lastName]);
    if (existingUser) {
      return success(existingUser);
    }

    // If not, add the user
    await db.users.put({
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      age: user.age
    });

    const newUser = await db.users.get([user.firstName, user.lastName]);
    if (newUser) {
      return success(newUser);
    }
    return failure({ _tag: 'DatabaseReadError', error: 'Failed to retrieve user after insert' });
  } catch (error) {
    return failure({ _tag: 'DatabaseWriteError', error });
  }
}

export async function saveTestRecord(
  user: User,
  testSettings: TestSettings,
  trialResults: TrialResult[]
): Promise<Result<number, DbError>> {
  try {
    const userKey = `${user.firstName}|${user.lastName}`;
    const testRecord: TestRecord = {
      userKey,
      testSettings,
      trials: trialResults,
      date: new Date().toISOString()
    };
    const id = await db.tests.add(testRecord);
    return success(id);
  } catch (error) {
    return failure({ _tag: 'DatabaseWriteError', error });
  }
}

export async function getTestsForUser(firstName: string, lastName: string): Promise<Result<TestRecord[], DbError>> {
  try {
    const userKey = `${firstName}|${lastName}`;
    const tests = await db.tests.where('userKey').equals(userKey).toArray();
    return success(tests);
  } catch (error) {
    return failure({ _tag: 'DatabaseReadError', error });
  }
}

export async function getAllUsers(): Promise<Result<User[], DbError>> {
  try {
    const users = await db.users.toArray();
    return success(users);
  } catch (error) {
    return failure({ _tag: 'DatabaseReadError', error });
  }
}
