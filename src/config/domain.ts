import {Options} from "nouislider";

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

export type TestMode = "shapes" | "words" | "syllables";
export type TestType = "svmr" | "sr1-3" | "sr2-3";
export type Gender = 'male' | 'female' | null;
export type StimulusSize = number;
export type ExposureTime = number;
export type ExposureDelay = [number, number];
export type StimulusCount = number;


export interface PersonalData {
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
}

export interface TestSettings {
  testMode: TestMode;
  stimulusSize: StimulusSize;
  exposureTime: ExposureTime;
  exposureDelay: ExposureDelay;
  stimulusCount: StimulusCount;
  testType: TestType;
}

export interface AppContext {
  personalData: PersonalData,
  testSettings: TestSettings,
}
