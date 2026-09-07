import {Stimulus} from "../domain/types.ts";

export type TestMode = "shapes" | "words" | "colors" | "combined";
export type TestType = "svmr" | "crt1-3" | "crt2-3";
export type HandAction = 'LEFT' | 'RIGHT' | 'DEFAULT' | 'NONE';
export type Gender = 'male' | 'female';
export type StimulusSize = number;
export type ExposureTime = number;
export type ExposureDelay = readonly [number, number];
export type StimulusCount = number;

/**
 * The tuning block shared by both feedback submodes.
 * `duration` is intentionally excluded here — it belongs only to the strength
 * submode (see FeedbackStrengthSettings), so an illegal "mobility with duration"
 * state is unrepresentable.
 */
export interface FeedbackTuning {
  readonly initialExposure: number;
  readonly adjustmentStep: number;
  readonly minExposure: number;
  readonly maxExposure: number;
  readonly pause: number;
}

export interface PersonalData {
  readonly firstName: string;
  readonly lastName: string;
  readonly gender: Gender;
  readonly age: number;
}

/** Fields common to every protocol arm. */
interface BaseSettings {
  readonly testMode: TestMode;
  readonly stimulusSize: StimulusSize;
  readonly testType: TestType;
  readonly usePregenerated: {
    /** Stimulus-sequence pregeneration (meaningful for all protocols). */
    readonly stimuli: boolean;
  };
}

/** Optimal (fixed-exposure) protocol. Carries its own exposure + count + delay range. */
export interface OptimalSettings extends BaseSettings {
  readonly protocolMode: 'optimal';
  /** Pregenerated inter-stimulus delay flag only makes sense when a delay range exists. */
  readonly usePregenerated: {
    readonly exposureDelay: boolean;
    readonly stimuli: boolean;
  };
  readonly exposureTime: ExposureTime;
  readonly exposureDelay: ExposureDelay;
  readonly stimulusCount: StimulusCount;
}

/** Feedback protocol, functional-mobility submode: a fixed number of stimuli. */
export interface FeedbackMobilitySettings extends BaseSettings {
  readonly protocolMode: 'feedback-mobility';
  readonly stimulusCount: StimulusCount;
  readonly feedback: FeedbackTuning;
}

/** Feedback protocol, nervous-process-strength submode: a fixed time budget. */
export interface FeedbackStrengthSettings extends BaseSettings {
  readonly protocolMode: 'feedback-strength';
  readonly feedback: FeedbackTuning & { readonly duration: number };
}

/**
 * The test configuration as a discriminated union on `protocolMode`.
 * Illegal states are unrepresentable: an optimal record cannot carry feedback
 * tuning, a mobility record cannot carry a duration, and a strength record
 * cannot carry a stimulus count.
 */
export type TestSettings =
  | OptimalSettings
  | FeedbackMobilitySettings
  | FeedbackStrengthSettings;

export type DebugMode = "debug" | "prod";

export interface AppContext {
  readonly personalData: PersonalData,
  readonly testSettings: TestSettings,
  readonly debugMode: DebugMode,
}

export type TrialOutcome =
  "Success" |           // Reacted to Target
  "Miss" |              // Failed to react to Target
  "FalseAlarm" |        // Reacted to Distractor
  "CorrectRejection" |  // Ignored Distractor correctly
  "MixUp" |             // Mixed up LEFT and RIGHT targets
  "FalseStart";         // Reacted during Pause

export interface TrialResult {
  readonly trialIndex: number;
  readonly stimulus: Stimulus;
  readonly reactionTime: number;
  readonly outcome: TrialOutcome;
  readonly expectedAction: HandAction;
  readonly actualAction: HandAction;
  /**
   * Exposure duration (ms) in force when this trial's stimulus was shown.
   * Feedback-protocol sessions always record it; older persisted records may
   * omit it (backfilled from the saved settings during the DB v4 migration).
   */
  readonly exposureMs?: number;
}

// ---------------------------------------------------------------------------
// Type guards / accessors — the only sanctioned way to reach feedback-only data.
// ---------------------------------------------------------------------------

export const isFeedback = (s: TestSettings): s is FeedbackMobilitySettings | FeedbackStrengthSettings =>
  s.protocolMode === 'feedback-mobility' || s.protocolMode === 'feedback-strength';

export const isFeedbackMobility = (s: TestSettings): s is FeedbackMobilitySettings =>
  s.protocolMode === 'feedback-mobility';

export const isFeedbackStrength = (s: TestSettings): s is FeedbackStrengthSettings =>
  s.protocolMode === 'feedback-strength';

/**
 * Returns the feedback tuning block, or throws for a non-feedback configuration.
 * Callers must have already narrowed via `isFeedback` in most cases; this is the
 * escape hatch for legacy/serialized data where the discriminator is trusted.
 */
export function feedbackTuning(s: TestSettings): FeedbackTuning {
  if (!isFeedback(s)) {
    throw new Error(`feedbackTuning called on non-feedback settings (${s.protocolMode})`);
  }
  return s.feedback;
}
