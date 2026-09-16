// ReactionTimeStats.ts

import Chart from "chart.js/auto";
import {localize} from "../localization/localization.ts";
import {cumulativeStdNormalProbability, mean, median, medianAbsoluteDeviation, quantile, standardDeviation} from "simple-statistics";
import {TestType, TrialOutcome, TrialResult} from "../config/domain.ts";
import {MOTOR_COMPONENT_BOUNDS} from "../config/settings.ts";

export interface FrequencyBin {
  binStart: number;
  binEnd: number;
  frequency: number;
}

export type ErrorOutcome = Extract<TrialOutcome, "Miss" | "FalseAlarm" | "FalseStart" | "MixUp">;
export type OutcomeBreakdown = ErrorOutcome | "CorrectRejection";

export const ERROR_OUTCOMES: readonly ErrorOutcome[] = ["Miss", "FalseAlarm", "FalseStart", "MixUp"];
export const OUTCOME_BREAKDOWN: readonly OutcomeBreakdown[] = [...ERROR_OUTCOMES, "CorrectRejection"];

export type MotorComponentStats =
  | { readonly kind: "NotRecorded" }
  | { readonly kind: "NoValidSamples"; readonly totalRecorded: number; readonly successfulRecorded: number }
  | { readonly kind: "Available"; readonly meanMs: number; readonly validCount: number; readonly totalRecorded: number };

export type SensoryComponentStats =
  | { readonly kind: "NotApplicable" }
  | { readonly kind: "NotRecorded" }
  | { readonly kind: "NoValidMotorData" }
  | { readonly kind: "NoValidReactionData" }
  | { readonly kind: "InvalidComponentOrder" }
  | { readonly kind: "Available"; readonly valueMs: number };

export function calculateMotorComponentStats(
  trialResults: readonly TrialResult[],
  minMs: number = MOTOR_COMPONENT_BOUNDS.minMs,
  maxMs: number = MOTOR_COMPONENT_BOUNDS.maxMs,
): MotorComponentStats {
  // Keep recorded-but-invalid values distinguishable from legacy trials that
  // never captured motor timing; the UI communicates those states differently.
  const trialsWithMotor = trialResults.filter(
    trialResult => typeof trialResult.motorComponent === "number" && !Number.isNaN(trialResult.motorComponent),
  );

  if (trialsWithMotor.length === 0) {
    return {kind: "NotRecorded"};
  }

  // Error trials do not represent the intended stimulus-response movement and
  // would bias the motor estimate with premature or incorrect actions.
  const successfulTrialsWithMotor = trialsWithMotor.filter(trialResult => trialResult.outcome === "Success");
  const validValues = successfulTrialsWithMotor
    .map(trialResult => trialResult.motorComponent as number)
    .filter(value => value >= minMs && value <= maxMs);

  if (validValues.length === 0) {
    return {
      kind: "NoValidSamples",
      totalRecorded: trialsWithMotor.length,
      successfulRecorded: successfulTrialsWithMotor.length,
    };
  }

  return {
    kind: "Available",
    meanMs: mean(validValues),
    validCount: validValues.length,
    totalRecorded: trialsWithMotor.length,
  };
}

export function calculateSensoryComponentStats(
  meanReactionTimeMs: number,
  motorStats: MotorComponentStats,
  testType: TestType = "svmr",
  validReactionCount: number = 1,
): SensoryComponentStats {
  if (testType !== "svmr") {
    return {kind: "NotApplicable"};
  }
  if (motorStats.kind === "NotRecorded") {
    return {kind: "NotRecorded"};
  }
  if (motorStats.kind === "NoValidSamples") {
    return {kind: "NoValidMotorData"};
  }
  // ReactionTimeStats uses zero when cleaning removes every RT sample. Without
  // the count guard that sentinel would produce a plausible-looking negative value.
  if (validReactionCount <= 0 || !Number.isFinite(meanReactionTimeMs) || meanReactionTimeMs <= 0) {
    return {kind: "NoValidReactionData"};
  }
  // The motor interval is a subset of total reaction time. Equality or a larger
  // motor value therefore signals inconsistent measurements, not sensory time.
  if (!Number.isFinite(motorStats.meanMs) || motorStats.meanMs >= meanReactionTimeMs) {
    return {kind: "InvalidComponentOrder"};
  }
  return {
    kind: "Available",
    valueMs: meanReactionTimeMs - motorStats.meanMs,
  };
}

export class ReactionTimeStats {
  private readonly data: number[];
  private readonly bins: FrequencyBin[];
  private readonly debugLabel?: string;
  // Calculate stats using simple-statistics
  public readonly count;
  /** Successful reactions removed by hard-bound or MAD filtering. */
  public readonly filteredCount;
  public readonly meanVal;
  public readonly modeVal;
  public readonly stdevVal;
  public readonly cvVal;
  public readonly motorComponent: MotorComponentStats;
  public readonly hasMotorComponentData: boolean;
  public readonly motorComponentVal: number | null;
  public readonly sensoryComponent: SensoryComponentStats;
  public readonly sensoryComponentVal: number | null;

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

  // Discretized Shannon Entropy (in bits)
  public readonly entropyVal: number;

  public readonly errorCount: number;
  public readonly errorPercentage: number;
  /**
   * Create a new instance with the given array of reaction times.
   */
  constructor(
    trialResults: TrialResult[],
    upperBound: number = 700,
    lowerBound: number = 100,
    testType: TestType,
    debugLabel?: string,
  ) {
    this.debugLabel = debugLabel;
    const successfulCount = trialResults.filter(trialResult => trialResult.outcome === "Success").length;
    // Step 1: Remove hard outliers based on fixed range
    let cleanedData = trialResults
      .filter(trialResult => trialResult.outcome === "Success")
      .map(trialResult => trialResult.reactionTime)
      .filter(value => value >= lowerBound && value <= upperBound);

    // Step 2: Apply statistical outlier removal
    cleanedData = this.removeOutliersUsingMAD(cleanedData);

    // Final cleaned data
    this.data = cleanedData;

    // Calculate statistics on cleaned data
    this.bins = this.computeFrequencyDistribution();
    this.count = cleanedData.length;
    this.filteredCount = successfulCount - this.count;

    if (this.count > 0) {
      this.meanVal = mean(cleanedData);
      this.modeVal = this.getMode();
      this.stdevVal = standardDeviation(cleanedData);
      this.cvVal = (this.meanVal !== 0 ? this.stdevVal / this.meanVal : 0) * 100;
      this.p3Val = quantile(cleanedData, 0.03);
      this.p10Val = quantile(cleanedData, 0.10);
      this.p25Val = quantile(cleanedData, 0.25);
      this.p50Val = quantile(cleanedData, 0.50);
      this.p75Val = quantile(cleanedData, 0.75);
      this.p90Val = quantile(cleanedData, 0.90);
      this.p97Val = quantile(cleanedData, 0.97);
      this.entropyVal = this.calculateDiscretizedShannonEntropy();
    } else {
      this.meanVal = 0;
      this.modeVal = 0;
      this.stdevVal = 0;
      this.cvVal = 0;
      this.p3Val = 0;
      this.p10Val = 0;
      this.p25Val = 0;
      this.p50Val = 0;
      this.p75Val = 0;
      this.p90Val = 0;
      this.p97Val = 0;
      this.entropyVal = 0;
    }

    this.motorComponent = calculateMotorComponentStats(trialResults);
    // Keep scalar aliases for existing consumers, while the tagged results retain
    // the reason a value is unavailable for newer UI code.
    this.hasMotorComponentData = this.motorComponent.kind !== "NotRecorded";
    this.motorComponentVal = this.motorComponent.kind === "Available" ? this.motorComponent.meanMs : null;

    this.sensoryComponent = calculateSensoryComponentStats(this.meanVal, this.motorComponent, testType, this.count);
    this.sensoryComponentVal = this.sensoryComponent.kind === "Available" ? this.sensoryComponent.valueMs : null;

    this.outcomeCountsByOutcome = OUTCOME_BREAKDOWN.reduce<Record<OutcomeBreakdown, number>>((acc, outcome) => {
      acc[outcome] = trialResults.filter(t => t.outcome === outcome).length;
      return acc;
    }, {
      Miss: 0,
      FalseAlarm: 0,
      FalseStart: 0,
      MixUp: 0,
      CorrectRejection: 0,
    });

    const errors = trialResults.filter(t => ERROR_OUTCOMES.includes(t.outcome as ErrorOutcome));
    this.errorCount = errors.length;
    this.errorPercentage = trialResults.length > 0 ? (this.errorCount / trialResults.length) * 100 : 0;
  }

  public readonly outcomeCountsByOutcome: Record<OutcomeBreakdown, number>;

  /**
   * Removes extreme outliers from a dataset using the Modified Z-Score method.
   *
   * Method:
   * - Calculates the median of the dataset as the center.
   * - Computes the Median Absolute Deviation (MAD) to measure data variability.
   * - Calculates Modified Z-Scores:
   *   M_i = 0.6745 * (value - median) / MAD
   * - Filters out values with a Modified Z-Score |M_i| > 3.5 (customizable threshold).
   *
   * Advantages:
   * - Robust to skewed data and resistant to the influence of extreme values.
   * - Suitable for detecting outliers in datasets with non-normal distributions.
   *
   * Limitations:
   * - May perform poorly with small datasets or when MAD is zero (e.g., identical values).
   *
   * More information:
   * - https://en.wikipedia.org/wiki/Median_absolute_deviation
   * - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm
   *
   * @param {number[]} data - Array of numeric values to analyze.
   * @returns {number[]} New array with outliers removed.
   */
  private removeOutliersUsingMAD(data: number[]): number[] {
    // Handle small datasets: retain all data if size is too small for MAD
    if (data.length < 5) {
      console.warn("Dataset too small for MAD-based outlier detection.", data);
      return data;
    }

    const dataMedian = median(data);
    const mad = medianAbsoluteDeviation(data);

    // Fallback if MAD is zero
    if (mad === 0) {
      console.warn("MAD is zero; data may contain identical values. No outliers will be removed.");
      return data;
    }

    return data.filter(value => {
      const modifiedZScore = (0.6745 * (value - dataMedian)) / mad;
      return Math.abs(modifiedZScore) <= 3.5; // Retain non-outliers
    });
  }

  /**
   * Groups data into bins (classes) using Sturges' Rule, ensuring
   * that all values up to the actual max are included.
   */
  private computeFrequencyDistribution(): FrequencyBin[] {
    if (this.data.length === 0) return [];

    const minVal = Math.min(...this.data);
    const maxVal = Math.max(...this.data);

    if (minVal === maxVal) {
      return [{binStart: minVal, binEnd: minVal + 1, frequency: this.data.length}];
    }

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
      console.warn("Cannot interpolate the statistical mode: fewer than three histogram bins.", {
        test: this.debugLabel ?? "unspecified",
        sampleCount: this.data.length,
        cleanedReactionTimes: this.data,
        bins: this.bins,
      });
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
      console.warn("Cannot interpolate the statistical mode: the modal class is an edge bin.", {
        test: this.debugLabel ?? "unspecified",
        reason: "The grouped-mode formula requires neighboring bins on both sides.",
        sampleCount: this.data.length,
        cleanedReactionTimes: this.data,
        modalBinIndex: modeIndex,
        modalBin: modeBin,
        binFrequencies: this.bins.map((bin) => bin.frequency),
        bins: this.bins,
      });
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
   * Calculates discretized Shannon entropy using the histogram (frequency distribution) of reaction times.
   * Entropy H = - Σ p_i log2 p_i, where p_i are probabilities of bins.
   * Returns 0 for empty datasets or when no variability exists.
   */
  public calculateDiscretizedShannonEntropy(): number {
    const total = this.count;
    if (!total || !this.bins.length) return 0;

    return this.bins
      .filter(bin => bin.frequency > 0)
      .map(bin => bin.frequency / total)
      .map(p => -p * Math.log2(p))
      .reduce((acc, val) => acc + val, 0);
  }

  /**
   * 1) Functional Level
   *    Formula: ln(2 * sqrt(2 * ln(2) * M * σ))
   *
   *    Where:
   *    - ln: natural logarithm
   *    - M: mode of the dataset
   *    - σ: standard deviation of the dataset
   *
   * @returns {number} The functional level based on the given formula.
   */

  public calculateFunctionalLevel(): number | null {
    if (this.modeVal == null || this.modeVal <= 0 || this.stdevVal <= 0) {
      return null;
    }
    const sigma = this.stdevVal;
    const M = this.modeVal;

    const value = Math.log(2 * Math.sqrt(2 * Math.log(2) * sigma * M));
    return Number.isFinite(value) ? value : null;
  }

  /**
   * 2) Reaction Stability
   *    Formula: ln( ( ϕ((x2 - m) / σ) - ϕ((x1 - m) / σ) ) / (4 * sqrt(2 * ln(2))) ) / coefficient
   *
   *    Where:
   *    - ϕ: cumulative standard normal probability function
   *    - x1: start of the mode bin (binStart)
   *    - x2: end of the mode bin (binEnd)
   *    - m: mean of the dataset (meanVal)
   *    - σ: standard deviation of the dataset (stdevVal)
   *    - coefficient: a scaling factor based on the modal bin width and the Loskutova coefficient
   *    - The formula calculates reaction stability based on the probability within the modal class.
   *
   * @returns {number} The calculated reaction stability, normalized by the coefficient.
   */

  public calculateReactionStability(): number | null {
    const modeBin = this.getModalClass();
    if (!modeBin) {
      return null;
    }
    const x1 = modeBin.binStart;
    const x2 = modeBin.binEnd;
    const m = this.meanVal;
    const sigma = this.stdevVal;

    if (sigma <= 0) return null;
    const z1 = (x2 - m) / (sigma);
    const z2 = (x1 - m) / (sigma);
    const modalClassProbability = cumulativeStdNormalProbability(z1) - cumulativeStdNormalProbability(z2);

    const modalWidth = x2 - x1;
    const coefficient = this.LOSKUTOVA_COEFFICIENT / modalWidth;

    const value = Math.abs(Math.log(modalClassProbability / (4 * Math.sqrt(2 * Math.log(2))))) / coefficient;
    return Number.isFinite(value) ? value : null;
  }

  /**
   * 3) Functional Capabilities
   *    Formula: ln( ( ϕ((x2 - m) / σ) - ϕ((x1 - m) / σ) ) / (2 * sqrt(2 * ln(2) * σ * m)) )
   *
   *    Where:
   *    - ϕ: cumulative standard normal probability function
   *    - x1: start of the mode bin (binStart)
   *    - x2: end of the mode bin (binEnd)
   *    - m: mean of the dataset (meanVal)
   *    - σ: standard deviation of the dataset (stdevVal)
   *    - The formula calculates functional capabilities by analyzing the probability within the modal class relative to the mean and standard deviation.
   *    - A coefficient, based on interpreting the Loskutova model, adjusts the value based on the modal bin width.
   *
   * @returns {number} The calculated functional capabilities, normalized by the coefficient.
   */
  public calculateFunctionalCapabilities(): number | null {
    const modeBin = this.getModalClass();
    if (!modeBin) {
      return null;
    }
    const x1 = modeBin.binStart;
    const x2 = modeBin.binEnd;
    const m = this.meanVal;
    const sigma = this.stdevVal;
    if (m <= 0 || sigma <= 0) {
      return null;
    }

    const z1 = (x2 - m) / (sigma);
    const z2 = (x1 - m) / (sigma);

    const modalClassProbability = cumulativeStdNormalProbability(z1) - cumulativeStdNormalProbability(z2);

    const modalDiff = x2 - x1;
    const coefficient = this.LOSKUTOVA_COEFFICIENT / modalDiff;

    const value = Math.abs(Math.log(modalClassProbability / (2 * Math.sqrt(2 * Math.log(2) * sigma * m))) / coefficient);
    return Number.isFinite(value) ? value : null;
  }


  /**
   * Draws a histogram of bins, highlighting the highest-frequency bin in pink,
   * and labeling it as "(Highest)" in the tooltip.
   */
  public drawHistogram(ctx: HTMLCanvasElement): Chart {
    const modeBin = this.getModalClass();

    const labels = this.bins.map((bin) => `${bin.binStart} - ${bin.binEnd} ${localize("ms")}`);
    const frequencies = this.bins.map((bin) => bin.frequency);

    const subtitle = this.generateStatisticsSummary();

    // noinspection JSUnusedGlobalSymbols
    return new Chart(ctx, {
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
    let motorStr: string;
    if (this.motorComponent.kind === "NotRecorded") {
      motorStr = localize("notRecorded");
    } else if (this.motorComponent.kind === "NoValidSamples") {
      motorStr = localize("noValidMotorData");
    } else {
      motorStr = `${this.motorComponent.meanMs.toFixed(2)} ${localize("ms")}`;
    }

    let sensoryStr: string;
    if (this.sensoryComponent.kind === "NotRecorded") {
      sensoryStr = localize("notRecorded");
    } else if (this.sensoryComponent.kind === "NoValidMotorData") {
      sensoryStr = localize("noValidMotorData");
    } else if (this.sensoryComponent.kind === "NoValidReactionData" || this.sensoryComponent.kind === "InvalidComponentOrder") {
      sensoryStr = localize("noValidSensoryData");
    } else if (this.sensoryComponent.kind === "NotApplicable") {
      sensoryStr = "N/A";
    } else {
      sensoryStr = `${this.sensoryComponent.valueMs.toFixed(2)} ${localize("ms")}`;
    }

    return [
      `${localize("countLabel")}: ${this.count}`,
      `${localize("meanLabel")}: ${this.meanVal.toFixed(2)}`,
      `${localize("statisticalModeLabel")}: ${this.modeVal ? this.modeVal!.toFixed(2) : "N/A"}`,
      `${localize("stdevLabel")}: ${this.stdevVal.toFixed(2)}`,
      `${localize("cvLabel")}: ${this.cvVal.toFixed(2)}%`,
      `${localize("entropyLabel")}: ${this.entropyVal.toFixed(3)} ${localize("bits")}`,
      `${localize("motorComponentLabel")}: ${motorStr}`,
      `${localize("sensoryComponentLabel")}: ${sensoryStr}`,
      `${localize("statFunctionalLevel")}: ${formatUnavailable(this.calculateFunctionalLevel())}`,
      `${localize("statReactionStability")}: ${formatUnavailable(this.calculateReactionStability())}`,
      `${localize("statFunctionalCapabilities")}: ${formatUnavailable(this.calculateFunctionalCapabilities())}`,
    ].join(" | ");
  }
}

const formatUnavailable = (value: number | null): string => value === null ? 'N/A' : value.toFixed(2);

export class MultiHandReactionTimeStats {
  public readonly total: ReactionTimeStats;
  public readonly left: ReactionTimeStats;
  public readonly right: ReactionTimeStats;

  constructor(
    trialResults: TrialResult[],
    upperBound: number = 1000,
    lowerBound: number = 100,
    debugLabel?: string,
    testType: TestType = "crt2-3",
  ) {
    this.total = new ReactionTimeStats(trialResults, upperBound, lowerBound, testType, debugLabel ? `${debugLabel} / total` : undefined);
    this.left = new ReactionTimeStats(
      trialResults.filter(t => isTrialForHand(t, "LEFT")),
      upperBound,
      lowerBound,
      testType,
      debugLabel ? `${debugLabel} / left` : undefined,
    );
    this.right = new ReactionTimeStats(
      trialResults.filter(t => isTrialForHand(t, "RIGHT")),
      upperBound,
      lowerBound,
      testType,
      debugLabel ? `${debugLabel} / right` : undefined,
    );
  }
}

function isTrialForHand(trial: TrialResult, hand: "LEFT" | "RIGHT"): boolean {
  // Target trials belong to the requested hand even when the participant presses
  // the other key; this keeps misses and mix-ups attributed to the expected hand.
  if (trial.expectedAction === "LEFT" || trial.expectedAction === "RIGHT") {
    return trial.expectedAction === hand;
  }
  // Non-target errors and false starts have no expected hand, but the pressed
  // key still identifies which hand produced the error. NONE/NONE trials, such
  // as correct rejections, consequently belong to neither hand.
  return trial.actualAction === hand;
}
