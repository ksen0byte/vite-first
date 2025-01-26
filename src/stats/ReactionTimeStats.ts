// ReactionTimeStats.ts

import Chart from "chart.js/auto";
import {localize} from "../localization/localization.ts";

export interface FrequencyBin {
  binStart: number;
  binEnd: number;
  frequency: number;
}

export class ReactionTimeStats {
  private readonly data: number[];
  private readonly bins: FrequencyBin[];

  /**
   * Create a new instance with the given array of reaction times.
   */
  constructor(data: number[]) {
    this.data = data;
    this.bins = this.computeFrequencyDistribution();
  }

  /**
   * Groups data into bins (classes) using Sturges' Rule, ensuring
   * that all values up to the actual max are included.
   */
  private computeFrequencyDistribution(): FrequencyBin[] {
    if (this.data.length === 0) return [];

    const minVal = Math.min(...this.data);
    const maxVal = Math.max(...this.data);

    const numberOfClasses = this.getNumberOfClasses(this.data);
    const approxBinWidth = (maxVal - minVal) / numberOfClasses;
    // Round bin width up, so we definitely cover up to maxVal
    const binWidth = Math.ceil(approxBinWidth);

    // Calculate the start
    const binStart = Math.floor(minVal / binWidth) * binWidth;
    // Make sure we actually cover all data up to maxVal
    let binEnd = binStart + binWidth * numberOfClasses;
    if (binEnd < maxVal) {
      binEnd = maxVal;
    }

    // Create bins [start, start+binWidth), covering until binEnd
    const bins: FrequencyBin[] = [];
    for (let start = binStart; start < binEnd; start += binWidth) {
      bins.push({
        binStart: start,
        binEnd: start + binWidth, // half-open interval except possibly the last bin
        frequency: 0,
      });
    }

    // Count frequency
    this.data.forEach((value) => {
      if (value >= binStart && value <= binEnd) {
        // Calculate which bin index this value belongs in.
        let index = Math.floor((value - binStart) / binWidth);
        // If index is out of range due to rounding, clamp to the last bin
        if (index >= bins.length) {
          index = bins.length - 1;
        }
        bins[index].frequency += 1;
      }
    });

    return bins;
  }

  /**
   * Returns the bin with the highest frequency.
   */
  private getModalClass(): FrequencyBin | null {
    if (!this.bins.length) {
      console.error("Bins should not be empty");
      return null;
    }
    return this.bins.reduce((best, current) =>
      current.frequency > best.frequency ? current : best
    );
  }

  /**
   * Calculates the mode of the frequency distribution using interpolation.
   */
  public getMode(): number | null {
    if (this.bins.length < 3) {
      console.error("At least three bins are required to calculate the mode.");
      return null;
    }

    // Find the modal class (bin with the highest frequency)
    const modeBin = this.getModalClass();
    if (!modeBin) {
      console.error("Could not calculate the modal bin.");
      return null;
    }

    // Locate the index of the modal class
    const modeIndex = this.bins.findIndex(bin => bin.binStart === modeBin.binStart && bin.binEnd === modeBin.binEnd);

    // Ensure there are bins before and after the modal class
    if (modeIndex <= 0 || modeIndex >= this.bins.length - 1) {
      console.error("The modal class must not be the first or last bin.");
      return null;
    }

    // Extract required values
    const L = modeBin.binStart; // Lower boundary of modal class
    const f1 = modeBin.frequency; // Frequency of modal class
    const f0 = this.bins[modeIndex - 1].frequency; // Frequency of previous class
    const f2 = this.bins[modeIndex + 1].frequency; // Frequency of next class
    const h = modeBin.binEnd - modeBin.binStart; // Class width

    // Apply the mode formula
    return L + ((f1 - f0) / ((2 * f1) - f0 - f2)) * h;
  }

  /**
   * Calculates the number of bins using Sturges' Rule.
   */
  private getNumberOfClasses(data: number[]): number {
    const n: number = data.length;
    if (n === 0) {
      throw new Error("Dataset cannot be empty.");
    }
    return Math.ceil(Math.log2(n) + 1);
  }

  /**
   * Calculates the Functional Level of the System.
   * Formula: ???
   */
  public calculateFunctionalLevel(): number {
      return -1;
  }

  /**
   * Calculates the Reaction Stability.
   * Formula: ???
   */
  public calculateReactionStability(): number  {
    return -1;
  }

  /**
   * Calculates the Level of Functional Capabilities.
   * Formula: ???
   */
  public calculateFunctionalCapabilities(): number {
    return -1;
  }


  /**
   * Draws a histogram of bins, highlighting the highest-frequency bin in pink,
   * and labeling it as "(Highest)" in the tooltip.
   */
  public drawHistogram(ctx: HTMLCanvasElement) {
    const modeBin = this.getModalClass();

    const labels = this.bins.map((bin) => `${bin.binStart} - ${bin.binEnd} ${localize("ms")}`);
    const frequencies = this.bins.map((bin) => bin.frequency);

    // noinspection JSUnusedGlobalSymbols
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: localize("frequency"),
            data: frequencies,
            backgroundColor: (context) => {
              const index = context.dataIndex;
              const currentBin = this.bins[index];
              // If this bin is the highest freq bin, color pinkish
              if (
                modeBin &&
                currentBin.binStart === modeBin.binStart &&
                currentBin.binEnd === modeBin.binEnd
              ) {
                return "rgba(255, 99, 132, 0.8)"; // Pink
              } else {
                return "rgba(54, 162, 235, 0.6)"; // Default blue
              }
            },
            borderColor: (context) => {
              const index = context.dataIndex;
              const currentBin = this.bins[index];
              if (
                modeBin &&
                currentBin.binStart === modeBin.binStart &&
                currentBin.binEnd === modeBin.binEnd
              ) {
                return "rgba(255, 99, 132, 1)"; // Pink border
              } else {
                return "rgba(54, 162, 235, 1)"; // Blue border
              }
            },
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: localize("binMs"),
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: localize("frequency"),
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: localize("frequencyDistributionTitle"),
            font: {
              size: 24,
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                // Example: "Frequency: 10" or "Frequency: 10 (Highest)"
                const index = context.dataIndex;
                const freq = context.parsed.y;
                const currentBin = this.bins[index];
                let labelString = `${context.dataset.label}: ${freq}`;
                if (
                  modeBin &&
                  currentBin.binStart === modeBin.binStart &&
                  currentBin.binEnd === modeBin.binEnd
                ) {
                  labelString += " (Highest)";
                }
                return labelString;
              },
            },
          },
        },
      },
    });
  }
}
