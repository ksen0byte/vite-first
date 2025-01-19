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

  // Event handler references (if you need to remove them on destroy)
  private handleAppClick!: (ev: MouseEvent) => void;

  constructor(appContainer: HTMLElement, testSettings: TestSettings) {
    this.appContainer = appContainer;
    this.testSettings = testSettings;
    this.reactionTimes = new Map();
  }

  /**
   * Set up the Test Screen UI and initialize all logic (countdown, timers, events).
   */
  public init(): void {
    this.renderUI();
    this.getElements();
    this.createManagers();
    this.attachEventListeners();
    this.startTest();
    updateLanguageUI();
  }

  /**
   * Call this if you need to tear down the screen (for single-page apps or routing).
   * Clears timers, event listeners, etc.
   */
  public destroy(): void {
    this.appContainer.removeEventListener("click", this.handleAppClick);
    clearAllTimeouts();
  }

  /**
   * Builds the screen’s HTML structure.
   */
  private renderUI(): void {
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
   * Get references to key elements inserted by `renderUI`.
   */
  private getElements(): void {
    this.stimulusContainer = document.getElementById("test-stimulus-container")!;
    this.retryButton = document.getElementById("retry-btn") as HTMLButtonElement;
  }

  /**
   * Initialize Stimulus, Timer, and Counter managers.
   */
  private createManagers(): void {
    this.stimulusManager = new StimulusManager(this.stimulusContainer, this.testSettings);
    this.timerManager = new TimerManager(document.getElementById("timer-display")!);
    this.stimuliCounter = new StimuliCounter(document.getElementById("stimuli-counter")!, this.testSettings);

    // Configure the countdown
    this.countdown = new Countdown(
      this.stimulusContainer,
      ["3", "2", "1", localize("testScreenTestStart")],
      1000,
      () => this.runTest()
    );
  }

  /**
   * Attach the event listeners (e.g. retry button, click for reaction times).
   */
  private attachEventListeners(): void {
    this.retryButton.addEventListener("click", () => {
      logWithTime("Retry button clicked. Restarting test...");
      this.handleRetry();
    });

    // Reaction time click handler
    this.handleAppClick = () => this.handleAppClickFn();
    this.appContainer.addEventListener("click", this.handleAppClick);
  }

  /**
   * Start the countdown to begin the actual test sequence.
   */
  private startTest(): void {
    this.countdown.show();
  }

  /**
   * Called when the user clicks “Retry”.
   * Resets all counters, timers, and clears old timeouts.
   */
  private handleRetry(): void {
    this.timerManager.stopAndReset();
    clearAllTimeouts();
    this.reactionTimes.clear();
    this.stimuliCounter.reset();
    this.appContainer.addEventListener("click", this.handleAppClick);
    this.startTest();
  }

  /**
   * Main test logic: called after the countdown finishes.
   * Repeatedly displays stimuli, tracks reaction times, and completes on finishing all stimuli.
   */
  private runTest(): void {
    // Recursively display each stimulus in sequence.
    const displayNextStimulus = () => {
      const totalStimuli = this.testSettings.stimulusCount;
      if (this.stimuliCounter.get() >= totalStimuli) {
        // We are done; finalize
        this.onTestComplete();
        return;
      }

      this.stimuliCounter.inc();
      this.stimulusManager.showStimulus(this.stimuliCounter.get());

      // Timer: restart from 0
      this.timerManager.restart();

      // Hide stimulus after exposureTime, then apply random delay, then show next.
      scheduleTimeout(() => {
        this.stimulusManager.clearContainer();
        this.timerManager.stop();

        scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
      }, this.testSettings.exposureTime);
    };

    // Initial setup
    this.appContainer.style.cursor = "crosshair";
    this.stimulusManager.clearContainer();
    scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
  }

  /**
   * Handles clicks on the app container for reaction-time measurement.
   */
  private handleAppClickFn(): void {
    // If there is a stimulus on screen and the timer is running...
    // (We track this by having a non-null start time)
    // We find the difference between now and that start time.
    //
    // Because we store it as soon as we show the stimulus,
    // we can measure how quickly the user responded.
    //
    // If the user clicked multiple times, only the first matters.
    const currentIndex = this.stimuliCounter.get();
    const lastStimulusTime = this.timerManager.getStartTime();
    if (lastStimulusTime != null) {
      const reactionTime = Date.now() - lastStimulusTime;
      this.reactionTimes.set(currentIndex, reactionTime);
      logWithTime(`Reaction time for stimulus #${currentIndex}: ${reactionTime}ms`);
      logWithTime(`${this.reactionTimes}`)

      this.timerManager.stop();
    }
  }

  /**
   * Called once the test is finished.
   * Stops everything, removes event listeners, logs data, etc.
   */
  private onTestComplete(): void {
    this.appContainer.style.cursor = "default";
    this.stimulusManager.clearContainer();
    this.appContainer.removeEventListener("click", this.handleAppClick);
    this.timerManager.stop();

    console.log("Reaction times:", this.reactionTimes);
  }
}
