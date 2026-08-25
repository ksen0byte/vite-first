// src/db/db.ts
import Dexie, {Table} from 'dexie';
import {TestSettings, TrialResult} from "../config/domain.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
      await tx.table("tests").toCollection().modify((test: Record<string, unknown>) => {
        if (Array.isArray(test.reactionTimes) && test.reactionTimes.every((value) => typeof value === 'number')) {
          test.trials = test.reactionTimes.map((reactionTime, index) => ({
            trialIndex: index,
            stimulus: 'circle',
            reactionTime,
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
      await tx.table("tests").toCollection().modify((test: Record<string, unknown>) => {
        if (Array.isArray(test.trials)) {
          test.trials = test.trials.map((trial) => {
            if (!isRecord(trial)) return trial;
            return {
              ...trial,
              expectedAction: trial.expectedAction || 'DEFAULT',
              actualAction: trial.actualAction || 'DEFAULT',
            };
          });
        }
      });
    });

    // Version 4: Backfill per-trial exposureMs. Trials recorded before the
    // feedback protocol existed never stored the exposure in force; it is
    // derived from the settings that were saved with each test:
    //   optimal sessions -> the fixed exposureTime,
    //   feedback sessions -> initialExposure for trial N minus adjustmentStep
    //   per prior closed window (clamped), which reproduces the adaptive
    //   schedule for records whose outcomes are known.
    this.version(4).stores({
      users: '[firstName+lastName], gender, age',
      tests: '++id, userKey, date'
    }).upgrade(async tx => {
      console.log("Migration to version 4 started...");
      await tx.table("tests").toCollection().modify((test: Record<string, unknown>) => {
        if (!Array.isArray(test.trials) || !isRecord(test.testSettings)) return;
        const testSettings = test.testSettings as Record<string, unknown>;
        const isFeedback = testSettings.protocolMode === "feedback";
        const fixedExposure = typeof testSettings.exposureTime === "number" ? testSettings.exposureTime : undefined;
        if (!isFeedback && fixedExposure !== undefined) {
          test.trials = (test.trials as unknown[]).map((trial) =>
            isRecord(trial) && trial.exposureMs === undefined ? {...trial, exposureMs: fixedExposure} : trial);
          return;
        }
        const feedback = isRecord(testSettings.feedback) ? testSettings.feedback : undefined;
        if (!feedback
          || typeof feedback.initialExposure !== "number"
          || typeof feedback.adjustmentStep !== "number"
          || typeof feedback.minExposure !== "number"
          || typeof feedback.maxExposure !== "number") return;
        let exposure = feedback.initialExposure;
        test.trials = (test.trials as unknown[]).map((trial) => {
          if (!isRecord(trial)) return trial;
          const stamped = trial.exposureMs === undefined ? {...trial, exposureMs: exposure} : trial;
          // Replay the adaptation rule over saved outcomes.
          const outcome = trial.outcome;
          const correct = outcome === "Success" || outcome === "CorrectRejection";
          exposure = Math.max(feedback.minExposure as number, Math.min(feedback.maxExposure as number,
            exposure + (correct ? -(feedback.adjustmentStep as number) : (feedback.adjustmentStep as number))));
          return stamped;
        });
      });
    });
  }
}
export const db = new CnsTestDatabase();
