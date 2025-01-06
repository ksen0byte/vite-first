import {localize} from "./ui.ts";
import noUiSlider, {Options, target} from 'nouislider';
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
  /* 0. SLIDERS                               */
  /********************************************/
  const intFormatter = {
    to: (value: number): string => Math.round(value).toString(),
    from: (value: string): number => parseInt(value, 10),
  };
  const exposureTimeSliderOptions: Options = {
    start: 700,
    step: 50,
    connect: "lower",
    range: {min: 500, max: 1000},
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  };
  const exposureDelaySliderOptions: Options = {
    start: [750, 1250],
    step: 50,
    connect: true,
    range: {min: 500, max: 1500},
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  };
  const stimulusCountSliderOptions : Options= {
    start: 50,
    step: 2,
    connect: "lower",
    range: {min: 30, max: 100},
    // pips: { mode: PipsMode.Positions, values: [0, 25, 50, 75, 100], density: 5 },
    format: intFormatter,
  };

  /********************************************/
  /* 1. SHAPES                                */
  /********************************************/
  const redCircleShape = {
    name: "Red Circle",
    svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="40" fill="red"/></svg>`,
  };

  function showRedCircle(size: number) {
    const shapePreview = document.getElementById("shape-preview") as HTMLElement;

    // Insert the chosen shape
    shapePreview.innerHTML = redCircleShape.svg;
    // Optionally scale the shape if needed:
    const svgElement = shapePreview.querySelector("svg")!;
    svgElement.setAttribute("width", (size / 0.8).toString() + "mm");
    svgElement.setAttribute("height", (size / 0.8).toString() + "mm");
  }

  const shapeSizeSlider = document.getElementById("shape-size-slider")! as target;
  const shapesExposureTimeSlider = document.getElementById("shapes-exposure-time-slider")! as target;
  const shapesExposureDelaySlider = document.getElementById("shapes-exposure-delay-slider")! as target;
  const shapesStimulusCountSlider = document.getElementById("shapes-stimulus-count-slider")! as target;

  noUiSlider.create(shapeSizeSlider, {
    start: 50,
    step: 10,
    connect: "lower",
    range: {min: 20, max: 70},
    // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
    format: intFormatter,
  });

  noUiSlider.create(shapesExposureTimeSlider, exposureTimeSliderOptions);
  noUiSlider.create(shapesExposureDelaySlider, exposureDelaySliderOptions);
  noUiSlider.create(shapesStimulusCountSlider, stimulusCountSliderOptions);

  shapeSizeSlider.noUiSlider!.on("update", (values, _) => {
    const sizeLabel = document.getElementById("shapes-size-slider-label")!;
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

  /********************************************/
  /* 2. WORDS                                 */
  /********************************************/
  const wordSizeSlider = document.getElementById("word-size-slider")! as target;
  const wordsExposureTimeSlider = document.getElementById("words-exposure-time-slider")! as target;
  const wordsExposureDelaySlider = document.getElementById("words-exposure-delay-slider")! as target;
  const wordsStimulusCountSlider = document.getElementById("words-stimulus-count-slider")! as target;
  const wordPreviewWord = document.getElementById("word-preview-word") as HTMLElement;

  noUiSlider.create(wordSizeSlider, {
    start: 20,
    step: 1,
    connect: "lower",
    range: {min: 15, max: 30},
    // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
    format: intFormatter,
  });

  noUiSlider.create(wordsExposureTimeSlider, exposureTimeSliderOptions);
  noUiSlider.create(wordsExposureDelaySlider, exposureDelaySliderOptions);
  noUiSlider.create(wordsStimulusCountSlider, stimulusCountSliderOptions);

  wordSizeSlider.noUiSlider!.on("update", (values, _) => {
    const sizeLabel = document.getElementById("words-size-slider-label")!;
    let size = Number(values[0]);
    sizeLabel.textContent = `${localize("wordSizeSliderLabel")}: ${size} mm`;
    wordPreviewWord.style.fontSize = size + "mm";
  });

  wordsExposureTimeSlider.noUiSlider!.on("update", (values, _) => {
    const timeLabel = document.getElementById("words-exposure-time-label")!;
    timeLabel.textContent = `${localize("exposureTimeLabel")}: ${values[0]} ms`;
  });

  wordsExposureDelaySlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("words-exposure-delay-label")!;
    delayLabel.textContent = `${localize("exposureDelayLabel")}: ${values[0]} - ${values[1]} ms`;
  });

  wordsStimulusCountSlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("words-stimulus-count-label")!;
    delayLabel.textContent = `${localize("stimulusCountLabel")}: ${values[0]} words`;
  });


  /********************************************/
  /* 3. Syllables                             */
  /********************************************/
  const syllableSizeSlider = document.getElementById("syllable-size-slider")! as target;
  const syllablesExposureTimeSlider = document.getElementById("syllables-exposure-time-slider")! as target;
  const syllablesExposureDelaySlider = document.getElementById("syllables-exposure-delay-slider")! as target;
  const syllablesStimulusCountSlider = document.getElementById("syllables-stimulus-count-slider")! as target;
  const syllablePreviewSyllable = document.getElementById("syllable-preview-syllable") as HTMLElement;

  noUiSlider.create(syllableSizeSlider, {
    start: 20,
    step: 1,
    connect: "lower",
    range: {min: 15, max: 30},
    // pips: { mode: PipsMode.Values, values: [20, 30, 40, 50, 60, 70], density: 10 },
    format: intFormatter,
  });

  noUiSlider.create(syllablesExposureTimeSlider, exposureTimeSliderOptions);
  noUiSlider.create(syllablesExposureDelaySlider, exposureDelaySliderOptions);
  noUiSlider.create(syllablesStimulusCountSlider, stimulusCountSliderOptions);

  syllableSizeSlider.noUiSlider!.on("update", (values, _) => {
    const sizeLabel = document.getElementById("syllables-size-slider-label")!;
    let size = Number(values[0]);
    sizeLabel.textContent = `${localize("syllableSizeSliderLabel")}: ${size} mm`;
    syllablePreviewSyllable.style.fontSize = size + "mm";
  });

  syllablesExposureTimeSlider.noUiSlider!.on("update", (values, _) => {
    const timeLabel = document.getElementById("syllables-exposure-time-label")!;
    timeLabel.textContent = `${localize("exposureTimeLabel")}: ${values[0]} ms`;
  });

  syllablesExposureDelaySlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("syllables-exposure-delay-label")!;
    delayLabel.textContent = `${localize("exposureDelayLabel")}: ${values[0]} - ${values[1]} ms`;
  });

  syllablesStimulusCountSlider.noUiSlider!.on("update", (values, _) => {
    const delayLabel = document.getElementById("syllables-stimulus-count-label")!;
    delayLabel.textContent = `${localize("stimulusCountLabel")}: ${values[0]} syllables`;
  });
}
