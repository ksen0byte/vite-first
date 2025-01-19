type WordColor = "red" | "green" | "blue";

export function getRandomWord(size: number, color?: WordColor): string {
  const colors: WordColor[] = ["red", "blue", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];
  return getWordHtml(size, chosenColor);
}

function getWordHtml(size: number, color: WordColor): string {
  return ``;
}
