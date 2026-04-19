import {logWithTime} from "../util/util.ts";
import {AppContext, TestMode} from "../config/domain.ts";
import {getRandomShape, getShapeSvg} from "./Shapes.ts";
import {getRandomWord, getWordHtml} from "./Words.ts";
import {getColorRectangleHtml, getRandomColor} from "./ColorRectangles.ts";
import {
  COLOR_SEQUENCE,
  COMBINED_SEQUENCE_EN,
  COMBINED_SEQUENCE_UA,
  getStimulusFromSequence,
  SHAPE_SEQUENCE,
  WORD_SEQUENCE_EN,
  WORD_SEQUENCE_UA
} from "../domain/stimulus-sequences.ts";
import {LanguageManager} from "../localization/LanguageManager.ts";
import {Color, Shape, Stimulus, Word} from "../domain/types.ts";

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
  public showStimulus(stimulusIndex: number): Stimulus {
    const {stimulusSize, testMode, usePregenerated} = this.appContext.testSettings;

    logWithTime(`Showing stimulus #${stimulusIndex + 1}, size: ${stimulusSize}, test mode: ${testMode}`);

    const stimulus = this.getStimulusValue(testMode, stimulusIndex, usePregenerated.stimuli);
    this.renderStimulus(stimulus, stimulusSize);

    return stimulus;
  }

  private getStimulusValue(mode: TestMode, index: number, isPregenerated: boolean): Stimulus {
    const lang = LanguageManager.getCurrentLanguage();

    switch (mode) {
      case "shapes":
        return isPregenerated ? getStimulusFromSequence(SHAPE_SEQUENCE, index) : getRandomShape();
      case "colors":
        return isPregenerated ? getStimulusFromSequence(COLOR_SEQUENCE, index) : getRandomColor();
      case "words": {
        return isPregenerated ? getStimulusFromSequence(lang === "en" ? WORD_SEQUENCE_EN : WORD_SEQUENCE_UA, index) : getRandomWord();
      }

      case "combined": {
        if (isPregenerated) {
          const seq = lang === "en" ? COMBINED_SEQUENCE_EN : COMBINED_SEQUENCE_UA;
          return getStimulusFromSequence(seq, index);
        }
        // Randomly pick one type
        const types = ['shape', 'color', 'word'] as const;
        const randomType = types[Math.floor(Math.random() * types.length)];
        return randomType === 'shape' ? getRandomShape() : randomType === 'color' ? getRandomColor() : getRandomWord();
      }
    }
  }

  private renderStimulus(stimulus: Stimulus, size: number): void {
    const figures: Shape[] = ['circle', 'triangle', 'square'];
    const colors: Color[] = ['red', 'green', 'yellow'];

    if (figures.includes(stimulus as Shape)) {
      this.container.innerHTML = getShapeSvg(size, "red", stimulus as Shape);
    } else if (colors.includes(stimulus as Color)) {
      this.container.innerHTML = getColorRectangleHtml(size, stimulus as Color);
    } else {
      // It's a word: apply scaling logic
      const fontSize = size; // Math.round(15 + (size - 20) * 0.3);
      this.container.innerHTML = getWordHtml(stimulus as Word, fontSize, "red");
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
