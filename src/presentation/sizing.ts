/**
 * Presentation layer utilities for converting domain sizes (mm) to CSS.
 *
 * Domain layer works in millimeters (scientific requirement).
 * Presentation layer needs CSS strings with units.
 * This module bridges the gap, keeping mm isolated to one place.
 */

/**
 * Convert domain size (mm) to CSS dimension string.
 */
export function toCssDimension(sizeMm: number): string {
  return `${sizeMm}mm`;
}

/**
 * Convert domain size (mm) to CSS width style.
 */
export function toCssWidth(sizeMm: number): string {
  return `width: ${sizeMm}mm`;
}

/**
 * Convert domain size (mm) to CSS height style.
 */
export function toCssHeight(sizeMm: number): string {
  return `height: ${sizeMm}mm`;
}

/**
 * Convert domain size (mm) to inline style string for width and height.
 */
export function toCssSizeStyle(widthMm: number, heightMm: number): string {
  return `width: ${widthMm}mm; height: ${heightMm}mm`;
}
