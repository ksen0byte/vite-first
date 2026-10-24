// src/stats/central-processing.ts
import { TestRecord } from "../db/db.ts";
import { ReactionTimeStats } from "./ReactionTimeStats.ts";
import { feedbackTuning, isFeedback, OptimalSettings, TestMode } from "../config/domain.ts";

export type CrtTestType = "crt2-3";

export const CPI_TEST_MODES: readonly TestMode[] = ["shapes", "words", "colors", "combined"];

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

export interface CentralProcessingModeSummary {
  readonly testMode: TestMode;
  readonly cpi: CentralProcessingResult;
  readonly selectedPzmrTest: TestRecord | null;
  readonly selectedCrt23Test: TestRecord | null;
  readonly availablePzmrTests: readonly TestRecord[];
  readonly availableCrt23Tests: readonly TestRecord[];
}

export type CentralProcessingSummary = Record<TestMode, CentralProcessingModeSummary>;

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
  if (!crtTest || crtTest.testSettings.testType !== "crt2-3") {
    return { kind: "NoCrtTest", crtType };
  }
  if (!pzmrTest || pzmrTest.testSettings.testType !== "svmr" || pzmrTest.testSettings.testMode !== crtTest.testSettings.testMode) {
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

export interface CpiModeSelection {
  readonly selectedPzmrId?: number;
  readonly selectedCrt23Id?: number;
}

export type ComputeCpiSummaryOptions = Partial<Record<TestMode, CpiModeSelection>>;

/** Selects the newest tests independently for each stimulus mode. */
export function computeUserProfileCpiSummary(
  tests: readonly TestRecord[],
  options: ComputeCpiSummaryOptions = {}
): CentralProcessingSummary {
  const sortedTests = [...tests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const forMode = (testMode: TestMode): CentralProcessingModeSummary => {
    const modeTests = sortedTests.filter((test) => test.testSettings.testMode === testMode);
    const availablePzmrTests = modeTests.filter((test) => test.testSettings.testType === "svmr");
    const availableCrt23Tests = modeTests.filter((test) => test.testSettings.testType === "crt2-3");
    const selection = options[testMode];
    // Stale or cross-mode selections fall back to the newest eligible test.
    const selectedPzmrTest = availablePzmrTests.find((test) => test.id === selection?.selectedPzmrId)
      ?? availablePzmrTests[0] ?? null;
    const selectedCrt23Test = availableCrt23Tests.find((test) => test.id === selection?.selectedCrt23Id)
      ?? availableCrt23Tests[0] ?? null;
    return {
      testMode,
      cpi: calculateCpiFromRecords(selectedCrt23Test, selectedPzmrTest, "crt2-3"),
      selectedPzmrTest,
      selectedCrt23Test,
      availablePzmrTests,
      availableCrt23Tests,
    };
  };
  return {shapes: forMode("shapes"), words: forMode("words"), colors: forMode("colors"), combined: forMode("combined")};
}
