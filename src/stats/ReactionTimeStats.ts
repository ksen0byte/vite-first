// ReactionTimeStats.ts

import Chart from "chart.js/auto";
import {localize} from "../localization/localization.ts";
import {cumulativeStdNormalProbability, mean, quantile, standardDeviation} from "simple-statistics";

export interface FrequencyBin {
  binStart: number;
  binEnd: number;
  frequency: number;
}

export class ReactionTimeStats {
  private readonly data: number[];
  private readonly bins: FrequencyBin[];
  // Calculate stats using simple-statistics
  public readonly count;
  public readonly meanVal;
  public readonly modeVal;
  public readonly stdevVal;

  // For percentiles (p3, p10, p25, p50, p75, p90, p97):
  //  p50 will match medianVal above, but we’ll keep it for completeness
  public readonly p3Val;
  public readonly p10Val;
  public readonly p25Val;
  public readonly p50Val;
  public readonly p75Val;
  public readonly p90Val;
  public readonly p97Val;

  private LOSKUTOVA_COEFFICIENT = 20;

  /**
   * Create a new instance with the given array of reaction times.
   */
  constructor(data: number[]) {
    this.data = data;
    this.bins = this.computeFrequencyDistribution();
    this.count = data.length;
    this.meanVal = mean(data);
    this.modeVal = this.getMode();
    this.stdevVal = standardDeviation(data);
    this.p3Val = quantile(data, 0.03);
    this.p10Val = quantile(data, 0.10);
    this.p25Val = quantile(data, 0.25);
    this.p50Val = quantile(data, 0.50);
    this.p75Val = quantile(data, 0.75);
    this.p90Val = quantile(data, 0.90);
    this.p97Val = quantile(data, 0.97);
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
  private getMode(): number | null {
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
   * 1) Functional Level
   *    ln( (2 * sqrt(2 * ln(2) * σ * M)) )
   */
  public calculateFunctionalLevel(): number {
    if (this.modeVal == null || this.modeVal <= 0) {
      return NaN;
    }
    const sigma = this.stdevVal;
    const M = this.modeVal;

    return Math.log(2 * Math.sqrt(2 * Math.log(2) * sigma * M));
  }

  /**
   * 2) Reaction Stability
   *    ln( ( φ((x2 - m)/(σ * sqrt(2))) - φ((x1 - m)/(σ * sqrt(2))) ) / (4 * sqrt(2) * ln(2) * σ) )
   */
  public calculateReactionStability(): number {
    const modeBin = this.getModalClass();
    if (!modeBin) {
      return NaN;
    }
    const x1 = modeBin.binStart;
    const x2 = modeBin.binEnd;
    const m = this.meanVal;
    const sigma = this.stdevVal;

    const z1 = (x2 - m) / (sigma);
    const z2 = (x1 - m) / (sigma);
    const phiDiff = cumulativeStdNormalProbability(z1) - cumulativeStdNormalProbability(z2);

    const denominator = 4 * Math.sqrt(2 * Math.log(2) * sigma * m);

    const modalDiff = x2 - x1;
    const coeff = this.LOSKUTOVA_COEFFICIENT / modalDiff;

    return Math.abs(Math.log(phiDiff / (denominator)) / coeff);
  }

  /**
   * 3) Functional Capabilities
   *    ln( ( φ((x2 - m)/(σ * sqrt(2))) - φ((x1 - m)/(σ * sqrt(2))) ) / (4 * sqrt(2) * ln(2) * σ * m) )
   */
  public calculateFunctionalCapabilities(): number {
    const modeBin = this.getModalClass();
    if (!modeBin) {
      return NaN;
    }
    const x1 = modeBin.binStart;
    const x2 = modeBin.binEnd;
    const m = this.meanVal;
    const sigma = this.stdevVal;
    if (m <= 0) {
      return NaN;
    }

    const z1 = (x2 - m) / (sigma);
    const z2 = (x1 - m) / (sigma);
    const phiDiff = cumulativeStdNormalProbability(z1) - cumulativeStdNormalProbability(z2);

    const denominator = 4 * Math.sqrt(2) * Math.log(2) * sigma * m;

    const modalDiff = x2 - x1;
    const coeff = this.LOSKUTOVA_COEFFICIENT / modalDiff;

    return Math.abs(Math.log(phiDiff / denominator) / coeff);
  }


  /**
   * Draws a histogram of bins, highlighting the highest-frequency bin in pink,
   * and labeling it as "(Highest)" in the tooltip.
   */
  public drawHistogram(ctx: HTMLCanvasElement) {
    const modeBin = this.getModalClass();

    const labels = this.bins.map((bin) => `${bin.binStart} - ${bin.binEnd} ${localize("ms")}`);
    const frequencies = this.bins.map((bin) => bin.frequency);

    const subtitle = this.generateStatisticsSummary();

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
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: localize("frequencyDistributionTitle"),
            font: {
              size: 24,
            }
          },
          subtitle: {
            display: true,
            text: subtitle,
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

  private generateStatisticsSummary() {
    return [
      `${localize("countLabel")}: ${this.count}`,
      `${localize("meanLabel")}: ${this.meanVal.toFixed(2)}`,
      `${localize("modeLabel")}: ${this.modeVal ? this.modeVal!.toFixed(2) : "N/A"}`,
      `${localize("stdevLabel")}: ${this.stdevVal.toFixed(2)}`,
    ].join(" | ");
  }
}
