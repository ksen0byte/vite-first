// src/util/import-json.ts

import {TrialResult} from "../config/domain.ts";

// --- Domain types (runtime-validated) ---

export type Gender = "male" | "female" | "other" | "unknown";

export interface ImportedUser {
  firstName: string;
  lastName: string;
  gender: Gender | string; // allow unknown strings from data
  age: number;
}

export interface ImportedTestSettings {
  testMode: string;
  stimulusSize: number;
  exposureTime: number;
  exposureDelay: [number, number] | number[]; // allow arrays, validate later
  stimulusCount: number;
  testType: string;
}

export interface ImportedTest {
  userKey: string;
  testSettings: ImportedTestSettings;
  reactionTimes: number[];
  trials?: TrialResult[];
  date: string; // ISO
  id: number;
}

export interface ImportedUserBlock {
  user: ImportedUser;
  tests: ImportedTest[];
}

export type ImportedJson = ImportedUserBlock[];

// --- Errors ---

export class ImportValidationError extends Error {
  constructor(message: string, public readonly path?: string) {
    super(path ? `${message} (at ${path})` : message);
    this.name = "ImportValidationError";
  }
}

// --- Small guard helpers ---

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, path: string): string {
  if (typeof v !== "string") throw new ImportValidationError("Expected string", path);
  return v;
}

function asNumber(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new ImportValidationError("Expected finite number", path);
  }
  return v;
}

function asArray(v: unknown, path: string): unknown[] {
  if (!Array.isArray(v)) throw new ImportValidationError("Expected array", path);
  return v;
}

function asNumberArray(v: unknown, path: string): number[] {
  const arr = asArray(v, path);
  const out: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const n = arr[i];
    if (typeof n !== "number" || !Number.isFinite(n)) {
      throw new ImportValidationError("Expected array of finite numbers", `${path}[${i}]`);
    }
    out.push(n);
  }
  return out;
}

function asExposureDelay(v: unknown, path: string): [number, number] {
  const arr = asNumberArray(v, path);
  if (arr.length !== 2) throw new ImportValidationError("exposureDelay must have length 2", path);
  return [arr[0], arr[1]];
}

// --- Main parser ---

/**
 * Parse + validate the JSON content produced by readJsonFile<unknown>().
 * Throws ImportValidationError with a path for easier debugging.
 */
export function parseImportedJson(raw: unknown): ImportedJson {
  const root = asArray(raw, "$");
  const blocks: ImportedUserBlock[] = [];

  for (let i = 0; i < root.length; i++) {
    const node = root[i];
    const basePath = `$[${i}]`;
    if (!isRecord(node)) throw new ImportValidationError("Expected object", basePath);

    // user
    const userRaw = node["user"];
    if (!isRecord(userRaw)) throw new ImportValidationError("Expected object", `${basePath}.user`);

    const user: ImportedUser = {
      firstName: asString(userRaw["firstName"], `${basePath}.user.firstName`),
      lastName: asString(userRaw["lastName"], `${basePath}.user.lastName`),
      gender: asString(userRaw["gender"], `${basePath}.user.gender`),
      age: asNumber(userRaw["age"], `${basePath}.user.age`),
    };

    // tests
    const testsRaw = asArray(node["tests"], `${basePath}.tests`);
    const tests: ImportedTest[] = [];

    for (let j = 0; j < testsRaw.length; j++) {
      const t = testsRaw[j];
      const tPath = `${basePath}.tests[${j}]`;
      if (!isRecord(t)) throw new ImportValidationError("Expected object", tPath);

      const settingsRaw = t["testSettings"];
      if (!isRecord(settingsRaw)) throw new ImportValidationError("Expected object", `${tPath}.testSettings`);

      const testSettings: ImportedTestSettings = {
        testMode: asString(settingsRaw["testMode"], `${tPath}.testSettings.testMode`),
        stimulusSize: asNumber(settingsRaw["stimulusSize"], `${tPath}.testSettings.stimulusSize`),
        exposureTime: asNumber(settingsRaw["exposureTime"], `${tPath}.testSettings.exposureTime`),
        exposureDelay: asExposureDelay(settingsRaw["exposureDelay"], `${tPath}.testSettings.exposureDelay`),
        stimulusCount: asNumber(settingsRaw["stimulusCount"], `${tPath}.testSettings.stimulusCount`),
        testType: asString(settingsRaw["testType"], `${tPath}.testSettings.testType`),
      };

      const reactionTimes = t["reactionTimes"] ? asNumberArray(t["reactionTimes"], `${tPath}.reactionTimes`) : [];
      const trials = t["trials"] ? asArray(t["trials"], `${tPath}.trials`) as TrialResult[] : undefined;

      const test: ImportedTest = {
        userKey: asString(t["userKey"], `${tPath}.userKey`),
        testSettings,
        reactionTimes,
        trials,
        date: asString(t["date"], `${tPath}.date`),
        id: asNumber(t["id"], `${tPath}.id`),
      };

      tests.push(test);
    }

    blocks.push({ user, tests });
  }

  return blocks;
}