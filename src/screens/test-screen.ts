import {ExposureDelay, StimulusSize, TestSettings} from "../config/settings-screen-config.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {logWithTime} from "../util/util.ts";

export function setupTestScreen(appContainer: HTMLElement, testSettings: TestSettings) {
  appContainer.innerHTML = testScreenHTML(testSettings);

  const stimulusContainer = document.getElementById("test-stimulus-container")!;
  const stimuliCounterContainer = document.getElementById("stimuli-counter")!;

  const reactionTimes: Map<number, number> = new Map(); // Map to store reaction times for each stimulus

  appContainer.style.cursor = "none"; // Initial cursor setup

  showCountDown(
    stimulusContainer,
    ["3", "2", "1", localize("testScreenTestStart")],
    1000,
    () => runTest(testSettings, stimulusContainer, stimuliCounterContainer, reactionTimes, appContainer)
  );

  updateLanguageUI();
}

function testScreenHTML(testSettings: TestSettings): string {
  return `
    <div id="test-screen" class="flex flex-col flex-grow bg-black text-white">
      <!-- Main test content -->
      <div id="test-stimulus-container" class="flex items-center justify-center flex-grow text-8xl font-bold"></div>

      <!-- Counter area -->
      <div class="flex-grow-0 flex justify-end items-end p-4">
        <div id="stimuli-counter" class="text-4xl font-mono text-gray-500"> 0/${testSettings.stimulusCount} </div>
      </div>
    </div>
  `;
}

function showCountDown(container: HTMLElement, countDownValues: string[], interval: number, callAfter: () => void) {
  let currentIndex = 0;

  const updateCountDown = () => {
    if (currentIndex < countDownValues.length) {
      container.textContent = `${countDownValues[currentIndex]}`;
      currentIndex++;
      setTimeout(updateCountDown, interval);
    } else {
      callAfter();
    }
  };

  updateCountDown();
}

function getRandomExposureDelay(exposureDelay: ExposureDelay): number {
  const min = Math.ceil(exposureDelay[0] / 50) * 50; // Round min to the nearest 50
  const max = Math.floor(exposureDelay[1] / 50) * 50; // Round max to the nearest 50
  const number = Math.floor(Math.random() * ((max - min) / 50 + 1)) * 50 + min;
  console.log("Delay:", number);
  return number;
}

const runTest = (
  testSettings: TestSettings,
  stimulusContainer: HTMLElement,
  stimuliCounterContainer: HTMLElement,
  reactionTimes: Map<number, number>,
  appContainer: HTMLElement
) => {
  const totalStimuli = testSettings.stimulusCount;
  let currentStimulus = 0;
  let stimulusStartTime: number | null = null; // Track the start time of the current stimulus


  const handleClick = () => {
    if (stimulusStartTime !== null) {
      const reactionTime = Date.now() - stimulusStartTime;
      reactionTimes.set(currentStimulus, reactionTime);
      logWithTime(`Reaction time for stimulus #${currentStimulus}: ${reactionTime}ms`);
      stimulusStartTime = null; // Prevent multiple clicks being counted
    }
  };

  appContainer.addEventListener("click", handleClick);

  const displayNextStimulus = () => {
    if (currentStimulus >= totalStimuli) {
      appContainer.style.cursor = "default"; // Reset cursor after the test
      stimulusContainer.innerHTML = `Test Complete`;
      appContainer.removeEventListener("click", handleClick);
      console.log("Reaction times:", reactionTimes); // Log the reaction times map
      return;
    }

    currentStimulus++;
    setStimuliCounter(stimuliCounterContainer, currentStimulus, totalStimuli);
    showStimulus(stimulusContainer, currentStimulus, testSettings.stimulusSize);

    stimulusStartTime = Date.now(); // Start tracking reaction time

    setTimeout(() => {
      clearStimulusContainer(stimulusContainer);
      setTimeout(displayNextStimulus, getRandomExposureDelay(testSettings.exposureDelay));
    }, testSettings.exposureTime);
  };

  appContainer.style.cursor = "crosshair"; // Change cursor during the test
  clearStimulusContainer(stimulusContainer);
  setTimeout(displayNextStimulus, getRandomExposureDelay(testSettings.exposureDelay));
};

function setStimuliCounter(stimuliCounterContainer: HTMLElement, currentCount: number, totalCount: number) {
  stimuliCounterContainer.textContent = `${currentCount}/${totalCount}`;
}

function clearStimulusContainer(container: HTMLElement) {
  logWithTime(`Hiding stimulus`);
  container.innerHTML = ``;
}

type ShapeColor = "red" | "green" | "blue";
type ShapeType = "circle" | "triangle" | "square";

function getShapeSvg(size: number, color: ShapeColor, shape: ShapeType) {
  switch (shape) {
    case "circle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="50" fill="${color}"/></svg>`;
    case "square":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="100" height="100" fill="${color}"/></svg>`;
    case "triangle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polygon points="50,0 100,100 0,100" fill="${color}"/></svg>`;
    default:
      throw new Error(`Unsupported shape: ${shape}`);
  }
}

function getRandomShape(size: number, color?: ShapeColor, shape?: ShapeType): string {
  const colors: ShapeColor[] = ["red", "blue", "green"];
  const shapes: ShapeType[] = ["circle", "triangle", "square"];
  const randomColor = color ?? colors[Math.floor(Math.random() * colors.length)];
  const randomShape = shape ?? shapes[Math.floor(Math.random() * shapes.length)];
  return getShapeSvg(size, randomColor, randomShape);
}

function showStimulus(container: HTMLElement, stimulusNumber: number, stimulusSize: StimulusSize) {
  logWithTime(`Showing stimulus #${stimulusNumber}, size: ${stimulusSize}`);
  container.innerHTML = getRandomShape(stimulusSize);
}
