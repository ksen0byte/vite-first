import {TestSettings} from "../config/settings-screen-config.ts";

export class StimuliCounter {
  private container: HTMLElement;
  private readonly testSettings: TestSettings;
  private count: number = 0;

  constructor(container: HTMLElement, testSettings: TestSettings) {
    this.container = container;
    this.testSettings = testSettings;
  }

  public get(): number {
    return this.count;
  }

  public inc(): void {
    this.count++;
    this.container.textContent = `${this.count}/${this.testSettings.stimulusCount}`;
  }

  public reset(): void {
    this.count = 0;
    this.container.textContent = `0/${this.testSettings.stimulusCount}`;
  }

}

