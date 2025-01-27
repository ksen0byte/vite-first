// Words.ts
import {getLocalizedVar} from "../localization/localization.ts";

type WordColor = "red" | "green" | "blue";

// A small sample set of words; you can expand this list
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

function getWordHtml(word: string, size: number, color: WordColor): string {
  return `<span class="font-mono text-[${size}mm] leading-none text-${color}-600">${word}</span>`;
}
