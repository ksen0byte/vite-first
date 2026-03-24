// Words.ts
import {getLocalizedVar} from "../localization/localization.ts";

type WordColor = "red" | "green" | "blue";

const wordsList = getLocalizedVar("randomWords");

/**
 * Generates a random word, wrapped in a <span> with the specified size and color.
 */
export function getRandomWord(size: number, color?: WordColor): string {
  const colors: WordColor[] = ["red", "blue", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];

  // Pick a word at random from wordsList
  const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

  return getWordHtml(randomWord, size, chosenColor);
}

export function getWordHtml(word: string, size: number, color: WordColor): string {
  // Map your color names to actual hex/css values if you aren't using a lookup table
  const colorMap: Record<WordColor, string> = {
    red: "#dc2626",   // Tailwind's red-600
    green: "#16a34a", // Tailwind's green-600
    blue: "#2563eb"   // Tailwind's blue-600
  };

  const hexColor = colorMap[color];

  return `
    <span 
      class="font-mono leading-none" 
      style="font-size: ${size}mm; color: ${hexColor};"
    >${word}</span>
  `;
}