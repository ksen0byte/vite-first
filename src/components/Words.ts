// Words.ts
import {getLocalizedVar} from "../localization/localization.ts";
import {Color, Word} from "../domain/types.ts";
import {isAnimal, isNonLiving, isPlant} from "../domain/stimulus-sequences.ts";
import {toCssDimension} from "../presentation/sizing.ts";

export type WordCategory = "animal" | "plant" | "nonLiving";

function getWordsList(): readonly Word[] {
  return getLocalizedVar("randomWords");
}

export function getRepresentativeWord(words: readonly Word[], category: WordCategory): Word {
  const predicate = category === "animal"
    ? isAnimal
    : category === "plant"
      ? isPlant
      : isNonLiving;

  return words.find(predicate) ?? words[0] ?? "";
}

export function getRandomWord() {
  const wordsList = getWordsList();
  return wordsList[Math.floor(Math.random() * wordsList.length)];
}

/**
 * Generates a random word, wrapped in a <span> with the specified size and color.
 * @param sizeMm - Font size in millimeters (domain unit)
 */
export function getRandomWordHtml(sizeMm: number, color?: Color): Word {
  const colors: Color[] = ["red", "yellow", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];

  const randomWord = getRandomWord();
  return getWordHtml(randomWord, sizeMm, chosenColor);
}

/**
 * Generates HTML for a word stimulus with domain color.
 * @param sizeMm - Font size in millimeters (domain unit)
 */
export function getWordHtml(word: Word, sizeMm: number, color: Color): string {
  const colorMap: Record<Color, string> = {
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#d69e2e"
  };

  return getWordHtmlWithCssColor(word, sizeMm, colorMap[color]);
}

/**
 * Generates HTML for a word stimulus with CSS color.
 * @param sizeMm - Font size in millimeters (domain unit)
 */
export function getWordHtmlWithCssColor(word: Word, sizeMm: number, cssColor: string): string {
  const fontSize = toCssDimension(sizeMm);

  return `
    <span
      class="font-mono leading-none"
      style="font-size: ${fontSize}; color: ${cssColor};"
    >${word}</span>
  `;
}

/**
 * Generates HTML for a word category placeholder (filled by localization).
 * @param category
 * @param sizeMm - Font size in millimeters (domain unit)
 * @param cssColor
 */
export function getWordCategoryHtml(category: WordCategory, sizeMm: number, cssColor: string): string {
  const fontSize = toCssDimension(sizeMm);

  return `
    <span
      class="font-mono leading-none"
      data-localize-word-category="${category}"
      style="font-size: ${fontSize}; color: ${cssColor};"
    ></span>
  `;
}
