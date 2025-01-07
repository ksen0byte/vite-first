import {localize} from "./ui.ts";
import noUiSlider, {target} from 'nouislider';
import 'nouislider/dist/nouislider.css';
import {SliderConfig, subsectionsConfig} from "./config/settings-screen-config.ts";

export function setupSettingsScreen(containerId: string): void {
  const container: HTMLElement = document.getElementById(containerId)!;

  setupSubsectionToggles(
    [
      container.querySelector("#shapes-subsection")!,
      container.querySelector("#words-subsection")!,
      container.querySelector("#syllables-subsection")!
    ]
  );

  setupGeometricShapeSection();
  setupWordsSection();
  setupSyllablesSection();
}


const setupSubsectionToggles = (subsections: HTMLElement[]) => {
  subsections.forEach(subSection => {
    const header = subSection.querySelector(".subsection-header") as HTMLElement;
    header.addEventListener("click", () => {
      // Collapse all
      subsections.forEach(s => s.classList.remove("expanded"));
      // Mark chosen and expand
      subSection.classList.add("expanded");
    });
  });
}

const setupSlider = (
  sliderConfig: SliderConfig,
  idPrefix: string = "",
  onUpdate: (size: number, secondValue?: number) => void = () => {
  }
) => {
  const slider = document.getElementById(idPrefix + sliderConfig.id)! as target;
  const label = document.getElementById(idPrefix + sliderConfig.label.id)! as target;

  noUiSlider.create(slider, sliderConfig.options);
  slider.noUiSlider!.on("update", (values, _) => {
    const firstValue = Number(values[0]);
    const secondValue = values[1] !== undefined ? Number(values[1]) : undefined;
    if (secondValue !== undefined) {
      label.textContent = `${localize(sliderConfig.label.localizationKey)}: ${firstValue}-${secondValue} ${sliderConfig.label.unit}`;
      onUpdate(firstValue);
    } else {
      label.textContent = `${localize(sliderConfig.label.localizationKey)}: ${firstValue} ${sliderConfig.label.unit}`;
      onUpdate(firstValue, secondValue);
    }
  });

}

const setupGeometricShapeSection = () => {
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

  const sectionPrefix = "shapes-";
  setupSlider(subsectionsConfig.shape.sizeSlider, "", (size) => showRedCircle(size));
  setupSlider(subsectionsConfig.general.exposureTimeSlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.exposureDelaySlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.stimulusCountSlider, sectionPrefix);
}

const setupWordsSection = () => {
  const setWordSize = (size: number) => document.getElementById("word-preview-word")!.style.fontSize = size + "mm"

  const sectionPrefix = "words-";
  setupSlider(subsectionsConfig.word.sizeSlider, "", (size) => setWordSize(size));
  setupSlider(subsectionsConfig.general.exposureTimeSlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.exposureDelaySlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.stimulusCountSlider, sectionPrefix);
}

const setupSyllablesSection = () => {
  const setSyllableSize = (size: number) => document.getElementById("syllable-preview-syllable")!.style.fontSize = size + "mm"

  const sectionPrefix = "syllables-";
  setupSlider(subsectionsConfig.syllable.sizeSlider, "", (size) => setSyllableSize(size));
  setupSlider(subsectionsConfig.general.exposureTimeSlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.exposureDelaySlider, sectionPrefix);
  setupSlider(subsectionsConfig.general.stimulusCountSlider, sectionPrefix);
}
