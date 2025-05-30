// test-screen.ts
import {AppContext, DebugMode} from "../config/domain.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {logWithTime} from "../util/util.ts";
import {clearAllTimeouts, scheduleTimeout} from "../util/scheduleTimeout.ts";
import {StimulusManager} from "../components/StimulusManager.ts";
import {StimuliCounter} from "../components/StimuliCounter.ts";
import {TimerManager} from "../components/Timer.ts";
import {Countdown} from "../components/Countdown.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";

export class TestScreen {
  private readonly appContainer: HTMLElement;
  private readonly appContext: AppContext;

  // DOM elements
  private stimulusContainer!: HTMLElement;
  private retryButton!: HTMLButtonElement;
  private homeButton!: HTMLButtonElement;

  // Managers
  private countdown!: Countdown;
  private stimulusManager!: StimulusManager;
  private timerManager!: TimerManager;
  private stimuliCounter!: StimuliCounter;

  // event listeners
  private handleKeyDownBound: (event: KeyboardEvent) => void;

  // Data
  private readonly reactionTimes: number[];

  // spam prevention
  private spamPreventionConfig = {clickAllowedFromMs: 100, maxInputsPerStimulus: 3};
  private spamInputCount: number = 0;
  private testResetting: boolean = false; // Prevents concurrent test resets

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    this.appContext = AppContextManager.getContext();
    this.reactionTimes = [];

    // Store the bound reference
    this.handleKeyDownBound = this.handleAppKeyDown.bind(this);
  }

  /**
   * Set up the Test Screen UI and initialize all logic (countdown, timers, events).
   */
  public setupScreen(): void {
    this.renderUI(this.appContext.debugMode);
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
    document.removeEventListener("keydown", this.handleKeyDownBound);
    this.timerManager.stop();
    clearAllTimeouts();
  }

  /**
   * Builds the screen’s HTML structure.
   */
  private renderUI(debugMode: DebugMode): void {
    this.appContainer.innerHTML = `
      <div id="test-screen" class="flex flex-col flex-grow bg-black text-white">
        <!-- Top bar: retry button -->
        <div class="${debugMode === "prod" ? "hidden" : "" } flex-grow-0 flex flex-row-reverse justify-between items-end p-4">
          <button id="retry-btn" class="btn btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>      
          <button id="home-btn" class="btn btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </button>      
        </div>
        <!-- Main test content -->
        <div id="test-stimulus-container" class="flex items-center justify-center flex-grow text-8xl font-bold"></div>

        <!-- Bottom bar: timer (left), counter (right) -->
        <div class="${debugMode === "prod" ? "hidden" : "" } flex-grow-0 flex justify-between items-end p-4">
          <!-- Timer (bottom-left) -->
          <div id="timer-container">
            <div id="timer-display" class="text-3xl font-mono text-gray-400">0.000${localize("s")}</div>
          </div>

          <!-- Center: kbd -->
          <div class="hidden sm:block">
            <div>
                <span class="font-mono text-gray-400" data-localize="testScreenTestPZMRActionButtonLeft">Press </span>
                <kbd data-theme="light" class="kbd" data-localize="testScreenTestPZMRActionButtonName">Space</kbd>
                <span class="font-mono text-gray-400" data-localize="testScreenTestPZMRActionButtonRight"> once a stimulus appears</span>
            </div>          
          </div>

          <!-- Right side: counter -->
          <div class="flex items-center space-x-4">
            <div id="stimuli-counter" class="text-4xl font-mono text-gray-500">
              0/${this.appContext.testSettings.stimulusCount}
            </div>
          </div>
        </div>
        
        <!-- Spam Modal -->
        <div id="spamModal" class="modal">
          <div class="modal-box">
            <h3 class="font-bold text-lg" data-localize="testScreenTestSpamModalTitle"></h3>
            <p class="py-4" data-localize="testScreenTestSpamModalMessage"></p>
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
    this.homeButton = document.getElementById("home-btn") as HTMLButtonElement;
  }

  /**
   * Initialize Stimulus, Timer, and Counter managers.
   */
  private createManagers(): void {
    this.stimulusManager = new StimulusManager(this.stimulusContainer, this.appContext);
    this.timerManager = new TimerManager(document.getElementById("timer-display")!);
    this.stimuliCounter = new StimuliCounter(document.getElementById("stimuli-counter")!, this.appContext);

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
    this.retryButton.addEventListener("click", () => this.handleRetry());
    this.homeButton.addEventListener("click", () => this.handleHome());
    // Listen for keydown to simulate user input
    document.addEventListener("keydown", this.handleKeyDownBound);
  }

  /**
   * Start the countdown to begin the actual test sequence.
   */
  private startTest(): void {
    this.countdown.show();
  }

  private stopTest(): void {
    this.timerManager.stopAndReset();
    clearAllTimeouts();
    this.reactionTimes.length = 0; // clean up array
    this.resetSpamCounter();
    this.stimuliCounter.reset();
  }

  /**
   * Called when the user clicks “Retry”.
   * Resets all counters, timers, and clears old timeouts.
   */
  private handleRetry(): void {
    this.stopTest();
    this.retryButton.blur();
    this.startTest();
  }

  private handleHome(): void {
    this.destroy();
    Router.navigate("/settings");
  }

  private handleAppKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") this.handleUserInput();
    if (event.code === "Escape") this.handleHome();
  }


  /**
   * Main test logic: called after the countdown finishes.
   * Repeatedly displays stimuli, tracks reaction times, and completes on finishing all stimuli.
   */
  private runTest(): void {
    // Recursively display each stimulus in sequence.
    const displayNextStimulus = () => {
      const totalStimuli = this.appContext.testSettings.stimulusCount;
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
        this.resetSpamCounter();

        scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
      }, this.appContext.testSettings.exposureTime);
    };

    // Initial setup
    this.stimulusManager.clearContainer();
    scheduleTimeout(displayNextStimulus, this.stimulusManager.getRandomExposureDelay());
  }

  /**
   * Processes user input during the stimulus-response test.
   * Tracks the reaction time of valid inputs and enforces spam prevention rules.
   *
   * Workflow:
   * - Blocks input if the test is resetting.
   * - Increments input count (`spamInputCount`) and checks if spam is detected.
   * - Calculates reaction time for valid inputs and stores the result.
   *
   * Rules:
   * - Prevents multiple inputs for a single stimulus.
   * - Ignores inputs below the minimum reaction time threshold.
   * - Stops the test and shows a spam modal if spam is detected.
   */
  private handleUserInput(): void {
    // Block input if test resetting is in progress
    if (this.testResetting) return;

    // Increment spam input counter
    this.increaseSpamCounter();

    // Check for spam detection
    if (this.spamInputCount > this.spamPreventionConfig.maxInputsPerStimulus) {
      this.testResetting = true;
      this.stopTest();           // Stop the test
      this.showSpamModal();      // Show spam modal
      setTimeout(() => {
        this.hideSpamModal();    // Hide spam modal after 5 seconds
        this.testResetting = false;
        this.startTest();        // Restart the test
      }, 5000);                  // Timeout duration
      return;                    // Exit early after spam detection
    }

    // Debug: Log the input count
    console.log(`User input count: ${this.spamInputCount}`);

    // Retrieve the start time of the current stimulus
    const lastStimulusTime = this.timerManager.getStartTime();

    // If there is a valid stimulus start time, calculate the reaction time
    if (lastStimulusTime != null) {
      const reactionTime = Date.now() - lastStimulusTime;

      // Ignore input if reaction time is below the allowed threshold
      if (reactionTime < this.spamPreventionConfig.clickAllowedFromMs) {
        console.warn(`Input ignored: Reaction time (${reactionTime}ms) is below `
          + `the allowed threshold of ${this.spamPreventionConfig.clickAllowedFromMs}ms.`);
        return;
      }

      // Record the valid reaction time and stop the timer
      this.reactionTimes.push(reactionTime);
      this.timerManager.stop();

      // reset spam counter
      this.resetSpamCounter();
    }
  }

  private increaseSpamCounter() {
    this.spamInputCount++;
  }

  private resetSpamCounter() {
    this.spamInputCount = 0;
  }

  /**
   * Called once the test is finished.
   * Displays "Retry" and "Finish" buttons in place of the test content.
   */
  private onTestComplete(): void {
    this.stimulusManager.clearContainer();
    this.destroy();

    // Hide or replace the main container content
    this.stimulusContainer.innerHTML = `
      <div class="flex flex-col items-center space-y-4">
        <div class="text-3xl mb-4" data-localize="testScreenTestCompleteMessage"></div>
        <div class="flex space-x-4">
          <button id="end-retry-btn" class="btn btn-soft sm:btn-xl btn-warning"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg><span data-localize="testScreenTestBtnRetry">Retry</span></button>
          <button id="end-finish-btn" class="btn btn-soft sm:btn-xl btn-success"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg> <span data-localize="testScreenTestBtnFinish">Finish</span></button>
        </div>
      </div>
    `;
    updateLanguageUI();

    // Wire up new buttons
    const endRetryBtn = document.getElementById("end-retry-btn") as HTMLButtonElement;
    const endFinishBtn = document.getElementById("end-finish-btn") as HTMLButtonElement;

    // On "Retry", reset test
    endRetryBtn.addEventListener("click", () => {
      logWithTime("End screen Retry clicked.");
      // Re-run handleRetry() or do a fresh TestScreen again
      this.handleRetry();
    });

    // On "Finish", go to results screen
    endFinishBtn.addEventListener("click", () => {
      logWithTime("End screen Finish clicked. Showing results.");
      const reactionTimes = this.reactionTimes;
      Router.navigate("/results", {reactionTimes});
    });
  }

  private showSpamModal() {
    document.getElementById("spamModal")?.classList.add("modal-open");
  }

  private hideSpamModal() {
    document.getElementById("spamModal")?.classList.remove("modal-open");
  }

}
