import {Gender, TestMode, TestSettings, TestType, TrialResult} from '../config/domain.ts';
import {settings as defaultSettings} from '../config/settings.ts';
import {User} from '../db/db.ts';
import {Result, failure, success} from './result.ts';

export type ImportError =
  | { readonly _tag: 'InvalidType'; readonly path: string; readonly expected: string }
  | { readonly _tag: 'InvalidValue'; readonly path: string; readonly expected: string };

export interface NormalizedImportTest {
  readonly sourceId?: number;
  readonly testSettings: TestSettings;
  readonly trials: readonly TrialResult[];
  readonly date: string;
}

export interface NormalizedImportBundle {
  readonly user: User;
  readonly tests: readonly NormalizedImportTest[];
}

export type NormalizedImport = readonly NormalizedImportBundle[];

export interface ExportEnvelopeV1 {
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly users: readonly unknown[];
}

const testModes: readonly TestMode[] = ['shapes', 'words', 'colors', 'combined'];
const testTypes: readonly TestType[] = ['svmr', 'crt1-3', 'crt2-3'];
const genders: readonly Gender[] = ['male', 'female'];
const outcomes = ['Success', 'Miss', 'FalseAlarm', 'CorrectRejection', 'MixUp', 'FalseStart'] as const;
const actions = ['LEFT', 'RIGHT', 'DEFAULT', 'NONE'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === 'string' && values.includes(value as T);

const invalidType = (path: string, expected: string): Result<never, ImportError> =>
  failure({ _tag: 'InvalidType', path, expected });

const invalidValue = (path: string, expected: string): Result<never, ImportError> =>
  failure({ _tag: 'InvalidValue', path, expected });

export function parseImportedJson(raw: unknown): Result<NormalizedImport, ImportError> {
  const bundlesResult = getImportBundles(raw);
  if (bundlesResult._tag === 'Failure') return bundlesResult;
  const sourceBundles = bundlesResult.value;
  const bundles: NormalizedImportBundle[] = [];

  for (let bundleIndex = 0; bundleIndex < sourceBundles.length; bundleIndex++) {
    const bundlePath = `$[${bundleIndex}]`;
    const bundle = sourceBundles[bundleIndex];
    if (!isRecord(bundle)) return invalidType(bundlePath, 'object');
    if (!isRecord(bundle.user)) return invalidType(`${bundlePath}.user`, 'object');
    const user = bundle.user;
    if (typeof user.firstName !== 'string') return invalidType(`${bundlePath}.user.firstName`, 'string');
    if (typeof user.lastName !== 'string') return invalidType(`${bundlePath}.user.lastName`, 'string');
    if (!isOneOf(user.gender, genders)) return invalidValue(`${bundlePath}.user.gender`, 'male or female');
    if (typeof user.age !== 'number' || !Number.isFinite(user.age)) return invalidValue(`${bundlePath}.user.age`, 'finite number');
    if (!Array.isArray(bundle.tests)) return invalidType(`${bundlePath}.tests`, 'array');

    const tests: NormalizedImportTest[] = [];
    for (let testIndex = 0; testIndex < bundle.tests.length; testIndex++) {
      const testPath = `${bundlePath}.tests[${testIndex}]`;
      const test = bundle.tests[testIndex];
      if (!isRecord(test) || !isRecord(test.testSettings)) return invalidType(testPath, 'test record');
      const settings = test.testSettings;
      if (!isOneOf(settings.testMode, testModes)) return invalidValue(`${testPath}.testSettings.testMode`, 'test mode');
      if (!isOneOf(settings.testType, testTypes)) return invalidValue(`${testPath}.testSettings.testType`, 'test type');
      if (!Array.isArray(settings.exposureDelay) || settings.exposureDelay.length !== 2 || !settings.exposureDelay.every((value) => typeof value === 'number' && Number.isFinite(value)) || settings.exposureDelay[0] > settings.exposureDelay[1]) return invalidValue(`${testPath}.testSettings.exposureDelay`, 'ordered finite pair');
      if (!isRecord(settings.usePregenerated) || typeof settings.usePregenerated.exposureDelay !== 'boolean' || typeof settings.usePregenerated.stimuli !== 'boolean') return invalidValue(`${testPath}.testSettings.usePregenerated`, 'boolean flags');
      if (![settings.stimulusSize, settings.exposureTime, settings.stimulusCount].every((value) => typeof value === 'number' && Number.isFinite(value)) || !Number.isInteger(settings.stimulusCount)) return invalidValue(`${testPath}.testSettings`, 'finite numeric settings and integer stimulus count');
      if (typeof test.date !== 'string' || Number.isNaN(Date.parse(test.date))) return invalidValue(`${testPath}.date`, 'ISO date');
      const trials: TrialResult[] = [];
      if (Array.isArray(test.trials)) {
        for (let trialIndex = 0; trialIndex < test.trials.length; trialIndex++) {
        const trialPath = `${testPath}.trials[${trialIndex}]`;
        const trial = test.trials[trialIndex];
        if (!isRecord(trial) || typeof trial.trialIndex !== 'number' || !Number.isInteger(trial.trialIndex) || typeof trial.stimulus !== 'string' || typeof trial.reactionTime !== 'number' || !Number.isFinite(trial.reactionTime)) return invalidType(trialPath, 'trial record');
        if (!isOneOf(trial.outcome, outcomes)) return invalidValue(`${trialPath}.outcome`, 'trial outcome');
        const expectedAction = trial.expectedAction ?? 'DEFAULT';
        const actualAction = trial.actualAction ?? 'DEFAULT';
        if (!isOneOf(expectedAction, actions) || !isOneOf(actualAction, actions)) return invalidValue(`${trialPath}.action`, 'trial action');
        trials.push({ trialIndex: trial.trialIndex, stimulus: trial.stimulus, reactionTime: trial.reactionTime, outcome: trial.outcome, expectedAction, actualAction });
        }
      } else if (Array.isArray(test.reactionTimes) && test.reactionTimes.every((value) => typeof value === 'number' && Number.isFinite(value))) {
        for (let trialIndex = 0; trialIndex < test.reactionTimes.length; trialIndex++) {
          trials.push({ trialIndex, stimulus: 'circle', reactionTime: test.reactionTimes[trialIndex] as number, outcome: 'Success', expectedAction: 'DEFAULT', actualAction: 'DEFAULT' });
        }
      } else {
        return invalidType(`${testPath}.trials`, 'array');
      }
      tests.push({
        ...(typeof test.id === 'number' && Number.isInteger(test.id) ? {sourceId: test.id} : {}),
        testSettings: {
          protocolMode: 'optimal',
          feedbackSubmode: 'mobility',
          testMode: settings.testMode,
          stimulusSize: settings.stimulusSize as number,
          exposureTime: settings.exposureTime as number,
          exposureDelay: [settings.exposureDelay[0] as number, settings.exposureDelay[1] as number],
          stimulusCount: settings.stimulusCount as number,
          testType: settings.testType,
          feedback: {
            initialExposure: defaultSettings.default.feedback.initialExposure,
            adjustmentStep: defaultSettings.default.feedback.adjustmentStep,
            minExposure: defaultSettings.default.feedback.minExposure,
            maxExposure: defaultSettings.default.feedback.maxExposure,
            pause: defaultSettings.default.feedback.pause,
            duration: defaultSettings.default.feedback.duration,
          },
          usePregenerated: settings.usePregenerated as TestSettings['usePregenerated'],
        },
        trials,
        date: test.date,
      });
    }
    bundles.push({ user: { firstName: user.firstName, lastName: user.lastName, gender: user.gender, age: user.age }, tests });
  }
  return success(bundles);
}

function getImportBundles(raw: unknown): Result<readonly unknown[], ImportError> {
  if (Array.isArray(raw)) return success(raw);
  if (!isRecord(raw)) return invalidType('$', 'array, bundle, or versioned envelope');
  if (!('schemaVersion' in raw)) return success([raw]);
  if (raw.schemaVersion !== 1) return invalidValue('$.schemaVersion', 'supported schema version 1');
  if (typeof raw.exportedAt !== 'string' || Number.isNaN(Date.parse(raw.exportedAt))) return invalidValue('$.exportedAt', 'ISO date');
  if (!Array.isArray(raw.users)) return invalidType('$.users', 'array');
  return success(raw.users);
}
