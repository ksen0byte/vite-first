import {localize} from "./ui.ts";
import noUiSlider, {target} from 'nouislider';
import 'nouislider/dist/nouislider.css';

export function setupSettingsScreen(containerId: string): void {
  const container = document.getElementById(containerId)!;

  // Subsection toggle
  const shapesSubsection = container.querySelector("#shapes-subsection") as HTMLElement;
  const wordsSubsection = container.querySelector("#words-subsection") as HTMLElement;
  const syllablesSubsection = container.querySelector("#syllables-subsection") as HTMLElement;

  [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(subSection => {
    const header = subSection.querySelector(".subsection-header") as HTMLElement;
    header.addEventListener("click", () => {
      // Collapse all
      [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(s => s.classList.remove("expanded"));

      // Mark chosen and expand
      subSection.classList.add("expanded");
    });
  });

  /********************************************/
  /* 1. SHAPES                                */
  /********************************************/
  const redCircleShape = {
    name: "Red Circle",
    svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="40" fill="red"/></svg>`,
  };

  function showRedCircle(size:number) {
    const shapePreview = document.getElementById("shape-preview") as HTMLElement;

    // Insert the chosen shape
    shapePreview.innerHTML = redCircleShape.svg;
    // Optionally scale the shape if needed:
    const svgElement = shapePreview.querySelector("svg")!;
    svgElement.setAttribute("width", (size / 0.8).toString() + "mm");
    svgElement.setAttribute("height", (size / 0.8).toString() + "mm");
  }

  function updateSliderTitle(slider: HTMLInputElement, sliderLabel: HTMLElement, localizationKey: string, unit: string): void {
    sliderLabel.textContent = localize(localizationKey) + ` ${(slider.value)} ${unit}`;
  }

  /********************************************/
  /* 2. WORDS                                 */
  /********************************************/
  const wordSizeSlider = document.getElementById("word-size-slider") as HTMLInputElement;
  const wordSizeSliderLabel = document.getElementById("word-size-slider-label") as HTMLElement;
  const wordPreviewWord = document.getElementById("word-preview-word") as HTMLElement;

  wordSizeSlider.addEventListener("input", () => {
    updateSliderTitle(wordSizeSlider, wordSizeSliderLabel, "wordSizeSliderLabel", "mm");
    wordPreviewWord.style.fontSize = wordSizeSlider.value + "mm";
  });

  // Call it once on page load, so it shows "50 mm" initially
  updateSliderTitle(wordSizeSlider, wordSizeSliderLabel, "wordSizeSliderLabel", "mm");

  /********************************************/
  /* 3. Syllables                             */
  /********************************************/
  const syllableSizeSlider = document.getElementById("syllable-size-slider") as HTMLInputElement;
  const syllableSizeSliderLabel = document.getElementById("syllable-size-slider-label") as HTMLElement;
  const syllablePreviewSyllable = document.getElementById("syllable-preview-syllable") as HTMLElement;

  syllableSizeSlider.addEventListener("input", () => {
    updateSliderTitle(syllableSizeSlider, syllableSizeSliderLabel, "syllableSizeSliderLabel", "mm");
    syllablePreviewSyllable.style.fontSize = syllableSizeSlider.value + "mm";
  });

  // Call it once on page load, so it shows "50 mm" initially
  updateSliderTitle(syllableSizeSlider, syllableSizeSliderLabel, "syllableSizeSliderLabel", "mm");


  // Double slider
  // const shapesExposureDelayDoubleSlider = document.getElementById("shapes-exposure-delay-double-slider")! as HTMLElement;
  // noUiSlider.create(shapesExposureDelayDoubleSlider, {
  //   start: [750, 1250],
  //   step: 50,
  //   connect: true,
  //   range: {
  //     min: 500,
  //     max: 1500,
  //   },
  //   pips: {
  //     mode: PipsMode.Positions,
  //     values: [0, 25, 50, 75, 100],
  //     density: 20
  //   }
  // });

  // Find the container for the Geometrical Shapes subsection
  const shapeSizeSlider = document.getElementById("shape-size-slider")! as target;
  const shapesExposureTimeSlider = document.getElementById("shapes-exposure-time-slider")! as target;
  const shapesExposureDelaySlider = document.getElementById("shapes-exposure-delay-slider")! as target;
  const shapesStimulusCountSlider = document.getElementById("shapes-stimulus-count-slider")! as target;

  const intFormatter = {
    to: (value: number): string => Math.round(value).toString(),
    from: (value: string): number => parseInt(value, 10),
  };

  noUiSlider.create(shapeSizeSlider, {
    start: 50,
    step: 10,
    connect: "lower",
    range: { min: 20, max: 70 },
    // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
    format: intFormatter,
  });

  noUiSlider.create(shapesExposureTimeSlider, {
    start: 700,
    step: 50,
    connect: "lower",
    range: { min: 500, max: 1000 },
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  });

  noUiSlider.create(shapesExposureDelaySlider, {
    start: [750, 1250],
    step: 50,
    connect: true,
    range: { min: 500, max: 1500 },
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  });

  noUiSlider.create(shapesStimulusCountSlider, {
    start: 50,
    step: 2,
    connect: "lower",
    range: { min: 30, max: 100 },
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  });

  shapeSizeSlider.noUiSlider!.on("update", (values, _) => {
    const sizeLabel = document.getElementById("shape-size-slider-label")!;
    let size = Number(values[0]);
    sizeLabel.textContent = `${localize("shapeSizeSliderLabel")}: ${size} mm`;
    showRedCircle(size);
  });

  shapesExposureTimeSlider.noUiSlider!.on("update", (values, _) => {
    const timeLabel = document.getElementById("shapes-exposure-time-label")!;
    timeLabel.textContent = `${localize("exposureTimeLabel")}: ${values[0]} ms`;
  });

  shapesExposureDelaySlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("shapes-exposure-delay-label")!;
    delayLabel.textContent = `${localize("exposureDelayLabel")}: ${values[0]} - ${values[1]} ms`;
  });

  shapesStimulusCountSlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("shapes-stimulus-count-label")!;
    delayLabel.textContent = `${localize("stimulusCountLabel")}: ${values[0]} shapes`;
  });
}
