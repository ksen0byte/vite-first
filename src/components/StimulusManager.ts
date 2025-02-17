import {logWithTime} from "../util/util.ts";
import {AppContext} from "../config/domain.ts";
import {getRandomShape} from "./Shapes.ts";
import {getRandomWord} from "./Words.ts";
import {getRandomSyllable} from "./Syllables.ts";

/**
 * Handles creation, display, and clearing of stimuli.
 */
export class StimulusManager {
  private container: HTMLElement;
  private readonly appContext: AppContext;

  constructor(container: HTMLElement, appContext: AppContext) {
    this.container = container;
    this.appContext = appContext;
  }

  /**
   * Shows a stimulus based on the current test mode, type, and size.
   */
  public showStimulus(stimulusNumber: number): void {
    const {stimulusSize, testMode, testType} = this.appContext.testSettings;
    logWithTime(
      `Showing stimulus #${stimulusNumber}, size: ${stimulusSize}, test mode: ${testMode}, test type: ${testType}`
    );

    switch (testMode) {
      case "shapes":
        this.container.innerHTML = getRandomShape(stimulusSize, "red");
        break;

      case "words":
        this.container.innerHTML = getRandomWord(stimulusSize, "red");
        break;

      case "syllables":
        this.container.innerHTML = getRandomSyllable(stimulusSize, "red");
        break;

      default:
        throw new Error(`Unsupported test mode: ${testMode}`);
    }
  }

  /**
   * Clears the stimulus display area.
   */
  public clearContainer(): void {
    logWithTime("Hiding stimulus");
    this.container.innerHTML = "";
  }

  /**
   * Computes a random delay (rounded to the nearest 50ms) within the specified exposure delay range.
   */
  public getRandomExposureDelay(): number {
    const [minDelay, maxDelay] = this.appContext.testSettings.exposureDelay;
    const min = Math.ceil(minDelay / 50) * 50;
    const max = Math.floor(maxDelay / 50) * 50;
    const number = Math.floor(Math.random() * ((max - min) / 50 + 1)) * 50 + min;
    logWithTime(`Delay: ${number}`);
    return number;
  }
}
