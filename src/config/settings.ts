import {ExposureDelay, ExposureTime, FeedbackSettings, intFormatter, SliderConfig, StimulusCount, StimulusSize, TestMode, AppContext} from "./domain.ts";
import {Options} from "nouislider";

export const settings = {
  default: {
    language: "uk",
    testMode: "shapes" as TestMode,
    stimulusSize: 50 as StimulusSize,
    exposureTime: 700 as ExposureTime,
    exposureDelay: [500, 1900] as ExposureDelay,
    stimulusCount: 50 as StimulusCount,
    feedback: {
      initialExposure: 900,
      adjustmentStep: 20,
      minExposure: 20,
      maxExposure: 900,
      pause: 200,
      duration: 300,
    } as FeedbackSettings,
  }
};

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
        start: 50,
        step: 10,
        connect: "lower",
        range: {min: 10, max: 70},
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
  colors: {
    sizeSlider: {
      id: "colors-size-slider",
      options: {
        start: 50,
        step: 10,
        connect: "lower",
        range: {min: 20, max: 70},
        format: intFormatter,
      } as Options,
      label: {
        id: "colors-size-slider-label",
        localizationKey: "colorsSizeSliderLabel",
        unit: "mm",
      }
    }
  },
  combined: {
    wordLocalisationKey: "wordPreviewWord",
    sizeSlider: {
      id: "combined-size-slider",
      options: {
        start: 50,
        step: 10,
        connect: "lower",
        range: {min: 20, max: 70},
        format: intFormatter,
      } as Options,
      label: {
        id: "combined-size-slider-label",
        localizationKey: "combinedSizeSliderLabel",
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
        range: {min: 500, max: 1500},
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
        start: [500, 1900],
        step: 50,
        connect: true,
        range: {min: 250, max: 2500},
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
        step: 10,
        connect: "lower",
        range: {min: 30, max: 480},
        // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
        format: intFormatter,
      },
    } as SliderConfig
  }
  ,feedback: {
    initialExposureSlider: {
      id: "feedback-initial-exposure-slider", options: {start: 900, step: 10, connect: "lower", range: {min: 20, max: 900}, format: intFormatter},
      label: {id: "feedback-initial-exposure-label", localizationKey: "feedbackInitialExposure", unit: "ms"}
    } as SliderConfig,
    adjustmentStepSlider: {
      id: "feedback-adjustment-step-slider", options: {start: 20, step: 1, connect: "lower", range: {min: 1, max: 100}, format: intFormatter},
      label: {id: "feedback-adjustment-step-label", localizationKey: "feedbackAdjustmentStep", unit: "ms"}
    } as SliderConfig,
    exposureRangeSlider: {
      id: "feedback-exposure-range-slider", options: {start: [20, 900], step: 10, connect: true, range: {min: 20, max: 900}, format: intFormatter},
      label: {id: "feedback-exposure-range-label", localizationKey: "feedbackExposureRange", unit: "ms"}
    } as SliderConfig,
    pauseSlider: {
      id: "feedback-pause-slider", options: {start: 200, step: 10, connect: "lower", range: {min: 0, max: 2500}, format: intFormatter},
      label: {id: "feedback-pause-label", localizationKey: "feedbackPause", unit: "ms"}
    } as SliderConfig,
    durationSlider: {
      id: "feedback-duration-slider", options: {start: 300, step: 30, connect: "lower", range: {min: 30, max: 1800}, format: intFormatter},
      label: {id: "feedback-duration-label", localizationKey: "feedbackDuration", unit: "s"}
    } as SliderConfig,
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
    "colors": subsectionsConfig.colors.sizeSlider.id,
    "combined": subsectionsConfig.combined.sizeSlider.id,
  },
  exposureTimeSliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.exposureTimeSlider.id,
    "words": "words-" + subsectionsConfig.general.exposureTimeSlider.id,
    "colors": "colors-" + subsectionsConfig.general.exposureTimeSlider.id,
    "combined": "combined-" + subsectionsConfig.general.exposureTimeSlider.id,
  },
  exposureDelaySliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.exposureDelaySlider.id,
    "words": "words-" + subsectionsConfig.general.exposureDelaySlider.id,
    "colors": "colors-" + subsectionsConfig.general.exposureDelaySlider.id,
    "combined": "combined-" + subsectionsConfig.general.exposureDelaySlider.id,
  },
  stimulusCountSliderId: {
    "shapes": "shapes-" + subsectionsConfig.general.stimulusCountSlider.id,
    "words": "words-" + subsectionsConfig.general.stimulusCountSlider.id,
    "colors": "colors-" + subsectionsConfig.general.stimulusCountSlider.id,
    "combined": "combined-" + subsectionsConfig.general.stimulusCountSlider.id,
  },

}

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
