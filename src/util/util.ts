import {target} from "nouislider";

export function getSliderValue(sliderId: string): number | [number, number] {
  const slider = document.getElementById(sliderId)! as target;
  const value = slider.noUiSlider!.get(true);
  // Check if the value is an array
  if (Array.isArray(value)) {
    // Convert array of strings to array of numbers
    return value.map(Number) as [number, number];
  }

  // Convert single string to number
  return Number(value);
}