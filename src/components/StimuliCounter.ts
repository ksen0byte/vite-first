import {AppContext, isFeedbackStrength} from "../config/domain.ts";

export class StimuliCounter {
  private container: HTMLElement;
  private readonly appContext: AppContext;
  private count: number = 0;

  constructor(container: HTMLElement, appContext: AppContext) {
    this.container = container;
    this.appContext = appContext;
    this.render();
  }

  /** Denominator for the counter: stimulus count for count-driven modes.
   *  The strength submode is time-driven, so it has no fixed total and the
   *  counter shows only the running count. */
  private get total(): number | null {
    const ts = this.appContext.testSettings;
    return isFeedbackStrength(ts) ? null : ts.stimulusCount;
  }

  private render(): void {
    const total = this.total;
    this.container.textContent = total === null ? `${this.count}` : `${this.count}/${total}`;
  }

  public get(): number {
    return this.count;
  }

  public set(count: number): void {
    this.count = count;
    this.render();
  }

  public inc(): void {
    this.set(this.count + 1);
  }

  public reset(): void {
    this.count = 0;
    this.render();
  }

}

