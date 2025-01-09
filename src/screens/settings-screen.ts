import noUiSlider, {target} from 'nouislider';
import 'nouislider/dist/nouislider.css';
import {inputsConfig, SliderConfig, subsectionsConfig, TestSettings} from "../config/settings-screen-config.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {getSliderValue} from "../util/util.ts";
import {setupTestTypeSelectionScreen} from "./test-type-selection-screen.ts";
import {setupFooter} from "../components/footer.ts";
import {setupHeader} from "../components/header.ts";

function settingsScreenHTML() {
  return `
        <main class="flex-grow container mx-auto px-4 py-4 space-y-4" id="main">
          <!-- 1. Personal Data Block -->
          <div class="card bg-base-100 shadow-md">
              <div class="card-body">
                  <h2 class="card-title" data-localize="personalDataTitle">Personal Data</h2>
                  <div class="flex space-x-2">
                      <label class="flex flex-col form-control max-w-xs">
                          <div class="label">
                              <span class="label-text" data-localize="surnameLabel">Surname:</span>
                          </div>
                          <input class="input input-bordered w-full max-w-xs" type="text" id="surname-input"
                                 placeholder="Doe" inputmode="text" onkeydown="return /\\D/.test(event.key)"/>
                      </label>
                      <label class="flex flex-col form-control max-w-xs">
                          <div class="label">
                              <span class="label-text" data-localize="nameLabel">Name:</span>
                          </div>
                          <input class="input input-bordered w-full max-w-xs" type="text" id="name-input"
                                 placeholder="John" inputmode="text" onkeydown="return /\\D/.test(event.key)" />
                      </label>
                      <label class="flex flex-col form-control max-w-xs">
                          <div class="label">
                              <span class="label-text" data-localize="ageLabel">Age:</span>
                          </div>
                          <input class="input input-bordered max-w-20" type="text" id="age-input"
                                 placeholder="Age" inputmode="numeric" />
                      </label>
                      <label class="flex flex-col form-control max-w-xs">
                          <div class="label">
                              <span class="label-text" data-localize="genderLabel">Gender:</span>
                          </div>
                          <select class="select select-bordered" id="gender-select">
                              <option value="male" data-localize="male"></option>
                              <option value="female" data-localize="female"></option>
                          </select>
                      </label>
                  </div>
              </div>
          </div>
  
          <!-- 2. Stimulus Type (Collapsible sections) -->
          <div class="card bg-base-100 shadow-md">
              <div class="card-body">
                  <h2 class="card-title" data-localize="chooseTestMode"></h2>
  
                  <!-- Geometric Shapes Subsection -->
                  <div
                          tabIndex="0"
                          class="collapse collapse-plus border border-base-300 bg-base-100 rounded-box"
                          id="shapes-subsection"
                  >
                      <!-- Radio input to control the collapse -->
                      <input type="radio" name="stimulus-type-accordion" checked="checked" class="peer" data-subsection="shapes"/>
  
                      <!-- Subsection Title -->
                      <div
                              class="collapse-title font-medium subsection-header peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-t-4 peer-checked:border-accent rounded-t-box"
                              data-localize="shapesOption"
                      >
                          Geometrical Shapes
                      </div>
  
                      <div class="collapse-content expanded-view peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-b-4 peer-checked:border-accent rounded-b-box">
                          <!-- 2-column layout on medium+ screens -->
                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 gap-y-4 lg:gap-6 items-start m-2">
  
                              <!-- Left Column: Shape Preview -->
                              <div class="col-span-1 flex items-center lg:items-start justify-center lg:justify-start">
                                  <div id="shape-preview"
                                       class="subsection-preview bg-black w-[9cm] h-[9cm] flex items-center justify-center">
                                      <!-- Example placeholder or <svg> -->
                                  </div>
                              </div>
  
                              <!-- Right Column: Label, Shape Size Slider, Exposure Time Slider, Exposure Delay Slider, Stimuli Count Slider -->
                              <div class="col-span-2 flex flex-col justify-evenly space-y-4 w-full h-full">
                                  <!-- Shape Size Slider -->
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="shape-size-slider-label" class="text-sm font-medium"
                                             data-localize="shapeSizeSliderLabel">
                                          Shape Size:
                                      </label>
                                      <div id="shape-size-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="shapes-exposure-time-label" class="text-sm font-medium"
                                             data-localize="exposureTimeLabel">
                                          Exposure Time:
                                      </label>
                                      <div id="shapes-exposure-time-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="shapes-exposure-delay-label" class="text-sm font-medium"
                                             data-localize="exposureDelayLabel">
                                          Exposure Delay:
                                      </label>
                                      <div id="shapes-exposure-delay-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="shapes-stimulus-count-label" class="text-sm font-medium"
                                             data-localize="stimulusCountLabel">
                                          Number of Stimuli:
                                      </label>
                                      <div id="shapes-stimulus-count-slider"></div>
                                  </div>
  
                              </div>
                          </div>
                      </div>
                  </div>
  
                  <!-- Words Subsection -->
                  <div
                          tabIndex="0"
                          class="collapse collapse-plus border border-base-300 bg-base-100 rounded-box"
                          id="words-subsection"
                  >
                      <!-- Radio input to control the collapse -->
                      <input type="radio" name="stimulus-type-accordion" class="peer" data-subsection="words"/>
                      <!-- Subsection Title -->
                      <div class="collapse-title font-medium subsection-header peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-t-4 peer-checked:border-accent rounded-t-box"
                           data-localize="wordsOption"
                      >
                          Words:
                      </div>
                      <div class="collapse-content expanded-view peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-b-4 peer-checked:border-accent rounded-b-box">
                          <!-- 2-column layout on medium+ screens -->
                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 gap-y-4 lg:gap-6 items-start m-2">
  
                              <!-- Left Column: Word Preview -->
                              <div class="col-span-1 flex items-center lg:items-start justify-center lg:justify-start">
                                  <div id="word-preview"
                                       class="col-span-1 subsection-preview bg-black w-[9cm] h-[9cm] flex items-center justify-center">
                                  <span id="word-preview-word" class="font-mono text-[2cm] leading-none text-blue-600"
                                        data-localize="wordPreviewWord">human</span>
                                  </div>
                              </div>
  
                              <!-- Right Column: Label, Word Size Slider, Exposure Time Slider, Exposure Delay Slider -->
                              <div class="col-span-2 flex flex-col justify-evenly space-y-4 w-full h-full">
                                  <!-- Word Size Slider -->
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="word-size-slider-label" class="text-sm font-medium"
                                             data-localize="wordSizeSliderLabel">
                                          Shape Size:
                                      </label>
                                      <div id="word-size-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="words-exposure-time-label" class="text-sm font-medium"
                                             data-localize="exposureTimeLabel">
                                          Exposure Time:
                                      </label>
                                      <div id="words-exposure-time-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="words-exposure-delay-label" class="text-sm font-medium"
                                             data-localize="exposureDelayLabel">
                                          Exposure Delay:
                                      </label>
                                      <div id="words-exposure-delay-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="words-stimulus-count-label" class="text-sm font-medium"
                                             data-localize="stimulusCountLabel">
                                          Number of Stimuli:
                                      </label>
                                      <div id="words-stimulus-count-slider"></div>
                                  </div>
  
  
                              </div>
                          </div>
                      </div>
                  </div>
  
                  <!-- Syllables Subsection -->
                  <div
                          tabIndex="0"
                          class="collapse collapse-plus border border-base-300 bg-base-100 rounded-box"
                          id="syllables-subsection"
                  >
                      <input type="radio" name="stimulus-type-accordion" class="peer" data-subsection="syllables"/>
                      <!-- Subsection Title -->
                      <div class="collapse-title font-medium subsection-header peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-t-4 peer-checked:border-accent rounded-t-box"
                           data-localize="syllablesOption"
                      >
                          Random Syllables:
                      </div>
                      <div class="collapse-content expanded-view peer-checked:bg-base-200 peer-checked:border-x-4 peer-checked:border-b-4 peer-checked:border-accent rounded-b-box">
                          <!-- 2-column layout on medium+ screens -->
                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 gap-y-4 lg:gap-6 items-start m-2">
  
                              <!-- Left Column: Syllable Preview -->
                              <div class="col-span-1 flex items-center lg:items-start justify-center lg:justify-start">
                                  <div id="syllable-preview"
                                       class="col-span-1 subsection-preview bg-black w-[9cm] h-[9cm] flex items-center justify-center">
                                  <span id="syllable-preview-syllable"
                                        class="font-mono text-[2cm] leading-none text-red-600"
                                        data-localize="syllablePreviewSyllable">Mo</span>
                                  </div>
                              </div>
  
                              <!-- Right Column: Label, Syllable Size Slider, Exposure Time Slider, Exposure Delay Slider -->
                              <div class="col-span-2 flex flex-col justify-evenly space-y-4 w-full h-full">
                                  <!-- Syllable Size Slider -->
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="syllable-size-slider-label" class="text-sm font-medium"
                                             data-localize="syllableSizeSliderLabel">
                                          Shape Size:
                                      </label>
                                      <div id="syllable-size-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="syllables-exposure-time-label" class="text-sm font-medium"
                                             data-localize="exposureTimeLabel">
                                          Exposure Time:
                                      </label>
                                      <div id="syllables-exposure-time-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="syllables-exposure-delay-label" class="text-sm font-medium"
                                             data-localize="exposureDelayLabel">
                                          Exposure Delay:
                                      </label>
                                      <div id="syllables-exposure-delay-slider"></div>
                                  </div>
                                  <div class="flex flex-col space-y-2 w-full">
                                      <label id="syllables-stimulus-count-label" class="text-sm font-medium"
                                             data-localize="stimulusCountLabel">
                                          Number of Stimuli:
                                      </label>
                                      <div id="syllables-stimulus-count-slider"></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </main>`;
}

export function setupSettingsScreen(appContainer: HTMLElement): void {

  appContainer.innerHTML = settingsScreenHTML();
  setupHeader(appContainer);

  setupSubsectionToggles(
    [
      appContainer.querySelector("#shapes-subsection")!,
      appContainer.querySelector("#words-subsection")!,
      appContainer.querySelector("#syllables-subsection")!
    ]
  );
  setupGeometricShapeSection();
  setupWordsSection();
  setupSyllablesSection();

  // footer
  setupFooter(appContainer, "settingsScreen");
  updateLanguageUI();
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


export const setupStartButtonCallback = (appContainer: HTMLElement, startTestButton: HTMLElement) => {
  startTestButton.addEventListener("click", () => {

    // 1. Check test mode selection
    const testMode = document.querySelector<HTMLInputElement>('input[name="stimulus-type-accordion"]:checked')!.dataset.subsection! as "shapes" | "words" | "syllables";

    // 2. Do the validation
    const firstName = (document.getElementById(inputsConfig.nameInputId) as HTMLInputElement).value;
    const lastName = (document.getElementById(inputsConfig.surnameInputId) as HTMLInputElement).value;
    const gender = (document.getElementById(inputsConfig.genderSelectId) as HTMLSelectElement).value as "male" | "female";
    const age = Number((document.getElementById(inputsConfig.ageInputId) as HTMLSelectElement).value);
    const stimulusSize = getSliderValue(inputsConfig.sizeSliderId[testMode]) as number;
    const exposureTime = getSliderValue(inputsConfig.exposureTimeSliderId[testMode]) as number;
    const exposureDelay = getSliderValue(inputsConfig.exposureDelaySliderId[testMode]) as [number, number];
    const stimulusCount = getSliderValue(inputsConfig.stimulusCountSliderId[testMode]) as number;

    // 3. Gather parameters and log them
    const parameters: TestSettings = {
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      age: age,
      testMode: testMode,
      stimulusSize: stimulusSize,
      exposureTime: exposureTime,
      exposureDelay: exposureDelay,
      stimulusCount: stimulusCount,
    };

    console.log("Parameters:", parameters);

    // transition to test type selection screen
    setupTestTypeSelectionScreen(appContainer, parameters);

  });


}