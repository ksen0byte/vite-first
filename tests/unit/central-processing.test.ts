// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from "vitest";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
});

const {
  calculateCpiFromRecords,
  calculateCpiFromStats,
  computeUserProfileCpiSummary,
} = await import("../../src/stats/central-processing.ts");
const { ReactionTimeStats } = await import("../../src/stats/ReactionTimeStats.ts");
const { setupProfileScreen } = await import("../../src/screens/user-profile-screen.ts");
const { setupResultsScreen } = await import("../../src/screens/results-screen.ts");
const { LanguageManager } = await import("../../src/localization/LanguageManager.ts");
import AppContextManager from "../../src/config/AppContextManager.ts";
import { db } from "../../src/db/db.ts";
import type { TestRecord, User } from "../../src/db/db.ts";
import type { OptimalSettings, TestMode, TrialResult } from "../../src/config/domain.ts";

const createTrial = (
  reactionTime: number,
  outcome: TrialResult["outcome"] = "Success",
  motorComponent: number | null = 50
): TrialResult => ({
  trialIndex: 0,
  stimulus: "circle",
  reactionTime,
  outcome,
  expectedAction: "DEFAULT",
  actualAction: "DEFAULT",
  motorComponent,
});

const createOptimalSettings = (testType: "svmr" | "crt1-3" | "crt2-3"): OptimalSettings => ({
  testMode: "shapes",
  stimulusSize: 30,
  testType,
  hand: "right",
  usePregenerated: {
    exposureDelay: false,
    stimuli: false,
  },
  protocolMode: "optimal",
  exposureTime: 500,
  exposureDelay: [500, 1500],
  stimulusCount: 10,
});

const createTestRecord = (
  id: number,
  testType: "svmr" | "crt1-3" | "crt2-3",
  reactionTimes: number[],
  date: string = "2026-09-01T10:00:00.000Z",
  userKey: string = "John|Doe"
): TestRecord => ({
  id,
  userKey,
  testSettings: createOptimalSettings(testType),
  trials: reactionTimes.map((rt) => createTrial(rt)),
  date,
});

describe("central-processing (MCPO / CPI)", () => {
  describe("calculateCpiFromStats", () => {
    it("computes exact difference when both CRT and PZMR stats are available", () => {
      const pzmrStats = new ReactionTimeStats([createTrial(200), createTrial(240)], 500, 100, "svmr");
      const crtStats = new ReactionTimeStats([createTrial(350), createTrial(370)], 500, 100, "crt2-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt2-3",
        crtDate: "2026-09-01T12:00:00.000Z",
        pzmrDate: "2026-09-01T10:00:00.000Z",
        crtTestId: 2,
        pzmrTestId: 1,
      });

      expect(result.kind).toBe("Available");
      if (result.kind === "Available") {
        expect(result.crtType).toBe("crt2-3");
        expect(result.pzmrMeanMs).toBe(220);
        expect(result.crtMeanMs).toBe(360);
        expect(result.valueMs).toBe(140);
        expect(result.pzmrTestId).toBe(1);
        expect(result.crtTestId).toBe(2);
      }
    });

    it("returns NoBaselinePzmr when pzmrStats is null or undefined", () => {
      const crtStats = new ReactionTimeStats([createTrial(350)], 500, 100, "crt2-3");
      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats: null,
        crtType: "crt2-3",
      });

      expect(result).toEqual({
        kind: "NoBaselinePzmr",
        crtType: "crt2-3",
      });
    });

    it("returns NoValidSamples when CRT stats has no valid reaction times", () => {
      const pzmrStats = new ReactionTimeStats([createTrial(220)], 500, 100, "svmr");
      const crtStats = new ReactionTimeStats([createTrial(350, "Miss")], 500, 100, "crt2-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt2-3",
      });

      expect(result.kind).toBe("NoValidSamples");
      if (result.kind === "NoValidSamples") {
        expect(result.crtType).toBe("crt2-3");
        expect(result.reason).toContain("CRT");
      }
    });

    it("returns NoValidSamples when PZMR stats has no valid reaction times", () => {
      const pzmrStats = new ReactionTimeStats([createTrial(220, "Miss")], 500, 100, "svmr");
      const crtStats = new ReactionTimeStats([createTrial(350)], 500, 100, "crt2-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt2-3",
      });

      expect(result.kind).toBe("NoValidSamples");
      if (result.kind === "NoValidSamples") {
        expect(result.crtType).toBe("crt2-3");
        expect(result.reason).toContain("PZMR");
      }
    });
  });

  describe("calculateCpiFromRecords", () => {
    it("returns NoCrtTest when crtTest is not provided", () => {
      const pzmrTest = createTestRecord(1, "svmr", [220, 240]);
      const result = calculateCpiFromRecords(null, pzmrTest, "crt2-3");
      expect(result).toEqual({
        kind: "NoCrtTest",
        crtType: "crt2-3",
      });
    });

    it("returns NoBaselinePzmr when pzmrTest is not provided", () => {
      const crtTest = createTestRecord(2, "crt2-3", [350, 370]);
      const result = calculateCpiFromRecords(crtTest, null, "crt2-3");
      expect(result).toEqual({
        kind: "NoBaselinePzmr",
        crtType: "crt2-3",
      });
    });

    it("calculates CPI correctly from records", () => {
      const pzmrTest = createTestRecord(1, "svmr", [200, 220]);
      const crtTest = createTestRecord(2, "crt2-3", [400, 420]);

      const result = calculateCpiFromRecords(crtTest, pzmrTest, "crt2-3");
      expect(result.kind).toBe("Available");
      if (result.kind === "Available") {
        expect(result.crtType).toBe("crt2-3");
        expect(result.pzmrMeanMs).toBe(210);
        expect(result.crtMeanMs).toBe(410);
        expect(result.valueMs).toBe(200);
      }
    });
  });

  describe("mode-specific summaries", () => {
    const modes: TestMode[] = ["shapes", "words", "colors", "combined"];
    const inMode = (record: TestRecord, mode: TestMode): TestRecord => ({
      ...record, testSettings: {...record.testSettings, testMode: mode},
    });

    it("returns all four modes when no tests exist", () => {
      const summary = computeUserProfileCpiSummary([]);
      expect(Object.keys(summary)).toEqual(modes);
      modes.forEach((mode) => {
        expect(summary[mode].cpi.kind).toBe("NoCrtTest");
        expect(summary[mode].selectedPzmrTest).toBeNull();
      });
    });

    it("uses only same-mode SVMR and CR2-3 records, newest first, without changing input order", () => {
      const tests = modes.flatMap((mode, index) => [
        inMode(createTestRecord(index * 10 + 1, "svmr", [200 + index * 10]), mode),
        inMode(createTestRecord(index * 10 + 2, "crt2-3", [400]), mode),
        inMode(createTestRecord(index * 10 + 3, "svmr", [250], "2026-08-01T10:00:00Z"), mode),
        inMode(createTestRecord(index * 10 + 4, "crt1-3", [300], "2026-10-01T10:00:00Z"), mode),
      ]);
      const original = [...tests];
      const summary = computeUserProfileCpiSummary(tests);
      modes.forEach((mode, index) => {
        expect(summary[mode].cpi).toMatchObject({kind: "Available", valueMs: 200 - index * 10});
        expect(summary[mode].availablePzmrTests.map((test) => test.id)).toEqual([index * 10 + 1, index * 10 + 3]);
        expect(summary[mode].availableCrt23Tests.map((test) => test.id)).toEqual([index * 10 + 2]);
      });
      expect(tests).toEqual(original);
    });

    it("keeps manual selections independent and falls back for cross-mode or stale IDs", () => {
      const tests = [
        createTestRecord(1, "svmr", [200]),
        createTestRecord(2, "svmr", [250], "2026-08-01T10:00:00Z"),
        createTestRecord(3, "crt2-3", [400]),
        createTestRecord(4, "crt2-3", [450], "2026-08-01T10:00:00Z"),
        inMode(createTestRecord(5, "svmr", [220]), "words"),
        inMode(createTestRecord(6, "crt2-3", [350]), "words"),
      ];
      const summary = computeUserProfileCpiSummary(tests, {
        shapes: {selectedPzmrId: 2, selectedCrt23Id: 4},
        words: {selectedPzmrId: 1, selectedCrt23Id: 999},
      });
      expect(summary.shapes.cpi).toMatchObject({kind: "Available", valueMs: 200, pzmrTestId: 2, crtTestId: 4});
      expect(summary.words.cpi).toMatchObject({kind: "Available", valueMs: 130, pzmrTestId: 5, crtTestId: 6});
    });

    it("never falls back to another mode's baseline", () => {
      const baseline = createTestRecord(1, "svmr", [200]);
      const choice = inMode(createTestRecord(2, "crt2-3", [400]), "colors");
      expect(calculateCpiFromRecords(choice, baseline, "crt2-3").kind).toBe("NoBaselinePzmr");
      expect(computeUserProfileCpiSummary([baseline, choice]).colors.cpi.kind).toBe("NoBaselinePzmr");
      expect(calculateCpiFromRecords(createTestRecord(3, "crt1-3", [350]), baseline, "crt2-3").kind).toBe("NoCrtTest");
      expect(calculateCpiFromRecords(choice, choice, "crt2-3").kind).toBe("NoBaselinePzmr");
    });

    describe("profile table", () => {
      const user: User = {firstName: "Test", lastName: "Subject", gender: "male", age: 25};
      let cleanup: (() => void) | undefined;
      let container: HTMLDivElement;
      afterEach(() => { cleanup?.(); container?.remove(); });

      it("shows four localized rows and CPI only on CR2-3 cards", () => {
        LanguageManager.setCurrentLanguage("uk");
        container = document.createElement("div");
        document.body.appendChild(container);
        cleanup = setupProfileScreen(container, user, [
          createTestRecord(1, "svmr", [200]),
          createTestRecord(2, "crt1-3", [350]),
          createTestRecord(3, "crt2-3", [400]),
        ]);
        const table = container.querySelector("#cpi-summary-table")!;
        expect(table.querySelectorAll("tbody tr")).toHaveLength(4);
        expect(table.textContent).toContain("МЦОІ");
        expect(table.textContent).toContain("РВ 2-3");
        expect(table.textContent).not.toContain("CPI");
        expect(table.textContent).not.toContain("1-3");
        expect(container.querySelectorAll(".cpi-card-value")).toHaveLength(1);
        expect(container.querySelector(".cpi-card-value")?.textContent).toContain("200.00");
      });

      it("retains independent baseline and target selections after repeated renders", () => {
        LanguageManager.setCurrentLanguage("en");
        container = document.createElement("div");
        document.body.appendChild(container);
        cleanup = setupProfileScreen(container, user, [
          createTestRecord(1, "svmr", [200]),
          createTestRecord(2, "svmr", [250], "2026-08-01T10:00:00Z"),
          createTestRecord(3, "crt2-3", [400]),
          createTestRecord(4, "crt2-3", [450], "2026-08-01T10:00:00Z"),
          inMode(createTestRecord(5, "svmr", [220]), "words"),
          inMode(createTestRecord(6, "crt2-3", [350]), "words"),
        ]);
        const select = (id: string, value: number) => {
          const element = container.querySelector<HTMLSelectElement>("#" + id)!;
          element.value = String(value);
          element.dispatchEvent(new Event("change", {bubbles: true}));
        };
        select("cpi-shapes-pzmr-select", 2);
        select("cpi-shapes-crt23-select", 4);
        expect(container.querySelector('[data-cpi-mode="shapes"]')?.textContent).toContain("200.00");
        expect(container.querySelector('[data-cpi-mode="words"]')?.textContent).toContain("130.00");
        expect(container.querySelector('.cpi-card-value[data-test-id="3"]')?.textContent).toContain("150.00");
        expect(container.querySelector('.cpi-card-value[data-test-id="6"]')?.textContent).toContain("130.00");
        select("cpi-shapes-pzmr-select", 1);
        expect(container.querySelector('[data-cpi-mode="shapes"]')?.textContent).toContain("250.00");
        expect(container.querySelector<HTMLSelectElement>("#cpi-shapes-crt23-select")?.value).toBe("4");
      });
    });
  });

  describe("results and database mode filtering", () => {
    let container: HTMLDivElement;
    afterEach(() => { vi.restoreAllMocks(); container?.remove(); });
    const render = (type: OptimalSettings["testType"], mode: TestMode = "shapes") => {
      AppContextManager.setContext({
        personalData: {firstName: "Alice", lastName: "Smith", gender: "female", age: 28},
        testSettings: {...createOptimalSettings(type), testMode: mode},
        debugMode: "prod",
      });
      container = document.createElement("div");
      document.body.appendChild(container);
      setupResultsScreen(container, new Map([[0, createTrial(400)], [1, createTrial(400)]]));
    };

    it("does not query or display CPI for CR1-3", () => {
      const spy = vi.spyOn(db.tests, "where");
      render("crt1-3");
      expect(container.querySelector("#cpi-result-stat")).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it("uses the latest matching baseline even when another mode is newer", async () => {
      await db.tests.clear();
      await db.tests.put(createTestRecord(1, "svmr", [200], "2026-09-01T10:00:00Z", "Alice|Smith"));
      const words = createTestRecord(2, "svmr", [300], "2026-10-01T10:00:00Z", "Alice|Smith");
      await db.tests.put({...words, testSettings: {...words.testSettings, testMode: "words"}});
      render("crt2-3");
      await vi.waitFor(() => expect(container.querySelector("#cpi-result-value")?.textContent).toContain("200.00"));
      const {getTestsForUser} = await import("../../src/db/operations.ts");
      const result = await getTestsForUser("Alice", "Smith", "words");
      expect(result._tag).toBe("Success");
      if (result._tag === "Success") expect(result.value.map((test) => test.id)).toEqual([2]);
    });

    it("shows missing baseline when only another mode exists", async () => {
      await db.tests.clear();
      await db.tests.put(createTestRecord(1, "svmr", [200], undefined, "Alice|Smith"));
      render("crt2-3", "colors");
      await vi.waitFor(() => expect(container.querySelector('#cpi-result-value [data-localize="cpiNoBaseline"]')).not.toBeNull());
    });

    it("shows database read errors", async () => {
      vi.spyOn(db.tests, "where").mockImplementationOnce(() => { throw new Error("simulated read failure"); });
      render("crt2-3");
      await vi.waitFor(() => expect(container.querySelector('[data-localize="cpiLoadError"]')).not.toBeNull());
      expect(container.querySelector('[data-localize="cpiNoBaseline"]')).toBeNull();
    });
  });
});
