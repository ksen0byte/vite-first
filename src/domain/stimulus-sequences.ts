// src/domain/stimulus-sequences.ts

export type FigureType = 'circle' | 'triangle' | 'square';
export type ColorType = 'red' | 'green' | 'yellow';

export const EXPOSITION_DELAY_SEQUENCE: number[] = [
  900, 1700, 1100, 700, 1900, 1500, 1300, 1900, 1900, 1100, 1900, 1700, 1100, 1900, 1900, 500, 1500, 500, 1100, 1700, 1500, 1900, 1100, 1300, 1500, 1500, 1100, 1100, 900, 700, 1500, 1300, 1700, 1100, 700, 700, 500, 700, 1100, 1900, 1100, 1900, 900, 1300, 1300, 500, 700, 1900, 1900, 1100, 900, 1300, 1900, 500, 500, 1700, 1700, 1300, 1900, 1900, 500, 1300, 900, 1500, 500, 1100, 1300, 500, 1300, 1500, 1500, 1100, 1100, 1100, 1900, 1100, 900, 1100, 1100, 1300, 500, 1900, 1300, 1500, 1700, 1300, 1900, 500, 1900, 1100, 1900, 1300, 500, 1900, 500, 500, 1900, 700, 1900, 500, 700, 900, 700, 900, 700, 700, 1300, 900, 1300, 1500, 500, 1500, 700, 1300, 1900, 1900, 1100, 1700, 500, 700,
];

export const FIGURE_SEQUENCE: readonly FigureType[] = [
  "triangle", "circle", "circle", "square", "square", "triangle", "circle", "triangle", "triangle", "circle", "square", "square", "circle", "square", "triangle", "triangle", "circle", "circle", "square", "square", "triangle", "circle", "square", "square", "triangle", "triangle", "circle", "square", "circle", "triangle", "square", "square", "triangle", "triangle", "circle", "triangle", "circle", "square", "circle", "circle", "circle", "square", "triangle", "square", "square", "triangle", "triangle", "triangle", "circle", "circle", "triangle", "circle", "triangle", "triangle", "circle", "square", "square", "circle", "square", "square", "triangle", "circle", "square", "square", "triangle", "circle", "square", "square", "triangle", "triangle", "circle", "circle", "square", "square", "circle", "triangle", "triangle", "circle", "triangle", "circle", "square", "circle", "circle", "circle", "square", "triangle", "square", "square", "triangle", "triangle", "square", "square", "circle", "circle", "triangle", "triangle", "circle", "triangle", "triangle", "circle", "square", "circle", "square", "triangle", "circle", "circle", "triangle", "circle", "triangle", "triangle", "circle", "square", "square", "circle", "square", "triangle", "triangle", "square", "square", "square",
];

export const WORD_SEQUENCE_EN: readonly string[] = [
  "door", "pine", "corn", "cat", "bear", "home", "bush", "bolt", "tap", "oak", "goat", "bull", "flax", "mole", "seat", "knife", "elm", "ash", "hare", "mule", "desk", "rose",
  "lynx", "buck", "lens", "belt", "moss", "frog", "soy", "seat", "lion", "fox", "salt", "hill", "fir", "club", "lily", "buck", "rose", "elm", "lime", "bear", "home", "cat",
  "goat", "salt", "bolt", "rain", "yew", "pine", "pen", "fir", "ball", "tap", "oak", "goat", "bull", "flax", "mole", "wolf", "knife", "elm", "hare", "frog", "desk", "rose",
  "lynx", "buck", "lens", "belt", "corn", "bush", "lion", "fox", "bean", "key", "hill", "fir", "club", "lily", "buck", "rose", "elm", "lime", "bear", "key", "cat", "goat",
  "salt", "bolt", "wolf", "frog", "moss", "yew", "rain", "pen", "fir", "ball", "bell", "lime", "mule", "lily", "hare", "rain", "flax", "soy", "pen", "corn", "ball", "tap",
  "oak", "fox", "bull", "flax", "mole", "seat", "knife", "hare", "lion", "lynx",
];

export const WORD_SEQUENCE_UA: readonly string[] = [
  "вікно", "клен", "овес", "кіт", "слон", "дім", "верба", "куля", "кран", "кедр", "коза", "бик", "льон", "кріт", "стілець", "ніж", "дуб", "бук", "заєць", "осел", "стіл", "роза",
  "тигр", "кінь", "окуляри", "пояс", "мох", "їжак", "соя", "стілець", "лев", "лисиця", "сіль", "гора", "ялина", "меч", "мак", "кінь", "роза", "дуб", "липа", "слон", "дім", "кіт",
  "коза", "сіль", "куля", "вода", "в'яз", "клен", "перо", "ялина", "м'яч", "кран", "кедр", "коза", "бик", "льон", "кріт", "вовк", "ніж", "дуб", "заєць", "їжак", "стіл", "роза",
  "тигр", "кінь", "окуляри", "пояс", "овес", "верба", "лев", "лисиця", "біб", "ключ", "гора", "ялина", "меч", "мак", "кінь", "роза", "дуб", "липа", "слон", "ключ", "кіт", "коза",
  "сіль", "куля", "вовк", "їжак", "мох", "в'яз", "вода", "перо", "ялина", "м'яч", "гиря", "липа", "осел", "мак", "заєць", "вода", "льон", "соя", "перо", "овес", "м'яч", "кран",
  "кедр", "лисиця", "бик", "льон", "кріт", "стілець", "ніж", "заєць", "лев", "тигр"
];

export const COLOR_SEQUENCE: readonly ColorType[] = [
  "yellow", "green", "green", "red", "red", "yellow", "green", "yellow", "yellow", "green", "red", "red", "green", "red", "yellow", "yellow", "green", "green", "red", "red", "yellow", "green", "red", "red", "yellow", "yellow", "green", "red", "green", "yellow", "red", "red", "yellow", "yellow", "green", "yellow", "green", "red", "green", "green", "green", "red", "yellow", "red", "red", "yellow", "yellow", "yellow", "green", "green", "yellow", "green", "yellow", "yellow", "green", "red", "red", "green", "red", "red", "yellow", "green", "red", "red", "yellow", "green", "red", "red", "yellow", "yellow", "green", "green", "red", "red", "green", "yellow", "yellow", "green", "yellow", "green", "red", "green", "green", "green", "red", "yellow", "red", "red", "yellow", "yellow", "red", "red", "green", "green", "yellow", "yellow", "green", "yellow", "yellow", "green", "red", "green", "red", "yellow", "green", "green", "yellow", "green", "yellow", "yellow", "green", "red", "red", "green", "red", "yellow", "yellow", "red", "red", "red",
];

export const SYLLABLE_SEQUENCE_EN: readonly string[] = [
  "ze", "te", "da", "ko", "je", "ya", "na", "ju", "hu", "si", "le", "de", "yo", "mo", "wa", "ye", "wo", "so", "ja", "tu", "hi", "me", "pi", "ro", "li", "ca", "bo", "vu", "bu", "ge", "mu", "yu", "ta", "cu", "lu", "vi", "su", "mi", "za", "po", "do", "du", "he", "se", "pa",
];

export const SYLLABLE_SEQUENCE_UA: readonly string[] = [
  "па", "шу", "фе", "фо", "ме", "та", "со", "ра", "ка", "гу", "хо", "жу", "жа", "по", "во", "ча", "ро", "ву", "вa", "ре", "ві", "бу", "ша", "ле", "пу", "ді", "рі", "шо", "са", "ке", "ні", "кі", "но", "ла", "мо", "га", "го", "жі", "ко", "хі", "ці", "ші", "чо", "бі", "же",
];

export const COMBINED_SEQUENCE: readonly (FigureType | ColorType | string)[] = ["triangle", "вікно", "square", "red", "green", "овес", "кіт", "circle", "red", "клен", "дім", "red", "green", "red", "triangle", "слон", "куля", "triangle", "red", "верба", "кедр", "square", "коза", "жовтий", "square", "кран", "бик", "льон", "triangle", "circle", "кріт", "заєць", "triangle", "triangle", "square", "green", "red", "осел", "red", "circle", "red", "стілець", "triangle", "green", "green", "жовтий", "green", "triangle", "дуб", "triangle", "ніж", "square", "circle", "тигр", "жовтий", "green", "бук", "стіл", "triangle", "square", "circle", "кінь", "жовтий", "red", "окуляри", "пояс", "circle", "роза", "мох", "жовтий", "circle", "square", "їжак", "жовтий", "triangle", "circle", "green", "circle", "вовк", "red", "лев", "square", "triangle", "square", "сіль", "кінь", "square", "гора", "triangle", "circle", "жовтий", "соя", "red", "circle", "red", "лисиця", "red", "меч", "circle", "дім", "жовтий", "ялина", "triangle", "мак", "circle", "жовтий", "слон", "кіт", "жовтий", "роза", "green", "сіль", "жовтий", "green", "square", "green", "red", "square", "green", "green",];

export const isTargetFigure = (f: FigureType): boolean => f === 'square';
export const isTargetWordEn = (w: string): boolean =>
  ["bear", "cat", "goat", "bull", "mole", "wolf", "frog", "hare", "mule", "lynx", "buck", "lion", "fox"].includes(w);
export const isTargetWordUa = (w: string): boolean =>
  ["слон", "кіт", "коза", "бик", "кріт", "вовк", "їжак", "заєць", "осел", "тигр", "кінь", "лев", "лисиця"].includes(w);
/**
 * Safe wrap-around accessor
 */
export function getStimulusFromSequence<T>(sequence: readonly T[], index: number): T {
  return sequence[index % sequence.length];
}