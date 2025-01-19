// test-screen.ts
import { TestSettings } from "../config/settings-screen-config.ts";
import { localize, updateLanguageUI } from "../localization/localization.ts";
import { logWithTime } from "../util/util.ts";
import { clearAllTimeouts, scheduleTimeout } from "../util/scheduleTimeout.ts";
import { StimulusManager } from "../components/StimulusManager.ts";
import { StimuliCounter } from "../components/StimuliCounter.ts";
import { TimerManager } from "../components/Timer.ts";
import { Countdown } from "../components/Countdown.ts";

export class TestScreen {
  private appContainer: HTMLElement;
  private readonly testSettings: TestSettings;

  // DOM elements
  private stimulusContainer!: HTMLElement;
  private retryButton!: HTMLButtonElement;

  // Managers
  private countdown!: Countdown;
  private stimulusManager!: StimulusManager;
  private timerManager!: TimerManager;
  private stimuliCounter!: StimuliCounter;

  // Data
  private readonly reactionTimes: Map<number, number>;

  constructor(appContainer: HTMLElement, testSettings: TestSettings) {
    this.appContainer = appContainer;
    this.testSettings = testSettings;
    this.reactionTimes = new Map();
  }

  /**
   * Sets up the Test Screen UI and initializes all logic (countdown, timers, events).
   */
  public init(): void {
    this.renderScreenHTML();
    this.getElements();
    this.createManagers();
    this.addEventListeners();
    this.startTest();
    updateLanguageUI();
  }

  /**
   * Injects the HTML layout for the test screen into `appContainer`.
   */
  private renderScreenHTML(): void {
    this.appContainer.innerHTML = `
      <div id="test-screen" class="flex flex-col flex-grow bg-black text-white">
        <!-- Top bar: retry button -->
        <div class="flex-grow-0 flex flex-row-reverse justify-between items-end p-4">
          <button id="retry-btn" class="btn btn-ghost">${localize("testScreenTestRetry")}</button>      
        </div>
        <!-- Main test content -->
        <div id="test-stimulus-container" class="flex items-center justify-center flex-grow text-8xl font-bold"></div>

        <!-- Bottom bar: timer (left), counter (right) -->
        <div class="flex-grow-0 flex justify-between items-end p-4">
          <!-- Timer (bottom-left) -->
          <div id="timer-container">
            <div id="timer-display" class="text-3xl font-mono text-gray-400">0.000${localize("s")}</div>
          </div>

          <!-- Right side: counter -->
          <div class="flex items-center space-x-4">
            <div id="stimuli-counter" class="text-4xl font-mono text-gray-500">
              0/${this.testSettings.stimulusCount}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Grabs references to the newly injected DOM elements.
   */
  private getElements(): void {
    this.stimulusContainer = document.getElementById("test-stimulus-container")!;
    this.retryButton = document.getElementById("retry-btn") as HTMLButtonElement;
  }

  /**
   * Creates and configures the managers needed for the test.
   */
  private createManagers(): void {
    this.stimulusManager = new StimulusManager(this.stimulusContainer, this.testSettings);
    this.timerManager = new TimerManager(document.getElementById("timer-display")!);
    this.stimuliCounter = new StimuliCounter(document.getElementById("stimuli-counter")!, this.testSettings);

    this.countdown = new Countdown(
      this.stimulusContainer,
      ["3", "2", "1", localize("testScreenTestStart")],
      1000,
      () => this.runTest()
    );
  }

  /**
   * Wires up event listeners (e.g., the "Retry" button).
   */
  private addEventListeners(): void {
    this.retryButton.addEventListener("click", () => {
      logWithTime("Retry button clicked. Restarting test...");
      this.handleRetry();
    });
  }

  /**
   * Starts the countdown to begin the actual test sequence.
   */
  private startTest(): void {
    this.countdown.show();
  }

  /**
   * Core logic for re-initializing the test when the user clicks "Retry."
   */
  private handleRetry(): void {
    this.timerManager.stopAndReset();
    clearAllTimeouts();
    this.reactionTimes.clear();
    this.stimuliCounter.reset();
    this.startTest();
  }

  /**
   * The main test logic: repeatedly displays stimuli, tracks reaction times, stops on completion.
   */
  private runTest(): void {
    let stimulusStartTime: number | null = null;

    // Click handler to record reaction times.
    const handleClick = () => {
      if (stimulusStartTime !== null) {
        const reactionTime = Date.now() - stimulusStartTime;
        this.reactionTimes.set(this.stimuliCounter.get(), reactionTime);
        logWithTime(`Reaction time for stimulus #${this.stimuliCounter.get()}: ${reactionTime}ms`);

        // Stop the timer because user clicked.
        this.timerManager.stop();
        stimulusStartTime = null;
      }
    };

    // Attach the click listener to measure reaction times.
    this.appContainer.addEventListener("click", handleClick);

    // Recursively display each stimulus in sequence.
    const displayNextStimulus = () => {
      const totalStimuli = this.testSettings.stimulusCount;
      if (this.stimuliCounter.get() >= totalStimuli) {
        // Test done
        this.appContainer.style.cursor = "default";
        this.stimulusManager.clearContainer();
        this.appContainer.removeEventListener("click", handleClick);
        this.timerManager.stop();
        console.log("Reaction times:", this.reactionTimes);
        return;
      }

      this.stimuliCounter.inc();
      this.stimulusManager.showStimulus(this.stimuliCounter.get());

      this.timerManager.restart();
      stimulusStartTime = Date.now();

      // Hide stimulus after exposureTime, then apply random delay, then show next.
      scheduleTimeout(() => {
        this.stimulusManager.clearContainer();
        this.timerManager.stop();
        stimulusStartTime = null;

        scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
      }, this.testSettings.exposureTime);
    };

    // Initial setup
    this.appContainer.style.cursor = "crosshair";
    this.stimulusManager.clearContainer();
    scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
  }
}
