// src/stats/central-processing.ts
import { TestRecord } from "../db/db.ts";
import { ReactionTimeStats } from "./ReactionTimeStats.ts";
import { feedbackTuning, isFeedback, OptimalSettings } from "../config/domain.ts";

export type CrtTestType = "crt1-3" | "crt2-3";

export type CentralProcessingResult =
  | {
      readonly kind: "Available";
      readonly crtType: CrtTestType;
      readonly valueMs: number;
      readonly crtMeanMs: number;
      readonly pzmrMeanMs: number;
      readonly pzmrTestId?: number;
      readonly pzmrDate: string;
      readonly crtTestId?: number;
      readonly crtDate: string;
    }
  | {
      readonly kind: "NoBaselinePzmr";
      readonly crtType: CrtTestType;
    }
  | {
      readonly kind: "NoCrtTest";
      readonly crtType: CrtTestType;
    }
  | {
      readonly kind: "NoValidSamples";
      readonly crtType: CrtTestType;
      readonly reason: string;
    };

export interface CentralProcessingSummary {
  readonly cpi13: CentralProcessingResult;
  readonly cpi23: CentralProcessingResult;
  readonly selectedPzmrTest: TestRecord | null;
  readonly selectedCrt13Test: TestRecord | null;
  readonly selectedCrt23Test: TestRecord | null;
  readonly availablePzmrTests: readonly TestRecord[];
  readonly availableCrt13Tests: readonly TestRecord[];
  readonly availableCrt23Tests: readonly TestRecord[];
}

/**
 * Creates ReactionTimeStats for a TestRecord using the proper cleaning upper bounds.
 */
export function getTestStats(test: TestRecord): ReactionTimeStats {
  const isFeedbackSession = isFeedback(test.testSettings);
  // Feedback accepts answers during the post-stimulus pause, so using only the
  // exposure duration would incorrectly discard legitimate late reactions.
  const rtUpperBound = isFeedbackSession
    ? feedbackTuning(test.testSettings).maxExposure + feedbackTuning(test.testSettings).pause
    : (test.testSettings as OptimalSettings).exposureTime;
  return new ReactionTimeStats(test.trials, rtUpperBound, 100, test.testSettings.testType);
}

/**
 * Pure function to calculate Central Processing Information (MCPO / CPI) from stats.
 */
export function calculateCpiFromStats(params: {
  readonly crtStats: ReactionTimeStats;
  readonly pzmrStats: ReactionTimeStats | null | undefined;
  readonly crtType: CrtTestType;
  readonly crtDate?: string;
  readonly pzmrDate?: string;
  readonly crtTestId?: number;
  readonly pzmrTestId?: number;
}): CentralProcessingResult {
  const { crtStats, pzmrStats, crtType, crtDate, pzmrDate, crtTestId, pzmrTestId } = params;

  if (!pzmrStats) {
    return { kind: "NoBaselinePzmr", crtType };
  }

  if (crtStats.count === 0 || !Number.isFinite(crtStats.meanVal) || crtStats.meanVal <= 0) {
    return { kind: "NoValidSamples", crtType, reason: "No valid CRT reactions" };
  }

  if (pzmrStats.count === 0 || !Number.isFinite(pzmrStats.meanVal) || pzmrStats.meanVal <= 0) {
    return { kind: "NoValidSamples", crtType, reason: "No valid PZMR reactions" };
  }

  // SVMR approximates the shared sensory/motor portion; subtracting it leaves
  // the additional decision time introduced by the choice-reaction task.
  const valueMs = crtStats.meanVal - pzmrStats.meanVal;

  return {
    kind: "Available",
    crtType,
    valueMs,
    crtMeanMs: crtStats.meanVal,
    pzmrMeanMs: pzmrStats.meanVal,
    crtTestId,
    crtDate: crtDate ?? "",
    pzmrTestId,
    pzmrDate: pzmrDate ?? "",
  };
}

/**
 * Calculates Central Processing Information (MCPO / CPI) from TestRecords.
 */
export function calculateCpiFromRecords(
  crtTest: TestRecord | null | undefined,
  pzmrTest: TestRecord | null | undefined,
  crtType: CrtTestType
): CentralProcessingResult {
  if (!crtTest) {
    return { kind: "NoCrtTest", crtType };
  }
  if (!pzmrTest) {
    return { kind: "NoBaselinePzmr", crtType };
  }

  const crtStats = getTestStats(crtTest);
  const pzmrStats = getTestStats(pzmrTest);

  return calculateCpiFromStats({
    crtStats,
    pzmrStats,
    crtType,
    crtDate: crtTest.date,
    pzmrDate: pzmrTest.date,
    crtTestId: crtTest.id,
    pzmrTestId: pzmrTest.id,
  });
}

export interface ComputeCpiSummaryOptions {
  readonly selectedPzmrId?: number;
  readonly selectedCrt13Id?: number;
  readonly selectedCrt23Id?: number;
}

/**
 * Aggregates all user tests and computes CPI summary with optional custom selection.
 */
export function computeUserProfileCpiSummary(
  tests: readonly TestRecord[],
  options?: ComputeCpiSummaryOptions
): CentralProcessingSummary {
  // Work on a copy because callers also use their ordering to number/render the
  // test cards; CPI selection must not mutate that external presentation state.
  const sortedTests = [...tests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const availablePzmrTests = sortedTests.filter(
    (t) => t.testSettings.testType === "svmr"
  );
  const availableCrt13Tests = sortedTests.filter(
    (t) => t.testSettings.testType === "crt1-3"
  );
  const availableCrt23Tests = sortedTests.filter(
    (t) => t.testSettings.testType === "crt2-3"
  );

  // A stale selection (for example after deleting a record) falls back to the
  // newest compatible test so the summary remains usable without a reset step.
  const selectedPzmrTest =
    (options?.selectedPzmrId !== undefined
      ? availablePzmrTests.find((t) => t.id === options.selectedPzmrId)
      : undefined) ??
    availablePzmrTests[0] ??
    null;

  const selectedCrt13Test =
    (options?.selectedCrt13Id !== undefined
      ? availableCrt13Tests.find((t) => t.id === options.selectedCrt13Id)
      : undefined) ??
    availableCrt13Tests[0] ??
    null;

  const selectedCrt23Test =
    (options?.selectedCrt23Id !== undefined
      ? availableCrt23Tests.find((t) => t.id === options.selectedCrt23Id)
      : undefined) ??
    availableCrt23Tests[0] ??
    null;

  const cpi13 = calculateCpiFromRecords(selectedCrt13Test, selectedPzmrTest, "crt1-3");
  const cpi23 = calculateCpiFromRecords(selectedCrt23Test, selectedPzmrTest, "crt2-3");

  return {
    cpi13,
    cpi23,
    selectedPzmrTest,
    selectedCrt13Test,
    selectedCrt23Test,
    availablePzmrTests,
    availableCrt13Tests,
    availableCrt23Tests,
  };
}
