// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from "vitest";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
});

const {
  calculateCpiFromRecords,
  calculateCpiFromStats,
  computeUserProfileCpiSummary,
  getTestStats,
} = await import("../../src/stats/central-processing.ts");
const { ReactionTimeStats } = await import("../../src/stats/ReactionTimeStats.ts");
const { setupProfileScreen } = await import("../../src/screens/user-profile-screen.ts");
const { setupResultsScreen } = await import("../../src/screens/results-screen.ts");
const { LanguageManager } = await import("../../src/localization/LanguageManager.ts");
import AppContextManager from "../../src/config/AppContextManager.ts";
import { db } from "../../src/db/db.ts";
import type { TestRecord, User } from "../../src/db/db.ts";
import type { OptimalSettings, TrialResult } from "../../src/config/domain.ts";

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
      const crtStats = new ReactionTimeStats([createTrial(350), createTrial(370)], 500, 100, "crt1-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt1-3",
        crtDate: "2026-09-01T12:00:00.000Z",
        pzmrDate: "2026-09-01T10:00:00.000Z",
        crtTestId: 2,
        pzmrTestId: 1,
      });

      expect(result.kind).toBe("Available");
      if (result.kind === "Available") {
        expect(result.crtType).toBe("crt1-3");
        expect(result.pzmrMeanMs).toBe(220);
        expect(result.crtMeanMs).toBe(360);
        expect(result.valueMs).toBe(140);
        expect(result.pzmrTestId).toBe(1);
        expect(result.crtTestId).toBe(2);
      }
    });

    it("returns NoBaselinePzmr when pzmrStats is null or undefined", () => {
      const crtStats = new ReactionTimeStats([createTrial(350)], 500, 100, "crt1-3");
      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats: null,
        crtType: "crt1-3",
      });

      expect(result).toEqual({
        kind: "NoBaselinePzmr",
        crtType: "crt1-3",
      });
    });

    it("returns NoValidSamples when CRT stats has no valid reaction times", () => {
      const pzmrStats = new ReactionTimeStats([createTrial(220)], 500, 100, "svmr");
      const crtStats = new ReactionTimeStats([createTrial(350, "Miss")], 500, 100, "crt1-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt1-3",
      });

      expect(result.kind).toBe("NoValidSamples");
      if (result.kind === "NoValidSamples") {
        expect(result.crtType).toBe("crt1-3");
        expect(result.reason).toContain("CRT");
      }
    });

    it("returns NoValidSamples when PZMR stats has no valid reaction times", () => {
      const pzmrStats = new ReactionTimeStats([createTrial(220, "Miss")], 500, 100, "svmr");
      const crtStats = new ReactionTimeStats([createTrial(350)], 500, 100, "crt1-3");

      const result = calculateCpiFromStats({
        crtStats,
        pzmrStats,
        crtType: "crt1-3",
      });

      expect(result.kind).toBe("NoValidSamples");
      if (result.kind === "NoValidSamples") {
        expect(result.crtType).toBe("crt1-3");
        expect(result.reason).toContain("PZMR");
      }
    });
  });

  describe("calculateCpiFromRecords", () => {
    it("returns NoCrtTest when crtTest is not provided", () => {
      const pzmrTest = createTestRecord(1, "svmr", [220, 240]);
      const result = calculateCpiFromRecords(null, pzmrTest, "crt1-3");
      expect(result).toEqual({
        kind: "NoCrtTest",
        crtType: "crt1-3",
      });
    });

    it("returns NoBaselinePzmr when pzmrTest is not provided", () => {
      const crtTest = createTestRecord(2, "crt1-3", [350, 370]);
      const result = calculateCpiFromRecords(crtTest, null, "crt1-3");
      expect(result).toEqual({
        kind: "NoBaselinePzmr",
        crtType: "crt1-3",
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

  describe("computeUserProfileCpiSummary", () => {
    it("handles empty tests array gracefully", () => {
      const summary = computeUserProfileCpiSummary([]);
      expect(summary.cpi13.kind).toBe("NoCrtTest");
      expect(summary.cpi23.kind).toBe("NoCrtTest");
      expect(summary.selectedPzmrTest).toBeNull();
      expect(summary.availablePzmrTests).toEqual([]);
      expect(summary.availableCrt13Tests).toEqual([]);
      expect(summary.availableCrt23Tests).toEqual([]);
    });

    it("automatically picks the newest PZMR and CRT tests", () => {
      const pzmrOlder = createTestRecord(1, "svmr", [250], "2026-09-01T10:00:00.000Z");
      const pzmrNewer = createTestRecord(2, "svmr", [200], "2026-09-02T10:00:00.000Z");
      const crt13Older = createTestRecord(3, "crt1-3", [400], "2026-09-01T11:00:00.000Z");
      const crt13Newer = createTestRecord(4, "crt1-3", [350], "2026-09-02T11:00:00.000Z");
      const crt23Newer = createTestRecord(5, "crt2-3", [450], "2026-09-02T12:00:00.000Z");

      const summary = computeUserProfileCpiSummary([
        pzmrOlder,
        pzmrNewer,
        crt13Older,
        crt13Newer,
        crt23Newer,
      ]);

      expect(summary.selectedPzmrTest?.id).toBe(2);
      expect(summary.selectedCrt13Test?.id).toBe(4);
      expect(summary.selectedCrt23Test?.id).toBe(5);

      expect(summary.cpi13.kind).toBe("Available");
      if (summary.cpi13.kind === "Available") {
        expect(summary.cpi13.valueMs).toBe(150); // 350 - 200
        expect(summary.cpi13.crtTestId).toBe(4);
        expect(summary.cpi13.pzmrTestId).toBe(2);
      }

      expect(summary.cpi23.kind).toBe("Available");
      if (summary.cpi23.kind === "Available") {
        expect(summary.cpi23.valueMs).toBe(250); // 450 - 200
        expect(summary.cpi23.crtTestId).toBe(5);
        expect(summary.cpi23.pzmrTestId).toBe(2);
      }
    });

    it("respects explicit selection of baseline and CRT tests", () => {
      const pzmrOlder = createTestRecord(1, "svmr", [250], "2026-09-01T10:00:00.000Z");
      const pzmrNewer = createTestRecord(2, "svmr", [200], "2026-09-02T10:00:00.000Z");
      const crt13Older = createTestRecord(3, "crt1-3", [400], "2026-09-01T11:00:00.000Z");
      const crt13Newer = createTestRecord(4, "crt1-3", [350], "2026-09-02T11:00:00.000Z");

      const summary = computeUserProfileCpiSummary([pzmrOlder, pzmrNewer, crt13Older, crt13Newer], {
        selectedPzmrId: 1,
        selectedCrt13Id: 3,
      });

      expect(summary.selectedPzmrTest?.id).toBe(1);
      expect(summary.selectedCrt13Test?.id).toBe(3);

      expect(summary.cpi13.kind).toBe("Available");
      if (summary.cpi13.kind === "Available") {
        expect(summary.cpi13.valueMs).toBe(150); // 400 - 250
        expect(summary.cpi13.crtTestId).toBe(3);
        expect(summary.cpi13.pzmrTestId).toBe(1);
      }
    });

    it("handles case where only CRT is available (NoBaselinePzmr)", () => {
      const crt13 = createTestRecord(1, "crt1-3", [350]);
      const summary = computeUserProfileCpiSummary([crt13]);

      expect(summary.cpi13.kind).toBe("NoBaselinePzmr");
      expect(summary.cpi23.kind).toBe("NoCrtTest");
    });
  });

  describe("User Profile Screen CPI Integration", () => {
    const dummyUser: User = {
      firstName: "Test",
      lastName: "Subject",
      gender: "male",
      age: 25,
    };

    it("keeps CPI selection handling after the summary markup is replaced", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const olderPzmr = createTestRecord(1, "svmr", [200, 200], "2026-09-01T10:00:00.000Z");
      const newerPzmr = createTestRecord(2, "svmr", [250, 250], "2026-09-02T10:00:00.000Z");
      const crt13 = createTestRecord(3, "crt1-3", [400, 400], "2026-09-03T10:00:00.000Z");
      const cleanup = setupProfileScreen(container, dummyUser, [olderPzmr, newerPzmr, crt13]);

      const selectBaseline = (id: number): void => {
        const select = container.querySelector<HTMLSelectElement>("#cpi-pzmr-select");
        if (!select) throw new Error("Expected #cpi-pzmr-select in test fixture");
        select.value = String(id);
        select.dispatchEvent(new Event("change", {bubbles: true}));
      };

      selectBaseline(1);
      expect(container.querySelector("#cpi-summary-card")?.textContent).toContain("200.00");
      selectBaseline(2);
      expect(container.querySelector("#cpi-summary-card")?.textContent).toContain("150.00");

      cleanup();
      container.remove();
    });

    it("renders the central processing summary card with 3-column layout and scientific styling", () => {
      LanguageManager.setCurrentLanguage("uk");
      const container = document.createElement("div");
      document.body.appendChild(container);

      const pzmr = createTestRecord(1, "svmr", [200, 200, 200], "2026-09-01T10:00:00.000Z");
      const crt13 = createTestRecord(2, "crt1-3", [350, 350, 350], "2026-09-01T11:00:00.000Z");
      const crt23 = {
        ...createTestRecord(3, "crt2-3", [400, 410, 430, 440], "2026-09-01T12:00:00.000Z"),
        trials: [
          {...createTrial(400), expectedAction: "LEFT" as const, actualAction: "LEFT" as const},
          {...createTrial(410), expectedAction: "LEFT" as const, actualAction: "LEFT" as const},
          {...createTrial(430), expectedAction: "RIGHT" as const, actualAction: "RIGHT" as const},
          {...createTrial(440), expectedAction: "RIGHT" as const, actualAction: "RIGHT" as const},
        ],
      };

      const cleanup = setupProfileScreen(container, dummyUser, [pzmr, crt13, crt23]);

      const summaryCard = container.querySelector("#cpi-summary-card");
      expect(summaryCard).not.toBeNull();

      // Check 3-column grid
      const grid = summaryCard?.querySelector(".grid-cols-1.md\\:grid-cols-3");
      expect(grid).not.toBeNull();
      expect(grid?.children.length).toBe(3);

      // Check scientific mono styling and absence of oversized bright headers
      expect(summaryCard?.querySelector(".font-mono")).not.toBeNull();
      expect(summaryCard?.querySelector(".text-3xl.text-primary")).toBeNull();

      // Check selector option labels: contains date, separator, no internal test ID prefix, and no nested double braces
      const pzmrSelect = summaryCard?.querySelector("#cpi-pzmr-select") as HTMLSelectElement | null;
      expect(pzmrSelect).not.toBeNull();
      const pzmrOption = pzmrSelect?.querySelector("option");
      expect(pzmrOption?.textContent).toContain("·");
      expect(pzmrOption?.textContent).toContain("Останній (Авто)");
      expect(pzmrOption?.textContent).not.toContain("#1");
      expect(pzmrOption?.textContent).not.toContain("(Останній (Авто))");

      // Check calculated numbers in cards
      expect(container.textContent).toContain("150.00"); // 350 - 200
      expect(container.textContent).toContain("220.00"); // 420 - 200
      expect(container.querySelectorAll('[data-localize="statLeftHand"]').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('[data-localize="statRightHand"]').length).toBeGreaterThan(0);
      const cpiCells = container.querySelectorAll(".cpi-card-value");
      expect(cpiCells.length).toBe(2);
      expect(cpiCells[0]?.textContent).toContain("220.00"); // crt23 (newest)
      expect(cpiCells[1]?.textContent).toContain("150.00"); // crt13

      cleanup();
      container.remove();
    });

    it("displays pure Ukrainian localization without English acronyms in UA locale", () => {
      LanguageManager.setCurrentLanguage("uk");
      const container = document.createElement("div");
      document.body.appendChild(container);

      const pzmr = createTestRecord(1, "svmr", [200, 200, 200], "2026-09-01T10:00:00.000Z");
      const crt13 = createTestRecord(2, "crt1-3", [350, 350, 350], "2026-09-01T11:00:00.000Z");

      const cleanup = setupProfileScreen(container, dummyUser, [pzmr, crt13]);

      const summaryCard = container.querySelector("#cpi-summary-card");
      expect(summaryCard).not.toBeNull();
      const text = summaryCard?.textContent ?? "";

      expect(text).toContain("МЦОІ");
      expect(text).toContain("ПЗМР");
      expect(text).toContain("РВ 1-3");
      expect(text).toContain("мс");

      // Purity assertions: no English acronyms or units in UA mode
      expect(text).not.toContain("CRT");
      expect(text).not.toContain("SVMR");
      expect(text).not.toContain("CPI");
      expect(text).not.toContain("MCPO");
      expect(text).not.toMatch(/\bms\b/);

      cleanup();
      container.remove();
    });

    it("displays English localization in EN locale", () => {
      LanguageManager.setCurrentLanguage("en");
      const container = document.createElement("div");
      document.body.appendChild(container);

      const pzmr = createTestRecord(1, "svmr", [200, 200, 200], "2026-09-01T10:00:00.000Z");
      const crt13 = createTestRecord(2, "crt1-3", [350, 350, 350], "2026-09-01T11:00:00.000Z");

      const cleanup = setupProfileScreen(container, dummyUser, [pzmr, crt13]);

      const summaryCard = container.querySelector("#cpi-summary-card");
      expect(summaryCard).not.toBeNull();
      const text = summaryCard?.textContent ?? "";

      expect(text).toContain("CPI");
      expect(text).toContain("SVMR");
      expect(text).toContain("CRT 1-3");
      expect(text).toContain("ms");

      cleanup();
      container.remove();
    });

    it("displays placeholder when no PZMR baseline test is available", () => {
      LanguageManager.setCurrentLanguage("uk");
      const container = document.createElement("div");
      document.body.appendChild(container);

      const crt13 = createTestRecord(2, "crt1-3", [350, 350, 350]);

      const cleanup = setupProfileScreen(container, dummyUser, [crt13]);

      expect(container.querySelector("#cpi-summary-card")).not.toBeNull();
      expect(container.querySelectorAll('[data-localize="cpiNoBaseline"]').length).toBeGreaterThan(0);

      cleanup();
      container.remove();
    });
  });

  describe("Results Screen CPI Integration", () => {
    it("displays a load error instead of no-baseline when the database read fails", async () => {
      const whereSpy = vi.spyOn(db.tests, "where").mockImplementationOnce(() => {
        throw new Error("simulated read failure");
      });
      AppContextManager.setContext({
        personalData: {firstName: "Read", lastName: "Failure", gender: "male", age: 30},
        testSettings: createOptimalSettings("crt1-3"),
        debugMode: "prod",
      });
      const container = document.createElement("div");
      document.body.appendChild(container);

      setupResultsScreen(container, new Map([[0, createTrial(350)]]));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.querySelector('[data-localize="cpiLoadError"]')).not.toBeNull();
      expect(container.querySelector('[data-localize="cpiNoBaseline"]')).toBeNull();

      whereSpy.mockRestore();
      container.remove();
    });

    it("displays CPI in results screen after completing CRT test when baseline PZMR exists in DB", async () => {
      await db.users.clear();
      await db.tests.clear();

      await db.users.put({
        firstName: "Alice",
        lastName: "Smith",
        gender: "female",
        age: 28,
      });

      await db.tests.put(createTestRecord(1, "svmr", [200, 200, 200], "2026-09-01T10:00:00.000Z", "Alice|Smith"));

      AppContextManager.setContext({
        personalData: {
          firstName: "Alice",
          lastName: "Smith",
          gender: "female",
          age: 28,
        },
        testSettings: createOptimalSettings("crt1-3"),
        debugMode: "prod",
      });

      const container = document.createElement("div");
      document.body.appendChild(container);

      const reactionTimes = new Map<number, TrialResult>([
        [0, createTrial(350)],
        [1, createTrial(350)],
      ]);

      setupResultsScreen(container, reactionTimes);

      expect(container.querySelector("#cpi-result-stat")).not.toBeNull();

      // Wait a tick for async loadAndDisplayCpi to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.querySelector("#cpi-result-value")?.textContent).toContain("150.00");

      container.remove();
    });

    it("displays placeholder in results screen when no baseline PZMR exists in DB", async () => {
      await db.users.clear();
      await db.tests.clear();

      AppContextManager.setContext({
        personalData: {
          firstName: "Bob",
          lastName: "NoPzmr",
          gender: "male",
          age: 30,
        },
        testSettings: createOptimalSettings("crt2-3"),
        debugMode: "prod",
      });

      const container = document.createElement("div");
      document.body.appendChild(container);

      const reactionTimes = new Map<number, TrialResult>([
        [0, createTrial(400)],
        [1, createTrial(420)],
      ]);

      setupResultsScreen(container, reactionTimes);

      expect(container.querySelector("#cpi-result-stat")).not.toBeNull();

      // Wait a tick for async loadAndDisplayCpi to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.querySelector("#cpi-result-value")?.querySelector('[data-localize="cpiNoBaseline"]')).not.toBeNull();

      container.remove();
    });
  });
});
