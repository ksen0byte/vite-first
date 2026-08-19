import {Color, Shape} from "../domain/types.ts";
import {toCssDimension} from "../presentation/sizing.ts";

export function getRandomShape(): Shape {
  const shapes: Shape[] = ["circle", "triangle", "square"];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

/**
 * Return random shape as an SVG string.
 * @param sizeMm - Size in millimeters (domain unit)
 */
export function getRandomShapeSvg(sizeMm: number, color?: Color, shape?: Shape): string {
  const colors: Color[] = ["red", "yellow", "green"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];
  const chosenShape = shape ?? getRandomShape();
  return getShapeSvg(sizeMm, chosenColor, chosenShape);
}

/**
 * Return an SVG string for a specific shape with domain color and size.
 * @param sizeMm - Size in millimeters (domain unit)
 */
export function getShapeSvg(sizeMm: number, color: Color, shape: Shape): string {
  return getShapeSvgWithStroke(sizeMm, colorToCss(color), shape);
}

/**
 * Return an SVG string for a specific shape with CSS color string and size.
 * @param sizeMm - Size in millimeters (domain unit)
 */
export function getShapeSvgWithStroke(sizeMm: number, cssColor: string, shape: Shape): string {
  const size = toCssDimension(sizeMm);

  switch (shape) {
    case "circle":
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="${cssColor}" stroke-width="4"/></svg>`;
    case "square":
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="none" stroke="${cssColor}" stroke-width="4"/></svg>`;
    case "triangle":
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><polygon points="50,4 96,96 4,96" fill="none" stroke="${cssColor}" stroke-width="4"/></svg>`;
    default:
      throw new Error(`Unsupported shape: ${shape}`);
  }
}

function colorToCss(color: Color): string {
  const colorMap: Record<Color, string> = {
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#d69e2e"
  };
  return colorMap[color];
}
