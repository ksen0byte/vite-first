// src/db/operations.ts
import {db, User, TestRecord} from './db';
import {TestSettings} from "../config/domain.ts";


/**
 * Helper to compute a user key from first and last name.
 */
function getUserKey(firstName: string, lastName: string): string {
  return `${firstName}|${lastName}`;
}

export async function upsertUser(user: User) {
  // Check if the user already exists
  const existingUser = await db.users.get([user.firstName, user.lastName]);
  if (existingUser) {
    return existingUser;
  }

  // If not, add the user
  await db.users.put({
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender ?? null,
    age: user.age ?? null
  });

  return db.users.get([user.firstName, user.lastName]);
}


/**
 * Save a test record for a given user.
 */
export async function saveTestRecord(
  user: User,
  testSettings: TestSettings,
  reactionTimes: number[]
): Promise<number> {
  const userKey = getUserKey(user.firstName, user.lastName);
  const testRecord: TestRecord = {
    userKey,
    testSettings,
    reactionTimes,
    date: new Date().toISOString()
  };
  return db.tests.add(testRecord);
}

/**
 * Retrieve all tests for a user identified by first and last name.
 */
export async function getTestsForUser(firstName: string, lastName: string): Promise<TestRecord[]> {
  const userKey = getUserKey(firstName, lastName);
  return db.tests.where('userKey').equals(userKey).toArray();
}

/**
 * Retrieve all users.
 */
export async function getAllUsers(): Promise<User[]> {
  return db.users.toArray();
}
