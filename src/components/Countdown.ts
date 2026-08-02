import {Scheduler} from "../util/scheduleTimeout.ts";

/**
 * Displays a countdown in the given container, then calls `callAfter` once complete.
 */
export class Countdown {
  private container: HTMLElement;
  private readonly countDownValues: string[];
  private readonly interval: number;
  private readonly callAfter: () => void


  constructor(
    container: HTMLElement,
    countDownValues: string[],
    interval: number,
    callAfter: () => void,
    private readonly scheduler: Scheduler,
  ) {
    this.container = container;
    this.countDownValues = countDownValues;
    this.interval = interval;
    this.callAfter = callAfter;
  }

  public show() {
    let currentIndex = 0;

    const updateCountDown = () => {
      if (currentIndex < this.countDownValues.length) {
        this.container.textContent = this.countDownValues[currentIndex];
        currentIndex++;
        this.scheduler.schedule(updateCountDown, this.interval);
      } else {
        this.callAfter();
      }
    };

    updateCountDown();
  }
}
