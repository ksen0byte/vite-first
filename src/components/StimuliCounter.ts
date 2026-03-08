import {AppContext} from "../config/domain.ts";

export class StimuliCounter {
  private container: HTMLElement;
  private readonly appContext: AppContext;
  private count: number = 0;

  constructor(container: HTMLElement, appContext: AppContext) {
    this.container = container;
    this.appContext = appContext;
  }

  public get(): number {
    return this.count;
  }

  public set(count: number): void {
    this.count = count;
    this.container.textContent = `${this.count}/${this.appContext.testSettings.stimulusCount}`;
  }

  public inc(): void {
    this.set(this.count + 1);
  }

  public reset(): void {
    this.count = 0;
    this.container.textContent = `0/${this.appContext.testSettings.stimulusCount}`;
  }

}

