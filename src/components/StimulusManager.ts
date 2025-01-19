import {logWithTime} from "../util/util.ts";
import {TestSettings} from "../config/settings-screen-config.ts";
import {getRandomShape} from "./Shapes.ts";

/**
 * Handles creation, display, and clearing of stimuli.
 */
export class StimulusManager {
  private container: HTMLElement;
  private readonly testSettings: TestSettings;

  constructor(container: HTMLElement, testSettings: TestSettings) {
    this.container = container;
    this.testSettings = testSettings;
  }

  /**
   * Shows a stimulus based on the current test mode, type, and size.
   */
  public showStimulus(stimulusNumber: number): void {
    const {stimulusSize, testMode, testType} = this.testSettings;
    logWithTime(
      `Showing stimulus #${stimulusNumber}, size: ${stimulusSize}, test mode: ${testMode}, test type: ${testType}`
    );

    switch (testMode) {
      case "shapes":
      case "syllables":
      case "words":
        this.container.innerHTML = getRandomShape(stimulusSize);
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
    const [minDelay, maxDelay] = this.testSettings.exposureDelay;
    const min = Math.ceil(minDelay / 50) * 50;
    const max = Math.floor(maxDelay / 50) * 50;
    const number = Math.floor(Math.random() * ((max - min) / 50 + 1)) * 50 + min;
    logWithTime(`Delay: ${number}`);
    return number;
  }
}
