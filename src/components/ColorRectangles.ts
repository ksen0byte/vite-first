// ColorRectangles.ts
// Domain: RV2-3 Choice Reaction Test (Diagnost-1M methodology)

import {Color} from "../domain/types.ts";
import {toCssSizeStyle} from "../presentation/sizing.ts";

const COLOR_HEX_MAP: Record<Color, string> = {
  red: "#FF0000",
  green: "#00FF00",
  yellow: "#FFFF00",
} as const;

const colors: Color[] = ["red", "green", "yellow"];

/**
 * Height-to-width ratio for color rectangles.
 * Per methodology specifications: 5cm width × 4cm height.
 */
const HEIGHT_RATIO = 0.8;

export function getRandomColor(): Color {
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generates HTML for a color rectangle stimulus.
 * @param sizeMm - Width in millimeters (domain unit)
 * @param color - Domain color value
 */
export function getColorRectangleHtml(sizeMm: number, color: Color): string {
  const hexColor = COLOR_HEX_MAP[color];
  const widthMm = sizeMm;
  const heightMm = Math.round(sizeMm * HEIGHT_RATIO);
  const sizeStyle = toCssSizeStyle(widthMm, heightMm);

  return `<div style="background-color: ${hexColor}; ${sizeStyle}"></div>`;
}

export function getRandomColorRectangleHtml(sizeMm: number): string {
  const randomColor = getRandomColor();
  return getColorRectangleHtml(sizeMm, randomColor);
}