import {ExposureDelay, ExposureTime, intFormatter, SliderConfig, StimulusCount, StimulusSize, TestMode, AppContext} from "./domain.ts";
import {Options} from "nouislider";

export const settings = {
  default: {
    language: "uk",
    testMode: "shapes" as TestMode,
    stimulusSize: 50 as StimulusSize,
    exposureTime: 700 as ExposureTime,
    exposureDelay: [750, 1250] as ExposureDelay,
    stimulusCount: 50 as StimulusCount,
  }
};

export const defaultAppContext: AppContext = {
  personalData: {
    firstName: "",
    lastName: "",
    gender: null,
    age: null,
  },
  testSettings: {
    testMode: settings.default.testMode,
    stimulusSize: settings.default.stimulusSize,
    exposureTime: settings.default.exposureTime,
    exposureDelay: settings.default.exposureDelay,
    stimulusCount: settings.default.stimulusCount,
    testType: 'svmr'
  },
  debugMode: "prod",
};

export const subsectionsConfig = {
  shape: {
    sizeSlider: {
      id: "shape-size-slider",
      options: {
        start: 50,
        step: 10,
        connect: "lower",
        range: {min: 20, max: 70},
        // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
        format: intFormatter,
      } as Options,
      label: {
        id: "shape-size-slider-label",
        localizationKey: "shapeSizeSliderLabel",
        unit: "mm",
      }
    } as SliderConfig,
  },
  word: {
    sizeSlider: {
      id: "word-size-slider",
      options: {
        start: 20,
        step: 1,
        connect: "lower",
        range: {min: 15, max: 30},
        // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
        format: intFormatter,
      } as Options,
      label: {
        id: "word-size-slider-label",
        localizationKey: "wordSizeSliderLabel",
        unit: "mm",
      }
    }
  },
  syllable: {
    sizeSlider: {
      id: "syllable-size-slider",
      options: {
        start: 20,
        step: 1,
        connect: "lower",
        range: {min: 15, max: 30},
        // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
        format: intFormatter,
      } as Options,
      label: {
        id: "syllable-size-slider-label",
        localizationKey: "syllableSizeSliderLabel",
        unit: "mm",
      }
    }
  },
  general: {
    exposureTimeSlider: {
      id: "exposure-time-slider",
      label: {
        id: "exposure-time-label",
        localizationKey: "exposureTimeLabel",
        unit: "ms",
      },
      options: {
        start: 700,
        step: 50,
        connect: "lower",
        range: {min: 500, max: 1000},
        // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
        format: intFormatter,
      },
    } as SliderConfig,
    exposureDelaySlider: {
      id: "exposure-delay-slider",
      label: {
        id: "exposure-delay-label",
        localizationKey: "exposureDelayLabel",
        unit: "ms",
      },
      options: {
        start: [750, 1250],
        step: 50,
        connect: true,
        range: {min: 500, max: 1500},
        // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
        format: intFormatter,
      },
    } as SliderConfig,
    stimulusCountSlider: {
      id: "stimulus-count-slider",
      label: {
        id: "stimulus-count-label",
        localizationKey: "stimulusCountLabel",
        unit: "",
      },
      options: {
        start: 50,
        step: 2,
        connect: "lower",
        range: {min: 30, max: 100},
        // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
        format: intFormatter,
      },
    } as SliderConfig
  }
}

export const inputsConfig = {
  nameInputId: "name-input",
  surnameInputId: "surname-input",
  genderSelectId: "gender-select",
  ageInputId: "age-input",
  sizeSliderId: {
    "shapes": subsectionsConfig.shape.sizeSlider.id,
    "words": subsectionsConfig.word.sizeSlider.id,
    "syllables": subsectionsConfig.syllable.sizeSlider.id,
  },
  exposureTimeSliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.exposureTimeSlider.id,
    "words": "words-" + subsectionsConfig.general.exposureTimeSlider.id,
    "syllables": "syllables-" + subsectionsConfig.general.exposureTimeSlider.id,
  },
  exposureDelaySliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.exposureDelaySlider.id,
    "words": "words-" + subsectionsConfig.general.exposureDelaySlider.id,
    "syllables": "syllables-" + subsectionsConfig.general.exposureDelaySlider.id,
  },
  stimulusCountSliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.stimulusCountSlider.id,
    "words": "words-" + subsectionsConfig.general.stimulusCountSlider.id,
    "syllables": "syllables-" + subsectionsConfig.general.stimulusCountSlider.id,
  },

}