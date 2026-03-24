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
  getStimulusFromSequence, FigureType, ColorType, COMBINED_SEQUENCE_EN, COMBINED_SEQUENCE_UA
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

      case "combined":
        if (usePregenerated.stimuli) {
          const currentLang = LanguageManager.getCurrentLanguage();
          const combinedSequence = currentLang === "en" ? COMBINED_SEQUENCE_EN : COMBINED_SEQUENCE_UA;
          const stimulus = getStimulusFromSequence(combinedSequence, stimulusIndex);

          // Identify what the stimulus is
          const figures: FigureType[] = ['circle', 'triangle', 'square'];
          const colors: ColorType[] = ['red', 'green', 'yellow'];

          if (figures.includes(stimulus as FigureType)) {
            this.container.innerHTML = getShapeSvg(stimulusSize, "red", stimulus as FigureType);
          } else if (colors.includes(stimulus as ColorType)) {
            this.container.innerHTML = getColorRectangleHtml(stimulusSize, stimulus as ColorType);
          } else {
            const mappedFontSize = Math.round(15 + (stimulusSize - 20) * 0.3);
            this.container.innerHTML = getWordHtml(stimulus, mappedFontSize, "red");
          }
        } else {
          // Pick 1 of 3 types randomly
          const types = ['shape', 'color', 'word'];
          const randomType = types[Math.floor(Math.random() * types.length)];

          switch (randomType) {
            case 'shape':
              this.container.innerHTML = getRandomShape(stimulusSize, "red");
              break;
            case 'color':
              this.container.innerHTML = getRandomColorRectangle(stimulusSize);
              break;
            case 'word':
              const mappedFontSize = Math.round(15 + (stimulusSize - 20) * 0.3);
              this.container.innerHTML = getRandomWord(mappedFontSize, "red");
              break;
          }
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
