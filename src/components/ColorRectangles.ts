// ColorRectangles.ts
// Domain: RV2-3 Choice Reaction Test (Diagnost-1M methodology)

import {ColorType} from "../domain/stimulus-sequences.ts";

const COLOR_HEX_MAP: Record<ColorType, string> = {
  red: "#FF0000",
  green: "#00FF00",
  yellow: "#FFFF00",
} as const;

/**
 * Generates HTML for a color rectangle stimulus.
 * Physical dimensions: 5cm width × 4cm height (per methodology specifications)
 */
export function getColorRectangleHtml(sizeMm: number, color: ColorType): string {
  const hexColor = COLOR_HEX_MAP[color];
  // return `<div class="w-[${sizeMm}mm] h-[${sizeMm * 0.8}mm]" style="background-color: ${hexColor};"></div>`;
  const width = sizeMm;
  const height = (sizeMm * 0.8).toFixed();
  return `<div style="background-color: ${hexColor}; width: ${width}mm; height: ${height}mm"></div>`;
}

export function getRandomColorRectangle(sizeMm: number): string {
  const colors: ColorType[] = ["red", "green", "yellow"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return getColorRectangleHtml(sizeMm, randomColor);
}