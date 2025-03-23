import {target} from "nouislider";
import {ExposureDelay} from "../config/domain.ts";

export function getSliderValue(sliderId: string): number | ExposureDelay {
  const slider = document.getElementById(sliderId)! as target;
  const value = slider.noUiSlider!.get(true);
  // Check if the value is an array
  if (Array.isArray(value)) {
    // Convert array of strings to array of numbers
    return value.map(Number) as ExposureDelay;
  }

  // Convert single string to number
  return Number(value);
}

export function capitalize(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function logWithTime(message: string): void {
  const now = new Date();
  const timestamp = now.toISOString(); // Format as ISO timestamp (e.g., "2025-01-11T14:32:00.000Z")
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Generates a normally distributed random number using the Box-Muller transform.
 * @param mean - The mean (center) of the distribution.
 * @param stdDev - The standard deviation (spread) of the distribution.
 * @returns A normally distributed random number.
 */
export function generateNormalDistributionNumber(mean = 0, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();

  // Box-Muller transform
  let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Scale and shift to match the given mean and standard deviation
  return z0 * stdDev + mean;
}

/**
 * Generates an array of random numbers following a normal distribution.
 *
 * @param {number} [mean=0] - The mean (μ) of the normal distribution.
 * @param {number} [stdDev=1] - The standard deviation (σ) of the normal distribution.
 * @param {number} [count=100] - The number of random numbers to generate.
 * @return {number[]} An array of random numbers following the specified normal distribution.
 */
export function generateNormalDistribution(mean = 0, stdDev = 1, count = 100) {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(generateNormalDistributionNumber(mean, stdDev));
  }
  return numbers;
}
