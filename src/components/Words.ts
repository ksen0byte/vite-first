// Words.ts
import {getLocalizedVar} from "../localization/localization.ts";
import {Color, Word} from "../domain/types.ts";

const wordsList = getLocalizedVar("randomWords");

export function getRandomWord() {
  return wordsList[Math.floor(Math.random() * wordsList.length)];
}

/**
 * Generates a random word, wrapped in a <span> with the specified size and color.
 */
export function getRandomWordHtml(size: number, color?: Color): Word {
  const colors: Color[] = ["red", "yellow", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];

  // Pick a word at random from wordsList
  const randomWord = getRandomWord();

  return getWordHtml(randomWord, size, chosenColor);
}

export function getWordHtml(word: Word, size: number, color: Color): string {
  // Map your color names to actual hex/css values if you aren't using a lookup table
  const colorMap: Record<Color, string> = {
    red: "#dc2626",   // Tailwind's red-600
    green: "#16a34a", // Tailwind's green-600
    // blue: "#2563eb"   // Tailwind's blue-600
    yellow: "#d69e2e"   // Tailwind's blue-600
  };

  const hexColor = colorMap[color];

  return `
    <span 
      class="font-mono leading-none" 
      style="font-size: ${size}mm; color: ${hexColor};"
    >${word}</span>
  `;
}