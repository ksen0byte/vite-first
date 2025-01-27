// Syllables.ts
import {getLocalizedVar} from "../localization/localization.ts";

type SyllableColor = "red" | "green" | "blue";

// Example syllable list
const syllablesList = getLocalizedVar("randomSyllables");

/**
 * Generates a random syllable, wrapped in a <span> with the specified size and color.
 */
export function getRandomSyllable(size: number, color?: SyllableColor): string {
  const colors: SyllableColor[] = ["red", "blue", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];

  // Pick a syllable at random
  const randomSyllable = syllablesList[Math.floor(Math.random() * syllablesList.length)];

  return getSyllableHtml(randomSyllable, size, chosenColor);
}

function getSyllableHtml(syllable: string, size: number, color: SyllableColor): string {
  return `<span class="font-mono text-[${size}mm] leading-none text-${color}-600">${syllable}</span>`;
}
