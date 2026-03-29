// test-screen.ts
import {AppContext, DebugMode, TrialOutcome, TrialResult} from "../config/domain.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {logWithTime} from "../util/util.ts";
import {clearAllTimeouts, scheduleTimeout} from "../util/scheduleTimeout.ts";
import {StimulusManager} from "../components/StimulusManager.ts";
import {StimuliCounter} from "../components/StimuliCounter.ts";
import {TimerManager} from "../components/Timer.ts";
import {Countdown} from "../components/Countdown.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";
import {
  TestState,
  toIdle,
  toCountingDown,
  toDelayed,
  toShowingStimulus,
  toSpamDetected,
  toFinished,
  getNextDelay
} from "../domain/test-state.ts";
import {Stimulus} from "../domain/types.ts";
import {isAnimal, isRed, isSquare} from "../domain/stimulus-sequences.ts";

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
  private readonly handleKeyDownBound: (event: KeyboardEvent) => void;

  // State
  private state: TestState = toIdle();
  private reactionTimes: Map<number, TrialResult> = new Map();

  // spam prevention
  private readonly spamPreventionConfig = {clickAllowedFromMs: 100, maxInputsPerStimulus: 3};
  private spamInputCount: number = 0;

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    this.appContext = AppContextManager.getContext();

    // Store the bound reference
    this.handleKeyDownBound = this.handleAppKeyDown.bind(this);
  }

  /**
   * Set up the Test Screen UI and initialize all logic (countdown, timers, events).
   */
  public setupScreen(): void {
    this.stopTest(); // Ensure a clean state if re-initializing
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

  private transitionTo(newState: TestState): void {
    this.state = newState;
    console.log(`Transitioned to state: ${newState._tag}`);
  }

  /**
   * Builds the screen’s HTML structure.
   */
  private renderUI(debugMode: DebugMode): void {
    this.appContainer.innerHTML = `
      <div id="test-screen" class="flex flex-col flex-grow bg-black text-white">
        <!-- Top bar: back/home and retry (hidden in prod) -->
        <div class="flex-grow-0 flex flex-row-reverse justify-between items-end p-4">
          <button id="retry-btn" class="btn btn-ghost ${debugMode === "prod" ? "hidden" : ""}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>      
          <button id="home-btn" class="btn btn-ghost ${debugMode === "prod" ? "hidden" : ""}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span class="ml-2" data-localize="backToMainPage"></span>
          </button>      
        </div>
        <!-- Main test content -->
        <div id="test-stimulus-container" class="flex items-center justify-center flex-grow text-8xl font-bold"></div>

        <!-- Bottom bar: timer (left), counter (right) -->
        <div class="${debugMode === "prod" ? "hidden" : ""} flex-grow-0 flex justify-between items-end p-4">
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
   * Attach the event listeners (e.g., retry button, click for reaction times).
   */
  private attachEventListeners(): void {
    this.retryButton.addEventListener("click", () => this.handleRetry());
    this.homeButton.addEventListener("click", () => this.handleHome());
    // Listen for keydown to simulate user input
    document.removeEventListener("keydown", this.handleKeyDownBound);
    document.addEventListener("keydown", this.handleKeyDownBound);
  }

  /**
   * Start the countdown to begin the actual test sequence.
   */
  private startTest(): void {
    this.transitionTo(toCountingDown(3));
    this.countdown.show();
  }

  private stopTest(): void {
    this.timerManager?.stopAndReset();
    clearAllTimeouts();
    this.reactionTimes.clear();
    this.spamInputCount = 0;
    this.stimuliCounter?.reset();
    this.transitionTo(toIdle());
  }

  /**
   * Called when the user clicks “Retry”.
   * Resets all counters, timers, and clears old timeouts.
   */
  private handleRetry(): void {
    this.setupScreen();
  }

  private handleHome(): void {
    this.destroy();
    Router.navigate("/");
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
    this.stimulusManager.clearContainer();
    this.scheduleNextStimulus(0);
  }

  private scheduleNextStimulus(index: number): void {
    const totalStimuli = this.appContext.testSettings.stimulusCount;
    if (index >= totalStimuli) {
      this.onTestComplete();
      return;
    }

    const delay = getNextDelay(this.appContext.testSettings, index);
    this.transitionTo(toDelayed(index, delay, performance.now()));

    scheduleTimeout(() => {
      this.showStimulus(index);
    }, delay);
  }

  private showStimulus(index: number): void {
    this.stimuliCounter.set(index + 1);
    const stimulus: Stimulus = this.stimulusManager.showStimulus(index);
    this.timerManager.restart();
    this.transitionTo(toShowingStimulus(index, performance.now(), stimulus));

    scheduleTimeout(() => {
      this.onStimulusTimeout(index);
    }, this.appContext.testSettings.exposureTime);
  }

  private onStimulusTimeout(index: number): void {
    if (this.state._tag !== 'ShowingStimulus' || this.state.stimulusIndex !== index) return;

    const stimulus = this.state.stimulusValue;
    const testType = this.appContext.testSettings.testType;

    const hasReacted = this.reactionTimes.has(this.state.stimulusIndex);
    const shouldHaveReacted = testType === "svmr" || (testType === "crt1-3" && (isRed(stimulus) || isSquare(stimulus) || isAnimal(stimulus)));

    if (!hasReacted && shouldHaveReacted) {
      this.recordReactionTime(this.state.stimulusValue, -1, "Miss");
    } else if (!hasReacted && !shouldHaveReacted) {
      this.recordReactionTime(this.state.stimulusValue, -1, "CorrectRejection");
    }

    this.stimulusManager.clearContainer();
    this.timerManager.stop();
    this.spamInputCount = 0;
    this.scheduleNextStimulus(index + 1);
  }

  private handleUserInput(): void {
    // 1. Immediate Guard: Exit if state is invalid
    const invalidStates = ['SpamDetected', 'Finished', 'CountingDown'];
    if (invalidStates.includes(this.state._tag)) return;

    // 2. Spam Prevention: Isolated logic
    if (++this.spamInputCount > this.spamPreventionConfig.maxInputsPerStimulus) {
      return this.onSpamDetected();
    }

    // 3. State Guard: Only process inputs during stimulus
    if (this.state._tag !== 'ShowingStimulus') return;

    // 4. Threshold Guard
    const reactionTime = performance.now() - this.state.startTime;
    if (reactionTime < this.spamPreventionConfig.clickAllowedFromMs) {
      console.warn(`Input ignored: RT ${reactionTime}ms below threshold.`);
      return;
    }

    // 5. Functional Dispatch
    this.processTestResponse(this.state.stimulusValue, reactionTime);
    this.timerManager.stop();
  }

  private processTestResponse(stimulus: Stimulus, rt: number): void {
    const {testType} = this.appContext.testSettings;

    // Determine correctness based on test type
    const shouldHaveReacted = testType === "svmr" ||
      (testType === "crt1-3" && (isRed(stimulus) || isSquare(stimulus) || isAnimal(stimulus)));

    const outcome: TrialOutcome = shouldHaveReacted ? "Success" : "FalseAlarm";

    console.log(`${outcome}: ${stimulus}`);
    this.recordReactionTime(stimulus, rt, outcome);
  }

  private recordReactionTime(stimulus: Stimulus, reactionTime: number, outcome: TrialOutcome) {
    if (this.state._tag !== 'ShowingStimulus') throw new Error("Reaction time can only be recorded when a stimulus is being shown.");
    if (this.reactionTimes.has(this.state.stimulusIndex)) throw new Error(`Reaction time already recorded for trial ${this.state.stimulusIndex}.`);

    const trialResult: TrialResult = {
      trialIndex: this.state.stimulusIndex,
      stimulus: stimulus,
      reactionTime: reactionTime,
      outcome: outcome,
    }

    this.reactionTimes.set(this.state.stimulusIndex, trialResult);
  }

  private onSpamDetected(): void {
    this.transitionTo(toSpamDetected());
    this.timerManager.stopAndReset();
    clearAllTimeouts();
    this.showSpamModal();
    scheduleTimeout(() => {
      this.hideSpamModal();
      this.setupScreen(); // Use setupScreen instead of handleRetry to ensure full reset from any state
    }, 5000);
  }

  private onTestComplete(): void {
    this.transitionTo(toFinished(this.reactionTimes));
    this.stimulusManager.clearContainer();

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

    const endRetryBtn = document.getElementById("end-retry-btn") as HTMLButtonElement;
    const endFinishBtn = document.getElementById("end-finish-btn") as HTMLButtonElement;

    // On "Retry", reset test
    endRetryBtn.addEventListener("click", () => {
      logWithTime("End screen Retry clicked.");
      // Re-setup screen to restore UI and listeners
      this.setupScreen();
    });

    // On "Finish", go to the results screen
    endFinishBtn.addEventListener("click", () => {
      logWithTime("End screen Finish clicked. Showing results.");
      this.destroy();
      Router.navigate("/results", {reactionTimes: this.reactionTimes});
    });
  }

  private showSpamModal() {
    document.getElementById("spamModal")?.classList.add("modal-open");
  }

  private hideSpamModal() {
    document.getElementById("spamModal")?.classList.remove("modal-open");
  }
}
