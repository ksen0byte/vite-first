import {localize} from "./ui.ts";

export function setupSettingsScreen(containerId: string): void {
  const container = document.getElementById(containerId)!;

  // Subsection toggle
  const shapesSubsection = container.querySelector("#shapes-subsection") as HTMLElement;
  const wordsSubsection = container.querySelector("#words-subsection") as HTMLElement;
  const syllablesSubsection = container.querySelector("#syllables-subsection") as HTMLElement;

  [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(subsec => {
    const header = subsec.querySelector(".subsection-header") as HTMLElement;
    header.addEventListener("click", () => {
      // Collapse all
      [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(s => s.classList.remove("expanded"));

      // Mark chosen and expand
      subsec.classList.add("expanded");
      // Handle the logic for which stimulus type is active, etc.
    });
  });

  /********************************************/
  /* 1. SHAPES                                */
  /********************************************/
  const shapeSizeSlider = document.getElementById("shape-size-slider") as HTMLInputElement;
  const shapesExposureTimeSlider = document.getElementById("shapes-exposure-time-slider") as HTMLInputElement;
  const shapesExposureDelaySlider = document.getElementById("shapes-exposure-delay-slider") as HTMLInputElement;
  const shapeSizeSliderLabel = document.getElementById("shape-size-slider-label") as HTMLElement;
  const shapesExposureTimeSliderLabel = document.getElementById("shapes-exposure-time-slider-label") as HTMLElement;
  const shapesExposureDelaySliderLabel = document.getElementById("shapes-exposure-delay-slider-label") as HTMLElement;

  const redCircleShape = {
    name: "Red Circle",
    svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="40" fill="red"/></svg>`,
  };

  function showRedCircle() {
    const shapePreview = document.getElementById("shape-preview") as HTMLElement;

    // 1. Get user-chosen shape size
    const size = parseInt(shapeSizeSlider.value, 10);

    // 2. Insert the chosen shape
    shapePreview.innerHTML = redCircleShape.svg;
    // Optionally scale the shape if needed:
    const svgElement = shapePreview.querySelector("svg")!;
    svgElement.setAttribute("width", (size / 0.8).toString() + "mm");
    svgElement.setAttribute("height", (size / 0.8).toString() + "mm");
  }

  // Whenever the shape size changes, update the display and restart loop
  shapeSizeSlider.addEventListener("input", () => showRedCircle());
  showRedCircle();

  function updateSliderTitle(slider: HTMLInputElement, sliderLabel: HTMLElement, localizationKey: string, unit: string): void {
    sliderLabel.textContent = localize(localizationKey) + ` ${(slider.value)} ${unit}`;
  }

  shapeSizeSlider.addEventListener("input", () => updateSliderTitle(shapeSizeSlider, shapeSizeSliderLabel, "shapeSizeSliderLabel", "mm"));
  shapesExposureTimeSlider.addEventListener("input", () => updateSliderTitle(shapesExposureTimeSlider, shapesExposureTimeSliderLabel, "exposureTimeLabel", "ms"));
  shapesExposureDelaySlider.addEventListener("input", () => updateSliderTitle(shapesExposureDelaySlider, shapesExposureDelaySliderLabel, "exposureDelayLabel", "ms"));

  // Call it once on page load, so it shows "50 mm" initially
  updateSliderTitle(shapeSizeSlider, shapeSizeSliderLabel, "shapeSizeSliderLabel", "mm");
  updateSliderTitle(shapesExposureTimeSlider, shapesExposureTimeSliderLabel, "exposureTimeLabel", "ms");
  updateSliderTitle(shapesExposureDelaySlider, shapesExposureDelaySliderLabel, "exposureDelayLabel", "ms");

  /********************************************/
  /* 2. WORDS                                 */
  /********************************************/
  const wordSizeSlider = document.getElementById("word-size-slider") as HTMLInputElement;
  const wordsExposureTimeSlider = document.getElementById("words-exposure-time-slider") as HTMLInputElement;
  const wordsExposureDelaySlider = document.getElementById("words-exposure-delay-slider") as HTMLInputElement;
  const wordSizeSliderLabel = document.getElementById("word-size-slider-label") as HTMLElement;
  const wordsExposureTimeSliderLabel = document.getElementById("words-exposure-time-slider-label") as HTMLElement;
  const wordsExposureDelaySliderLabel = document.getElementById("words-exposure-delay-slider-label") as HTMLElement;
  const wordPreviewWord = document.getElementById("word-preview-word") as HTMLElement;

  wordSizeSlider.addEventListener("input", () => {
    updateSliderTitle(wordSizeSlider, wordSizeSliderLabel, "wordSizeSliderLabel", "mm");
    wordPreviewWord.style.fontSize = wordSizeSlider.value + "mm";
  });
  wordsExposureTimeSlider.addEventListener("input", () => updateSliderTitle(wordsExposureTimeSlider, wordsExposureTimeSliderLabel, "exposureTimeLabel", "ms"));
  wordsExposureDelaySlider.addEventListener("input", () => updateSliderTitle(wordsExposureDelaySlider, wordsExposureDelaySliderLabel, "exposureDelayLabel", "ms"));

  // Call it once on page load, so it shows "50 mm" initially
  updateSliderTitle(wordSizeSlider, wordSizeSliderLabel, "wordSizeSliderLabel", "mm");
  updateSliderTitle(wordsExposureTimeSlider, wordsExposureTimeSliderLabel, "exposureTimeLabel", "ms");
  updateSliderTitle(wordsExposureDelaySlider, wordsExposureDelaySliderLabel, "exposureDelayLabel", "ms");

  /********************************************/
  /* 3. Syllables                             */
  /********************************************/
  const syllableSizeSlider = document.getElementById("syllable-size-slider") as HTMLInputElement;
  const syllablesExposureTimeSlider = document.getElementById("syllables-exposure-time-slider") as HTMLInputElement;
  const syllablesExposureDelaySlider = document.getElementById("syllables-exposure-delay-slider") as HTMLInputElement;
  const syllableSizeSliderLabel = document.getElementById("syllable-size-slider-label") as HTMLElement;
  const syllablesExposureTimeSliderLabel = document.getElementById("syllables-exposure-time-slider-label") as HTMLElement;
  const syllablesExposureDelaySliderLabel = document.getElementById("syllables-exposure-delay-slider-label") as HTMLElement;
  const syllablePreviewSyllable = document.getElementById("syllable-preview-syllable") as HTMLElement;

  syllableSizeSlider.addEventListener("input", () => {
    updateSliderTitle(syllableSizeSlider, syllableSizeSliderLabel, "syllableSizeSliderLabel", "mm");
    syllablePreviewSyllable.style.fontSize = syllableSizeSlider.value + "mm";
  });
  syllablesExposureTimeSlider.addEventListener("input", () => updateSliderTitle(syllablesExposureTimeSlider, syllablesExposureTimeSliderLabel, "exposureTimeLabel", "ms"));
  syllablesExposureDelaySlider.addEventListener("input", () => updateSliderTitle(syllablesExposureDelaySlider, syllablesExposureDelaySliderLabel, "exposureDelayLabel", "ms"));

  // Call it once on page load, so it shows "50 mm" initially
  updateSliderTitle(syllableSizeSlider, syllableSizeSliderLabel, "syllableSizeSliderLabel", "mm");
  updateSliderTitle(syllablesExposureTimeSlider, syllablesExposureTimeSliderLabel, "exposureTimeLabel", "ms");
  updateSliderTitle(syllablesExposureDelaySlider, syllablesExposureDelaySliderLabel, "exposureDelayLabel", "ms");


}
