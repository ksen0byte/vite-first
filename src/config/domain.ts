import {Options} from "nouislider";
import {Stimulus} from "../domain/types.ts";

export const intFormatter = {
  to: (value: number): string => Math.round(value).toString(),
  from: (value: string): number => parseInt(value, 10),
};

export interface SliderConfig {
  id: string,
  options: Options,
  label: {
    id: string,
    localizationKey: string,
    unit: string,
  }
}

export type TestMode = "shapes" | "words" | "colors" | "combined";
export type TestType = "svmr" | "crt1-3" | "crt2-3";
export type HandAction = 'LEFT' | 'RIGHT' | 'DEFAULT' | 'NONE';
export type Gender = 'male' | 'female';
export type StimulusSize = number;
export type ExposureTime = number;
export type ExposureDelay = readonly [number, number];
export type StimulusCount = number;


export interface PersonalData {
  readonly firstName: string;
  readonly lastName: string;
  readonly gender: Gender;
  readonly age: number;
}

export interface TestSettings {
  readonly testMode: TestMode;
  readonly stimulusSize: StimulusSize;
  readonly exposureTime: ExposureTime;
  readonly exposureDelay: ExposureDelay;
  readonly stimulusCount: StimulusCount;
  readonly testType: TestType;
  readonly usePregenerated: {
    readonly exposureDelay: boolean;
    readonly stimuli: boolean;
  };
}

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
}