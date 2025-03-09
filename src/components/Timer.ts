// src/components/Timer.ts
import {localize} from "../localization/localization.ts";

export class TimerManager {
  private container: HTMLElement;
  private timerInterval: number | null = null;
  private timerStart: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Start (or restart) the timer. */
  public start() {
    this.stop(); // Stop if already running

    this.timerStart = Date.now();
    this.timerInterval = window.setInterval(() => {
      this.updateTimerDisplay();
    }, 10); // update ~ every 10ms
  }

  /** Stop the current timer. */
  public stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerStart = null;
    }
  }

  /** Reset timer to 0, but keep it running (i.e. new start point). */
  public reset() {
    this.timerStart = Date.now();
    this.container.textContent = this.formatTimer(0);
  }

  public stopAndReset() {
    this.stop();
    this.reset();
  }

  public restart() {
    this.reset();
    this.start();
  }

  public getStartTime(): number | null {
    return this.timerStart;
  }

  /** Update the on-screen timer display based on the current timerStart. */
  private updateTimerDisplay() {
    if (this.timerStart == null) {
      this.container.textContent = this.formatTimer(0);
      return;
    }
    const elapsedMs = Date.now() - this.timerStart;
    this.container.textContent = this.formatTimer(elapsedMs);
  }

  private formatTimer(milliseconds: number): string {
    return (milliseconds / 1000).toFixed(3) + localize("s");
  }
}


