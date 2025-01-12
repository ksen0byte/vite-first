import { ExposureDelay, StimulusSize, TestSettings } from "../config/settings-screen-config.ts";
import { localize, updateLanguageUI } from "../localization/localization.ts";
import { logWithTime } from "../util/util.ts";

export function setupTestScreen(appContainer: HTMLElement, testSettings: TestSettings) {
  appContainer.innerHTML = testScreenHTML(testSettings);

  const stimulusContainer = document.getElementById("test-stimulus-container")!;
  const stimuliCounterContainer = document.getElementById("stimuli-counter")!;
  const retryButton = document.getElementById("retry-btn") as HTMLButtonElement;
  const timerDisplay = document.getElementById("timer-display")!;

  const reactionTimes: Map<number, number> = new Map(); // Store reaction times for each stimulus

  // Called to kick off the actual test logic (with countdown, etc.).
  function startTest() {
    showCountDown(
      stimulusContainer,
      ["3", "2", "1", localize("testScreenTestStart")],
      1000,
      () => runTest(
        testSettings,
        stimulusContainer,
        stimuliCounterContainer,
        timerDisplay,
        reactionTimes,
        appContainer
      )
    );
  }

  // Handle retry logic: Clear old data, then re-run countdown & test
  retryButton.addEventListener("click", () => {
    logWithTime("Retry button clicked. Restarting test...");

    // 1) Stop the timer
    stopTimer();
    // 2) Clear any pending timeouts from old test
    clearAllTimeouts();
    // 3) Clear old reaction data, etc.
    reactionTimes.clear();
    // 4) Clear stimuli counter
    resetStimuliCounter(stimuliCounterContainer, testSettings.stimulusCount);
    resetTimer(timerDisplay);
    // 5) Start fresh
    startTest();
  });

  // Start test upon first load
  startTest();

  // Update any language/UI strings
  updateLanguageUI();
}

/** --------------------------------------------------------------------------------
 *  HTML Layout, including timer display & retry button
 * -------------------------------------------------------------------------------- */
function testScreenHTML(testSettings: TestSettings): string {
  return `
    <div id="test-screen" class="flex flex-col flex-grow bg-black text-white">
      <!-- Top bar: retry button -->
      <div class="flex-grow-0 flex flex-row-reverse justify-between items-end p-4">
        <button id="retry-btn" class="btn btn-ghost">${localize("testScreenTestRetry")}</button>      
      </div>
      <!-- Main test content -->
      <div id="test-stimulus-container" class="flex items-center justify-center flex-grow text-8xl font-bold"></div>

      <!-- Bottom bar: timer (left), counter (right),  -->
      <div class="flex-grow-0 flex justify-between items-end p-4">
        <!-- Timer (bottom-left) -->
        <div id="timer-container">
          <div id="timer-display" class="text-3xl font-mono text-gray-400">0.000${localize("s")}</div>
        </div>

        <!-- Right side: counter + retry button -->
        <div class="flex items-center space-x-4">
          <div id="stimuli-counter" class="text-4xl font-mono text-gray-500">0/${testSettings.stimulusCount}</div>
        </div>
      </div>
    </div>
  `;
}

/** --------------------------------------------------------------------------------
 *  Countdown Display
 * -------------------------------------------------------------------------------- */
function showCountDown(
  container: HTMLElement,
  countDownValues: string[],
  interval: number,
  callAfter: () => void
) {
  let currentIndex = 0;

  const updateCountDown = () => {
    if (currentIndex < countDownValues.length) {
      container.textContent = `${countDownValues[currentIndex]}`;
      currentIndex++;
      scheduleTimeout(updateCountDown, interval);
    } else {
      callAfter();
    }
  };

  updateCountDown();
}

/** --------------------------------------------------------------------------------
 *  Timer Functions
 * -------------------------------------------------------------------------------- */
let timerInterval: number | null = null;
let timerStart: number | null = null;

/** Start (or restart) the timer. */
function startTimer(displayElement: HTMLElement) {
  // If there's already a timer running, stop it
  stopTimer();

  timerStart = Date.now();
  timerInterval = window.setInterval(() => {
    updateTimerDisplay(displayElement);
  }, 10); // update ~ every 10ms
}

/** Stop the current timer. */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/** Reset timer to 0, but keep it running (i.e. new start point). */
function resetTimer(displayElement: HTMLElement) {
  timerStart = Date.now();
  displayElement.textContent = `0.000${localize("s")}`;
}

/** Update the on-screen timer display based on the current timerStart. */
function updateTimerDisplay(displayElement: HTMLElement) {
  if (timerStart == null) {
    displayElement.textContent = `0.000${localize("s")}`;
    return;
  }
  const elapsedMs = Date.now() - timerStart;
  const elapsedSec = (elapsedMs/1000).toFixed(3);
  displayElement.textContent = `${elapsedSec}${localize("s")}`;
}

/** --------------------------------------------------------------------------------
 *  Main Test Logic
 * -------------------------------------------------------------------------------- */
function runTest(
  testSettings: TestSettings,
  stimulusContainer: HTMLElement,
  stimuliCounterContainer: HTMLElement,
  timerDisplay: HTMLElement,
  reactionTimes: Map<number, number>,
  appContainer: HTMLElement
) {
  const totalStimuli = testSettings.stimulusCount;
  let currentStimulus = 0;
  let stimulusStartTime: number | null = null;

  // Handler for click events (calculates reaction time & stops timer).
  const handleClick = () => {
    if (stimulusStartTime !== null) {
      const reactionTime = Date.now() - stimulusStartTime;
      reactionTimes.set(currentStimulus, reactionTime);
      logWithTime(`Reaction time for stimulus #${currentStimulus}: ${reactionTime}ms`);

      // Stop the timer because user clicked
      stopTimer();

      stimulusStartTime = null;
    }
  };

  // Attach click listener
  appContainer.addEventListener("click", handleClick);

  // Recursive function to display each stimulus in sequence
  const displayNextStimulus = () => {
    if (currentStimulus >= totalStimuli) {
      // Test done
      appContainer.style.cursor = "default";
      stimulusContainer.innerHTML = `Test Complete`;
      appContainer.removeEventListener("click", handleClick);
      stopTimer();
      console.log("Reaction times:", reactionTimes);
      return;
    }

    currentStimulus++;
    setStimuliCounter(stimuliCounterContainer, currentStimulus, totalStimuli);

    // Show the stimulus
    showStimulus(stimulusContainer, currentStimulus, testSettings.stimulusSize);

    // Reset and start the timer
    resetTimer(timerDisplay);
    startTimer(timerDisplay);

    // Mark the time we showed the stimulus (for measuring reaction)
    stimulusStartTime = Date.now();

    // Hide the stimulus after exposureTime, then wait a random delay, then show next
    scheduleTimeout(() => {
      clearStimulusContainer(stimulusContainer);

      // Stop timer, as the exposure ended (if user hasn't clicked yet).
      stopTimer();
      stimulusStartTime = null;

      // Wait the random delay, then show next
      scheduleTimeout(
        displayNextStimulus,
        getRandomExposureDelay(testSettings.exposureDelay)
      );
    }, testSettings.exposureTime);
  };

  // Setup
  appContainer.style.cursor = "crosshair";
  clearStimulusContainer(stimulusContainer);

  // Initial delay before the first stimulus
  scheduleTimeout(displayNextStimulus, getRandomExposureDelay(testSettings.exposureDelay));
}

/** --------------------------------------------------------------------------------
 *  Utility & Helper Functions
 * -------------------------------------------------------------------------------- */
function getRandomExposureDelay(exposureDelay: ExposureDelay): number {
  const min = Math.ceil(exposureDelay[0] / 50) * 50;
  const max = Math.floor(exposureDelay[1] / 50) * 50;
  const number = Math.floor(Math.random() * ((max - min) / 50 + 1)) * 50 + min;
  console.log("Delay:", number);
  return number;
}

function setStimuliCounter(
  stimuliCounterContainer: HTMLElement,
  currentCount: number,
  totalCount: number
) {
  stimuliCounterContainer.textContent = `${currentCount}/${totalCount}`;
}

function resetStimuliCounter(
  stimuliCounterContainer: HTMLElement,
  totalCount: number
) {
  stimuliCounterContainer.textContent = `0/${totalCount}`;
}


function clearStimulusContainer(container: HTMLElement) {
  logWithTime(`Hiding stimulus`);
  container.innerHTML = ``;
}

/** Shape utilities */
type ShapeColor = "red" | "green" | "blue";
type ShapeType = "circle" | "triangle" | "square";

function getShapeSvg(size: number, color: ShapeColor, shape: ShapeType) {
  switch (shape) {
    case "circle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <circle cx="50" cy="50" r="50" fill="${color}"/>
              </svg>`;
    case "square":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <rect x="0" y="0" width="100" height="100" fill="${color}"/>
              </svg>`;
    case "triangle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <polygon points="50,0 100,100 0,100" fill="${color}"/>
              </svg>`;
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

/** Global or module-level arrays to keep track of timeouts & intervals */
let timeoutIds: number[] = [];

function scheduleTimeout(callback: () => void, delay: number) {
  const id = window.setTimeout(callback, delay);
  timeoutIds.push(id);
  return id;
}

function clearAllTimeouts() {
  for (const id of timeoutIds) {
    clearTimeout(id);
  }
  timeoutIds = [];
}
