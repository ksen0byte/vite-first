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

  // shapes sliders
  const shapeSizeSlider = document.getElementById("shape-size-slider") as HTMLInputElement;
  const shapesExposureTimeSlider = document.getElementById("shapes-exposure-time-slider") as HTMLInputElement;
  const shapesExposureDelaySlider = document.getElementById("shapes-exposure-delay-slider") as HTMLInputElement;
  const shapeSizeSliderLabel = document.getElementById("shape-size-slider-label") as HTMLElement;
  const shapesExposureTimeSliderLabel = document.getElementById("shapes-exposure-time-slider-label") as HTMLElement;
  const shapesExposureDelaySliderLabel = document.getElementById("shapes-exposure-delay-slider-label") as HTMLElement;

  function updateSliderTitle(slider: HTMLInputElement, sliderLabel:HTMLElement, localizationKey:string, unit:string): void {
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
  /* 1. SHAPES & RANDOM LOGIC SETUP           */
  /********************************************/
  const shapes = [
    {
      name: "Red Circle",
      svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="40" fill="red"/></svg>`,
    },
    {
      name: "Green Triangle",
      svg: `<svg ><polygon points="50,10 10,90 90,90" fill="green"/></svg>`,
    },
    {
      name: "Blue Square",
      svg: `<svg ><rect x="10" y="10" width="80" height="80" fill="blue"/></svg>`,
    },
  ];

  /********************************************/
  /* 2. ELEMENT REFERENCES                    */
  /********************************************/
  const shapePreview = document.getElementById("shape-preview") as HTMLElement;

  /********************************************/
  /* 3. HELPER FUNCTIONS                      */
  /********************************************/
  function showRandomShapeOnce() {
    // 1. Pick random shape
    // const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomShape = shapes[0];

    // 2. Get user-chosen shape size
    const size = parseInt(shapeSizeSlider.value, 10);

    // 3. Insert the chosen shape
    shapePreview.innerHTML = randomShape.svg;
    // Optionally scale the shape if needed:
    const svgElement = shapePreview.querySelector("svg")!;
    svgElement.setAttribute("width", (size / 0.8).toString() + "mm");
    svgElement.setAttribute("height", (size / 0.8).toString() + "mm");
  }

  /********************************************/
  /* 4. EVENT LISTENERS                       */
  /********************************************/
  // Whenever the shape size changes, update the display and restart loop
  shapeSizeSlider.addEventListener("input", () => {
    showRandomShapeOnce();
  });
  showRandomShapeOnce();


}
