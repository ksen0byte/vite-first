import {ExposureDelay, ExposureTime, StimulusCount, StimulusSize, TestMode, TestSettings} from "./settings-screen-config.ts";

export const settings = {
  default: {
    language: "en",
    testMode: "shapes" as TestMode,
    stimulusSize: 50 as StimulusSize,
    exposureTime: 700 as ExposureTime,
    exposureDelay: [750, 1250] as ExposureDelay,
    stimulusCount: 50 as StimulusCount,
  }
};

export const defaultTestSettings: TestSettings = {
  firstName: null,
  lastName: null,
  gender: null,
  age: null,
  testMode: settings.default.testMode,
  stimulusSize: settings.default.stimulusSize,
  exposureTime: settings.default.exposureTime,
  exposureDelay: settings.default.exposureDelay,
  stimulusCount: settings.default.stimulusCount,
};
