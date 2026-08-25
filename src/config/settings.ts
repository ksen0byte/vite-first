import {ExposureDelay, ExposureTime, FeedbackSettings, StimulusCount, StimulusSize, TestMode, AppContext} from "./domain.ts";

/**
 * Single source of truth for every numeric test parameter.
 * Each definition drives the settings-screen input (id, label, unit, min/max/step),
 * the default app context, and input validation/clamping.
 *
 * Shared-parameter limits mirror the pre-rework slider configuration:
 * stimulus size 10-70 mm, exposure 500-1500 ms, delay 250-2500 ms, count 30-480.
 * Feedback-protocol limits come from the removed feedback sliders
 * (exposure 20-900 ms, step 1-100 ms, pause 0-2500 ms, duration 30-1800 s).
 */
export interface ParameterDefinition {
  /** HTML input id used on the settings screen. */
  readonly id: string;
  /** Localization key for the always-visible label. */
  readonly labelKey: string;
  /** Localization key for the unit suffix (e.g. "ms", "mm", "units"). */
  readonly unitKey: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Factory default: used by defaultAppContext, reset, and input placeholders. */
  readonly defaultValue: number;
}

export const parameters = {
  stimulusSize: {id: "compact-stimulus-size", labelKey: "stimulusSizeLabel", unitKey: "mm", min: 10, max: 70, step: 10, defaultValue: 50},
  exposureTime: {id: "compact-exposure-time", labelKey: "exposureTimeLabel", unitKey: "ms", min: 500, max: 1500, step: 50, defaultValue: 700},
  exposureDelayMin: {id: "compact-delay-min", labelKey: "exposureDelayMinLabel", unitKey: "ms", min: 250, max: 2500, step: 50, defaultValue: 500},
  exposureDelayMax: {id: "compact-delay-max", labelKey: "exposureDelayMaxLabel", unitKey: "ms", min: 250, max: 2500, step: 50, defaultValue: 1900},
  stimulusCount: {id: "compact-stimulus-count", labelKey: "stimulusCountLabel", unitKey: "units", min: 30, max: 480, step: 10, defaultValue: 50},
  feedbackInitialExposure: {id: "compact-initial-exposure", labelKey: "feedbackInitialExposure", unitKey: "ms", min: 20, max: 900, step: 10, defaultValue: 900},
  feedbackAdjustmentStep: {id: "compact-adjustment-step", labelKey: "feedbackAdjustmentStep", unitKey: "ms", min: 1, max: 100, step: 1, defaultValue: 20},
  feedbackMinExposure: {id: "compact-exposure-min", labelKey: "feedbackMinExposure", unitKey: "ms", min: 20, max: 900, step: 10, defaultValue: 20},
  feedbackMaxExposure: {id: "compact-exposure-max", labelKey: "feedbackMaxExposure", unitKey: "ms", min: 20, max: 900, step: 10, defaultValue: 900},
  feedbackPause: {id: "compact-pause", labelKey: "feedbackPause", unitKey: "ms", min: 0, max: 2500, step: 10, defaultValue: 200},
  feedbackDuration: {id: "compact-duration", labelKey: "feedbackDuration", unitKey: "s", min: 30, max: 1800, step: 30, defaultValue: 300},
  /**
   * Mobility-submode series length (doc §2.1 recommends ~120 stimuli). Kept
   * as a separate definition so its default can differ from the optimal
   * protocol's count while both persist into the same TestSettings field.
   */
  feedbackStimulusCount: {id: "compact-stimulus-count-fb", labelKey: "stimulusCountLabel", unitKey: "units", min: 30, max: 480, step: 10, defaultValue: 120},
} as const satisfies Record<string, ParameterDefinition>;

/**
 * Ordered min/max parameter pairs that must satisfy min <= max. The settings
 * screen derives its cross-field validation from this list, so a new ranged
 * pair only needs an entry here (plus the two parameter definitions).
 */
export const parameterPairs: readonly (readonly [ParameterDefinition, ParameterDefinition, string])[] = [
  [parameters.exposureDelayMin, parameters.exposureDelayMax, "delayMinExceedsMaxError"],
  [parameters.feedbackMinExposure, parameters.feedbackMaxExposure, "exposureMinExceedsMaxError"],
] as const;

/**
 * Recursively freezes a config object so factory defaults cannot be mutated at
 * runtime (defence in depth on top of AppContextManager's clone-on-access).
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const property of Object.values(value as Record<string, unknown>)) {
      deepFreeze(property);
    }
  }
  return value;
}

deepFreeze(parameters);
deepFreeze(parameterPairs);

export const settings = {
  default: {
    language: "uk" as "uk" | "en",
    testMode: "shapes" as TestMode,
    stimulusSize: parameters.stimulusSize.defaultValue as StimulusSize,
    exposureTime: parameters.exposureTime.defaultValue as ExposureTime,
    exposureDelay: [parameters.exposureDelayMin.defaultValue, parameters.exposureDelayMax.defaultValue] as ExposureDelay,
    stimulusCount: parameters.stimulusCount.defaultValue as StimulusCount,
    feedback: {
      initialExposure: parameters.feedbackInitialExposure.defaultValue,
      adjustmentStep: parameters.feedbackAdjustmentStep.defaultValue,
      minExposure: parameters.feedbackMinExposure.defaultValue,
      maxExposure: parameters.feedbackMaxExposure.defaultValue,
      pause: parameters.feedbackPause.defaultValue,
      duration: parameters.feedbackDuration.defaultValue,
    } as FeedbackSettings,
  }
};

deepFreeze(settings);

export const defaultAppContext: AppContext = {
  personalData: {
    firstName: "",
    lastName: "",
    gender: 'male',
    age: 0,
  },
  testSettings: {
    protocolMode: "optimal",
    feedbackSubmode: "mobility",
    testMode: settings.default.testMode,
    stimulusSize: settings.default.stimulusSize,
    exposureTime: settings.default.exposureTime,
    exposureDelay: settings.default.exposureDelay,
    stimulusCount: settings.default.stimulusCount,
    testType: 'svmr',
    feedback: settings.default.feedback,
    usePregenerated: {
      exposureDelay: true,
      stimuli: true,
    }
  },
  debugMode: "prod",
};

deepFreeze(defaultAppContext);

export const printConfig = {
  chart: {
    width: 800,
    height: 400,
  },
  page: {
    margin: "0.5cm",
  },
  table: {
    cellHeight: "1.25em",
  },
  fontSize: "50%",
  lineHeight: 1.2,
  resize: {
    timeoutAfterPrint: 500,
  },
}
