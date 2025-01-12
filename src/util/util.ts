import {target} from "nouislider";
import {ExposureDelay} from "../config/settings-screen-config.ts";

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