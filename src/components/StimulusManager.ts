import {logWithTime} from "../util/util.ts";
import {AppContext} from "../config/domain.ts";
import {getRandomShape, getShapeSvg} from "./Shapes.ts";
import {getRandomWord, getWordHtml} from "./Words.ts";
import {getRandomColorRectangle, getColorRectangleHtml} from "./ColorRectangles.ts";
import {
  FIGURE_SEQUENCE,
  WORD_SEQUENCE_EN,
  WORD_SEQUENCE_UA,
  COLOR_SEQUENCE,
  getStimulusFromSequence
} from "../domain/stimulus-sequences.ts";
import {LanguageManager} from "../localization/LanguageManager.ts";

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
  public showStimulus(stimulusIndex: number): void {
    const {stimulusSize, testMode, testType, usePregenerated} = this.appContext.testSettings;
    logWithTime(
      `Showing stimulus #${stimulusIndex + 1}, size: ${stimulusSize}, test mode: ${testMode}, test type: ${testType}, pregenerated: ${usePregenerated.stimuli}`
    );

    switch (testMode) {
      case "shapes":
        if (usePregenerated.stimuli) {
          const shape = getStimulusFromSequence(FIGURE_SEQUENCE, stimulusIndex);
          this.container.innerHTML = getShapeSvg(stimulusSize, "red", shape);
        } else {
          this.container.innerHTML = getRandomShape(stimulusSize, "red");
        }
        break;

      case "words":
        if (usePregenerated.stimuli) {
          const currentLang = LanguageManager.getCurrentLanguage();
          const wordSequence = currentLang === "en" ? WORD_SEQUENCE_EN : WORD_SEQUENCE_UA;
          const word = getStimulusFromSequence(wordSequence, stimulusIndex);
          this.container.innerHTML = getWordHtml(word, stimulusSize, "red");
        } else {
          this.container.innerHTML = getRandomWord(stimulusSize, "red");
        }
        break;

      case "colors":
        if (usePregenerated.stimuli) {
          const color = getStimulusFromSequence(COLOR_SEQUENCE, stimulusIndex);
          this.container.innerHTML = getColorRectangleHtml(stimulusSize, color);
        } else {
          this.container.innerHTML = getRandomColorRectangle(stimulusSize);
        }
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
}
