(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

import fs from "node:fs";
import path from "node:path";

import { parseImportedJson, ImportValidationError } from "./import-json";
import { TrialResult } from "../config/domain";

import { ReactionTimeStats } from "../stats/ReactionTimeStats.node";

// --------- Types for output rows ----------
type CsvRow = {
  userKey: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;

  testId: number;
  date: string;
  testMode: string;
  testType: string;
  exposureTime: number;
  exposureDelayMin: number;
  exposureDelayMax: number;
  stimulusSize: number;
  stimulusCount: number;

  // counts
  rtCount: number;

  // stats
  mean: number;
  stdev: number;
  cv: number;
  mode: number | null;
  entropyBits: number;

  // Loskutova
  functionalLevel: number;
  reactionStability: number;
  functionalCapabilities: number;
};

// --------- CSV helpers ----------
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Quote if it contains comma, quote, or newline
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsvLine(headers: string[], row: Record<string, unknown>): string {
  return headers.map((h) => csvEscape(row[h])).join(",");
}

// --------- CLI class ----------
export class ReactionStatsCli {
  static runFromArgv(argv: string[]) {
    const fileArg = argv[2];
    const outputArg = argv[3]; // Optional output file

    if (!fileArg) {
      console.error("Usage: npm run stats -- <path-to-json> [output.csv]");
      console.error("   or: npx tsx src/util/stats-cli.ts <path-to-json> [output.csv]");
      console.error("");
      console.error("If output file is not specified, CSV is written to stdout");
      process.exit(2);
    }

    const fullPath = path.resolve(process.cwd(), fileArg);

    if (!fs.existsSync(fullPath)) {
      console.error(`Error: File not found: ${fullPath}`);
      process.exit(2);
    }

    const rawText = fs.readFileSync(fullPath, "utf-8");

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      console.error("Invalid JSON file (failed to parse).");
      process.exit(2);
    }

    let imported;
    try {
      imported = parseImportedJson(rawJson);
    } catch (e) {
      if (e instanceof ImportValidationError) {
        console.error(`ImportValidationError: ${e.message}`);
      } else {
        console.error("Unknown error while validating import:", e);
      }
      process.exit(2);
    }

    const rows: CsvRow[] = [];

    for (const block of imported) {
      const u = block.user;

      for (const t of block.tests) {
        let trialResults: TrialResult[];

        if (t.trials && Array.isArray(t.trials)) {
          // New format: normalize in case it's missing expectedAction/actualAction
          trialResults = t.trials.map(trial => ({
            ...trial,
            expectedAction: (trial as any).expectedAction || 'DEFAULT',
            actualAction: (trial as any).actualAction || 'DEFAULT'
          }));
        } else {
          // Legacy format (reactionTimes)
          trialResults = t.reactionTimes.map((rt, index) => ({
            trialIndex: index,
            stimulus: 'circle' as any,
            reactionTime: rt,
            outcome: rt > 0 ? "Success" : "Miss",
            expectedAction: 'DEFAULT',
            actualAction: 'DEFAULT',
          }));
        }

        // Use existing calculator
        const stats = new ReactionTimeStats(trialResults);

        const exposureDelay = Array.isArray(t.testSettings.exposureDelay)
          ? t.testSettings.exposureDelay
          : [Number.NaN, Number.NaN];

        const exposureDelayMin = Number(exposureDelay[0]);
        const exposureDelayMax = Number(exposureDelay[1]);

        // Loskutova values (public methods already exist)
        const functionalLevel = stats.calculateFunctionalLevel();
        const reactionStability = stats.calculateReactionStability();
        const functionalCapabilities = stats.calculateFunctionalCapabilities();

        // modeVal can be null in your class
        const mode = stats.modeVal ?? null;

        const row: CsvRow = {
          userKey: t.userKey,
          firstName: u.firstName,
          lastName: u.lastName,
          gender: String(u.gender),
          age: u.age,

          testId: t.id,
          date: t.date,
          testMode: t.testSettings.testMode,
          testType: t.testSettings.testType,
          exposureTime: t.testSettings.exposureTime,
          exposureDelayMin,
          exposureDelayMax,
          stimulusSize: t.testSettings.stimulusSize,
          stimulusCount: t.testSettings.stimulusCount,

          rtCount: stats.count,

          mean: stats.meanVal,
          stdev: stats.stdevVal,
          cv: stats.cvVal,
          mode,
          entropyBits: stats.entropyVal,

          functionalLevel,
          reactionStability,
          functionalCapabilities,
        };

        rows.push(row);
      }
    }

    // Print CSV to stdout (Excel-friendly)
    const headers: Array<keyof CsvRow> = [
      "userKey",
      "firstName",
      "lastName",
      "gender",
      "age",
      "testId",
      "date",
      "testMode",
      "testType",
      "exposureTime",
      "exposureDelayMin",
      "exposureDelayMax",
      "stimulusSize",
      "stimulusCount",
      "rtCount",
      "mean",
      "stdev",
      "cv",
      "mode",
      "entropyBits",
      "functionalLevel",
      "reactionStability",
      "functionalCapabilities",
    ];

    // Build CSV content
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    csvContent += headers.join(",") + "\n";
    for (const r of rows) {
      csvContent += toCsvLine(headers as string[], r as unknown as Record<string, unknown>) + "\n";
    }

    // Write to file or stdout
    if (outputArg) {
      const outputPath = path.resolve(process.cwd(), outputArg);
      fs.writeFileSync(outputPath, csvContent, { encoding: "utf-8" });
      console.error(`✓ CSV written to: ${outputPath}`);
    } else {
      process.stdout.write(csvContent);
    }
  }
}

// Allow running as a script directly:
if (import.meta?.url) {
  // In TS/ESM environments, this works; otherwise harmless.
}

ReactionStatsCli.runFromArgv(process.argv);